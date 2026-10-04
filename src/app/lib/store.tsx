'use client';

/**
 * BloodPulse global store — now backed by the real API (src/app/api/**).
 *
 * The context shape and every action signature are IDENTICAL to the previous local-only
 * version, so no component needs to change. How it stays synchronous:
 *
 *   OPTIMISTIC UI  ->  every action updates local state immediately (using client-generated
 *                      ids the server adopts), then syncs to the API in the background.
 *   RECONCILE      ->  when the server answers, its version replaces the optimistic one.
 *   ROLLBACK       ->  if the server rejects (e.g. "another donor already accepted"), the
 *                      store reloads server truth.
 *   OFFLINE-SAFE   ->  if the API is unreachable, the app keeps working on local demo data.
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  Donor,
  SeekerRequest,
  RelayChannel,
  EmergencyNotification,
  DonorStatus,
  ChatMessage,
} from '@/types';
import {
  INITIAL_DONORS,
  INITIAL_REQUESTS,
  INITIAL_RELAY_CHANNELS,
  INITIAL_HOSPITALS,
} from './mockData';
import { findMatchingDonors, calculateDistanceKm } from './compatibility';
import { soundManager } from './audio';
import { api, ApiClientError } from './api-client';
import confetti from 'canvas-confetti';

export type AppTab = 'HOME' | 'SEEKER' | 'DONOR' | 'RADAR' | 'MATRIX' | 'PRIVACY' | 'ABOUT';

interface AppContextType {
  donors: Donor[];
  currentDonor: Donor;
  requests: SeekerRequest[];
  relayChannels: RelayChannel[];
  activeRelayChannelId: string | null;
  currentTab: AppTab;
  activeAlert: EmergencyNotification | null;
  soundEnabled: boolean;
  isRelayModalOpen: boolean;
  isPageTransitioning: boolean;
  transitionMessage: string;
  hospitals: typeof INITIAL_HOSPITALS;

  // Extras (new, unused by existing components)
  apiOnline: boolean;
  refreshData: () => Promise<void>;

  // Actions
  setCurrentTab: (tab: AppTab) => void;
  setCurrentDonorId: (donorId: string) => void;
  toggleDonorStatus: (donorId: string, status: DonorStatus) => void;
  completeDonation: (donorId: string) => void;
  createEmergencyRequest: (req: Omit<SeekerRequest, 'id' | 'createdAt' | 'status' | 'dispatchedDonorIds'>) => SeekerRequest;
  acceptEmergencyRequest: (requestId: string, donorId: string) => RelayChannel;
  sendChatMessage: (channelId: string, text: string, sender: 'SEEKER' | 'DONOR') => void;
  dismissAlert: () => void;
  triggerSimulatedAlert: () => void;
  openRelayModal: (channelId: string) => void;
  closeRelayModal: () => void;
  toggleSound: () => void;
  resetToDefaults: () => void;
  triggerTransition: (message?: string, callback?: () => void) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const DONOR_KEY = 'bloodpulse_current_donor_v1';
const TOKEN_KEY = 'bloodpulse_tokens_v1';
const POLL_MS = 20_000;

// Errors that must NOT trigger a rollback (keep the local optimistic copy, just warn).
const SOFT_ERRORS = new Set(['VALIDATION_ERROR', 'RATE_LIMITED', 'INTERNAL', 'BAD_JSON']);

type Tokens = { donors: Record<string, string>; requests: Record<string, string> };

function loadTokens(): Tokens {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (raw) return JSON.parse(raw) as Tokens;
  } catch {
    // ignore
  }
  return { donors: {}, requests: {} };
}

// Client-generated ids (match the server's /^[A-Za-z0-9_-]{6,40}$/ rule)
const uid = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Initial state = bundled demo data, so the UI renders instantly (and works offline).
  const [donors, setDonors] = useState<Donor[]>(INITIAL_DONORS);
  const [currentDonorId, setCurrentDonorIdState] = useState<string>('donor-1');
  const [requests, setRequests] = useState<SeekerRequest[]>(INITIAL_REQUESTS);
  const [relayChannels, setRelayChannels] = useState<RelayChannel[]>(INITIAL_RELAY_CHANNELS);
  const [hospitals, setHospitals] = useState<typeof INITIAL_HOSPITALS>(INITIAL_HOSPITALS);
  const [activeRelayChannelId, setActiveRelayChannelId] = useState<string | null>('relay-chan-101');
  const [currentTab, setCurrentTabState] = useState<AppTab>('HOME');
  const [activeAlert, setActiveAlert] = useState<EmergencyNotification | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isRelayModalOpen, setIsRelayModalOpen] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [isPageTransitioning, setIsPageTransitioning] = useState<boolean>(false);
  const [transitionMessage, setTransitionMessage] = useState<string>('Accessing Emergency Transfusion Grid...');
  const [apiOnline, setApiOnline] = useState<boolean>(false);
  const [syncedChannels, setSyncedChannels] = useState<string[]>([]);

  // Refs so async callbacks always see current values without re-creating functions
  const pending = useRef(0); // in-flight writes; refresh waits so it can't clobber optimistic state
  const tokensRef = useRef<Tokens>({ donors: {}, requests: {} });
  const currentDonorIdRef = useRef<string>('donor-1');
  const activeAlertRef = useRef<EmergencyNotification | null>(null);
  const gates = useRef<Map<string, Promise<void>>>(new Map()); // orders dependent writes (create -> accept -> message)
  activeAlertRef.current = activeAlert;

  const currentDonor = donors.find((d) => d.id === currentDonorId) || donors[0];

  const saveTokens = () => {
    try {
      localStorage.setItem(TOKEN_KEY, JSON.stringify(tokensRef.current));
    } catch {
      // ignore
    }
  };

  const markSynced = (id: string) => setSyncedChannels((prev) => (prev.includes(id) ? prev : [...prev, id]));

  // ---------------------------------------------------------------------------
  // Pull server truth
  // ---------------------------------------------------------------------------
  const refreshData = useCallback(async () => {
    try {
      const donorId = currentDonorIdRef.current;
      const donorToken = tokensRef.current.donors[donorId];

      const [hs, ds, rs, me, myChannels] = await Promise.all([
        api.hospitals(),
        api.donors.list({ limit: 200 }),
        api.requests.list(),
        api.donors.get(donorId).catch(() => null),
        api.donors.channels(donorId, donorToken).catch(() => [] as RelayChannel[]),
      ]);

      // Channels for requests this browser started as a seeker (donors' channels come from above)
      const channels = new Map<string, RelayChannel>(myChannels.map((c) => [c.id, c]));
      const extra = rs.filter((r) => r.relayChannelId && !channels.has(r.relayChannelId)).slice(0, 20);
      const fetched = await Promise.allSettled(
        extra.map((r) =>
          api.relay.get(r.relayChannelId as string, tokensRef.current.requests[r.id] ?? donorToken)
        )
      );
      fetched.forEach((f) => {
        if (f.status === 'fulfilled') channels.set(f.value.id, f.value);
      });

      // A write started while we were fetching: don't overwrite its optimistic state.
      if (pending.current > 0) return;

      if (hs.length > 0) setHospitals(hs);
      if (ds.length > 0) {
        // exact coordinates for "me", rounded public ones for everyone else
        const merged = ds.map((d) => (me && d.id === me.id ? me : d));
        if (me && !merged.some((d) => d.id === me.id)) merged.unshift(me);
        setDonors(merged);
      }
      setRequests(rs);
      setRelayChannels(Array.from(channels.values()));
      setSyncedChannels(Array.from(channels.keys()));
      setApiOnline(true);
    } catch {
      setApiOnline(false); // API unreachable: keep working on local data
    }
  }, []);

  /** Runs a background write: tracks in-flight count, reconciles on success, rolls back on conflict. */
  const run = useCallback(
    function <T>(p: Promise<T>, onOk?: (v: T) => void): Promise<void> {
      pending.current += 1;
      let rollback = false;
      return p
        .then((v) => {
          setApiOnline(true);
          onOk?.(v);
        })
        .catch((e: unknown) => {
          console.warn('[bloodpulse] API call failed:', e);
          if (e instanceof ApiClientError) {
            if (!SOFT_ERRORS.has(e.code)) rollback = true; // server said no -> restore server truth
          } else {
            setApiOnline(false); // network error -> stay optimistic/local
          }
        })
        .finally(() => {
          pending.current -= 1;
          if (rollback) void refreshData();
        });
    },
    [refreshData]
  );

  const replaceDonor = (d: Donor) => setDonors((prev) => prev.map((x) => (x.id === d.id ? d : x)));

  // ---------------------------------------------------------------------------
  // Boot, polling, live events
  // ---------------------------------------------------------------------------
  useEffect(() => {
    tokensRef.current = loadTokens();
    try {
      const saved = localStorage.getItem(DONOR_KEY);
      if (saved) {
        currentDonorIdRef.current = saved;
        setCurrentDonorIdState(saved);
      }
    } catch {
      // ignore
    }
    setIsHydrated(true);
    void refreshData();
  }, [refreshData]);

  // Safety-net polling (also covers other users' changes if the live stream drops)
  useEffect(() => {
    if (!isHydrated) return;
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') void refreshData();
    }, POLL_MS);
    return () => clearInterval(t);
  }, [isHydrated, refreshData]);

  // Live stream for the current donor: emergency alerts + match/cancel/donation events
  useEffect(() => {
    if (!isHydrated || !apiOnline) return;
    let close = () => {};
    try {
      close = api.subscribe(
        { donorId: currentDonorId, token: tokensRef.current.donors[currentDonorId] },
        {
          EMERGENCY_ALERT: (payload) => {
            const alert = payload as EmergencyNotification;
            if (activeAlertRef.current?.requestId === alert.requestId) return; // already showing it
            setActiveAlert(alert);
            soundManager.playEmergencyAlert();
            void refreshData();
          },
          REQUEST_MATCHED: () => void refreshData(),
          REQUEST_CANCELLED: () => void refreshData(),
          DONATION_COMPLETED: () => void refreshData(),
        }
      );
    } catch {
      // EventSource unavailable; polling still works
    }
    return () => close();
  }, [currentDonorId, isHydrated, apiOnline, refreshData]);

  // Live chat for the open relay channel (only once the server knows the channel)
  const activeChannelSynced = activeRelayChannelId ? syncedChannels.includes(activeRelayChannelId) : false;
  useEffect(() => {
    if (!isHydrated || !activeRelayChannelId || !activeChannelSynced) return;
    const channel = relayChannels.find((c) => c.id === activeRelayChannelId);
    const token = channel
      ? tokensRef.current.requests[channel.requestId] ?? tokensRef.current.donors[channel.donorId]
      : undefined;
    let close = () => {};
    try {
      close = api.subscribe(
        { channelId: activeRelayChannelId, token },
        {
          RELAY_MESSAGE: (payload) => {
            const msg = payload as ChatMessage;
            setRelayChannels((prev) =>
              prev.map((c) =>
                c.id === activeRelayChannelId && !c.messages.some((m) => m.id === msg.id)
                  ? { ...c, messages: [...c.messages, msg] }
                  : c
              )
            );
          },
          DONATION_COMPLETED: () => void refreshData(),
        }
      );
    } catch {
      // ignore
    }
    return () => close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRelayChannelId, activeChannelSynced, isHydrated, refreshData]);

  // ---------------------------------------------------------------------------
  // Actions (same names + signatures as before)
  // ---------------------------------------------------------------------------
  const setCurrentDonorId = (id: string) => {
    currentDonorIdRef.current = id;
    setCurrentDonorIdState(id);
    try {
      localStorage.setItem(DONOR_KEY, id);
    } catch {
      // ignore
    }
    void refreshData();
  };

  const triggerTransition = (message?: string, callback?: () => void) => {
    setTransitionMessage(message || 'Accessing Emergency Transfusion Grid...');
    setIsPageTransitioning(true);
    soundManager.playRadarPing();

    setTimeout(() => {
      if (callback) callback();
      setIsPageTransitioning(false);
    }, 450);
  };

  const setCurrentTab = (tab: AppTab) => {
    triggerTransition(`Loading ${tab === 'MATRIX' ? 'Biological Matrix' : tab} Portal...`, () => {
      setCurrentTabState(tab);
    });
  };

  const toggleDonorStatus = (donorId: string, status: DonorStatus) => {
    setDonors((prev) =>
      prev.map((d) =>
        d.id === donorId
          ? {
              ...d,
              status,
              isEligible: status !== 'OFFLINE' && (!d.cooldownUntil || new Date(d.cooldownUntil) <= new Date()),
            }
          : d
      )
    );
    void run(api.donors.setStatus(donorId, status, tokensRef.current.donors[donorId]), replaceDonor);
  };

  // 90-day auto-cooldown engine (server is the source of truth, local mirrors it instantly)
  const completeDonation = (donorId: string) => {
    const now = new Date();
    const cooldownEndDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    setDonors((prev) =>
      prev.map((d) =>
        d.id === donorId
          ? {
              ...d,
              status: 'RECENTLY_DONATED',
              lastDonationDate: now.toISOString(),
              cooldownUntil: cooldownEndDate.toISOString(),
              isEligible: false,
              totalDonations: d.totalDonations + 1,
            }
          : d
      )
    );

    setRelayChannels((prev) =>
      prev.map((ch) =>
        ch.donorId === donorId && ch.status === 'ACTIVE'
          ? {
              ...ch,
              status: 'FULFILLED',
              messages: [
                ...ch.messages,
                {
                  id: `msg-${Date.now()}`,
                  sender: 'SYSTEM',
                  senderMaskedName: 'BloodPulse Protocol',
                  text: 'Donation successfully verified! 90-day biological safety cooldown activated. Channel fulfilled.',
                  timestamp: new Date().toISOString(),
                },
              ],
            }
          : ch
      )
    );

    soundManager.playSuccessChime();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#DC2626', '#E11D48', '#FB7185', '#059669'],
    });

    // Server fulfils the channels + matched requests; reload so request status updates too.
    void run(api.donors.completeDonation(donorId, tokensRef.current.donors[donorId]), (d) => {
      replaceDonor(d);
      void refreshData();
    });
  };

  const createEmergencyRequest = (
    reqData: Omit<SeekerRequest, 'id' | 'createdAt' | 'status' | 'dispatchedDonorIds'>
  ): SeekerRequest => {
    const newId = uid('req');

    // Instant local match (same algorithm the server uses); server result replaces it below.
    const matched = findMatchingDonors(
      reqData.recipientBloodType,
      reqData.hospitalLat,
      reqData.hospitalLng,
      reqData.urgency,
      donors,
      50
    );

    const newRequest: SeekerRequest = {
      ...reqData,
      id: newId,
      status: matched.length > 0 ? 'DISPATCHED' : 'ACTIVE',
      createdAt: new Date().toISOString(),
      dispatchedDonorIds: matched.map((m) => m.donor.id),
    };

    setRequests((prev) => [newRequest, ...prev]);

    const currentMatches = matched.find((m) => m.donor.id === currentDonor.id);
    if (currentMatches && currentDonor.status === 'AVAILABLE') {
      const distance = calculateDistanceKm(
        reqData.hospitalLat,
        reqData.hospitalLng,
        currentDonor.lat,
        currentDonor.lng
      );
      setActiveAlert({
        id: `alert-${Date.now()}`,
        requestId: newId,
        hospitalName: reqData.hospitalName,
        hospitalAddress: reqData.hospitalAddress,
        bloodType: reqData.recipientBloodType,
        unitsRequired: reqData.unitsRequired,
        urgency: reqData.urgency,
        distanceKm: distance,
        createdAt: new Date().toISOString(),
      });
      soundManager.playEmergencyAlert();
    } else {
      soundManager.playRadarPing();
    }

    // Background sync: server adopts our id, re-matches, stores a seeker token (strict mode).
    gates.current.set(
      newId,
      run(api.requests.create({ ...reqData, id: newId }), (res) => {
        tokensRef.current.requests[newId] = res.seekerToken;
        saveTokens();
        setRequests((prev) => prev.map((r) => (r.id === newId ? res.request : r)));
      })
    );

    return newRequest;
  };

  const acceptEmergencyRequest = (requestId: string, donorId: string): RelayChannel => {
    const req = requests.find((r) => r.id === requestId);
    const donor = donors.find((d) => d.id === donorId) || currentDonor;

    const proxyRandom = Math.floor(100 + Math.random() * 900);
    const channelId = uid('relay');
    const newChannel: RelayChannel = {
      id: channelId,
      requestId,
      seekerContactMasked: req?.contactName || 'Hospital Emergency Desk',
      donorId: donor.id,
      donorMaskedCode: donor.maskedCode,
      virtualProxyNumber: `+91 800-RELAY-${proxyRandom}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'ACTIVE',
      hospitalName: req?.hospitalName || 'Emergency Trauma Center',
      bloodType: req?.recipientBloodType || donor.bloodType,
      unitsRequired: req?.unitsRequired || 1,
      messages: [
        {
          id: `msg-${Date.now()}-1`,
          sender: 'SYSTEM',
          senderMaskedName: 'BloodPulse Privacy Core',
          text: `Virtual Proxy Relay initialized (${donor.maskedCode} <-> ${req?.hospitalName}). Direct contact numbers remain encrypted and masked. Valid for 24 hours.`,
          timestamp: new Date().toISOString(),
        },
        {
          id: `msg-${Date.now()}-2`,
          sender: 'SYSTEM',
          senderMaskedName: 'BloodPulse Virtual Bridge',
          text: `Virtual Relay Number: +91 800-RELAY-${proxyRandom}. Calls and SMS routed via proxy.`,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    setRelayChannels((prev) => [newChannel, ...prev]);
    setActiveRelayChannelId(newChannel.id);
    setIsRelayModalOpen(true);
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'MATCHED', acceptedDonorId: donor.id } : r))
    );
    setActiveAlert(null);
    soundManager.playSuccessChime();

    // Simulated demo alerts (req-sim-*) have no server record: stay local-only.
    if (!requestId.startsWith('req-sim')) {
      // If this browser created the request it holds the seeker token; otherwise it is the donor.
      const seekerToken = tokensRef.current.requests[requestId];
      const actor = seekerToken ? 'SEEKER' : 'DONOR';
      const token = seekerToken ?? tokensRef.current.donors[donor.id];
      const waitFor = gates.current.get(requestId) ?? Promise.resolve();

      gates.current.set(
        channelId,
        waitFor.then(() =>
          run(api.requests.accept(requestId, donor.id, actor, { token, channelId }), (ch) => {
            setRelayChannels((prev) => prev.map((c) => (c.id === ch.id ? ch : c)));
            markSynced(ch.id);
          })
        )
      );
    }

    return newChannel;
  };

  const sendChatMessage = (channelId: string, text: string, sender: 'SEEKER' | 'DONOR') => {
    if (!text.trim()) return;
    const channel = relayChannels.find((c) => c.id === channelId);
    if (!channel) return;

    const senderMaskedName = sender === 'DONOR' ? `Donor ${channel.donorMaskedCode}` : channel.seekerContactMasked;
    const messageId = uid('msg');
    const newMsg: ChatMessage = {
      id: messageId,
      sender,
      senderMaskedName,
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setRelayChannels((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, messages: [...c.messages, newMsg] } : c))
    );

    const token =
      sender === 'SEEKER'
        ? tokensRef.current.requests[channel.requestId]
        : tokensRef.current.donors[channel.donorId];
    const waitFor = gates.current.get(channelId) ?? Promise.resolve();

    void waitFor.then(() =>
      run(api.relay.send(channelId, sender, newMsg.text, { token, messageId }), (saved) => {
        // server may have redacted phone numbers/emails — adopt its version
        setRelayChannels((prev) =>
          prev.map((c) =>
            c.id === channelId ? { ...c, messages: c.messages.map((m) => (m.id === messageId ? saved : m)) } : c
          )
        );
      })
    );
  };

  const dismissAlert = () => {
    setActiveAlert(null);
  };

  const triggerSimulatedAlert = () => {
    const randomHospital = INITIAL_HOSPITALS[Math.floor(Math.random() * INITIAL_HOSPITALS.length)];
    const distance = calculateDistanceKm(
      randomHospital.lat,
      randomHospital.lng,
      currentDonor.lat,
      currentDonor.lng
    );

    setActiveAlert({
      id: `alert-sim-${Date.now()}`,
      requestId: 'req-sim-99',
      hospitalName: randomHospital.name,
      hospitalAddress: randomHospital.address,
      bloodType: currentDonor.bloodType,
      unitsRequired: 2,
      urgency: 'IMMEDIATE',
      distanceKm: distance,
      createdAt: new Date().toISOString(),
    });

    soundManager.playEmergencyAlert();
  };

  const openRelayModal = (channelId: string) => {
    setActiveRelayChannelId(channelId);
    setIsRelayModalOpen(true);
  };

  const closeRelayModal = () => {
    setIsRelayModalOpen(false);
  };

  const toggleSound = () => {
    const newState = soundManager.toggleSound();
    setSoundEnabled(newState);
  };

  /**
   * Resets the browser to demo defaults, then reloads whatever the server has.
   * To wipe the DATABASE itself, run `npm run db:reset` in the terminal.
   */
  const resetToDefaults = () => {
    setDonors(INITIAL_DONORS);
    setRequests(INITIAL_REQUESTS);
    setRelayChannels(INITIAL_RELAY_CHANNELS);
    setHospitals(INITIAL_HOSPITALS);
    setCurrentDonorIdState('donor-1');
    currentDonorIdRef.current = 'donor-1';
    setActiveRelayChannelId('relay-chan-101');
    setActiveAlert(null);
    tokensRef.current = { donors: {}, requests: {} };
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(DONOR_KEY);
    } catch {
      // ignore
    }
    void refreshData();
  };

  return (
    <AppContext.Provider
      value={{
        donors,
        currentDonor,
        requests,
        relayChannels,
        activeRelayChannelId,
        currentTab,
        activeAlert,
        soundEnabled,
        isRelayModalOpen,
        isPageTransitioning,
        transitionMessage,
        hospitals,
        apiOnline,
        refreshData,
        setCurrentTab,
        setCurrentDonorId,
        toggleDonorStatus,
        completeDonation,
        createEmergencyRequest,
        acceptEmergencyRequest,
        sendChatMessage,
        dismissAlert,
        triggerSimulatedAlert,
        openRelayModal,
        closeRelayModal,
        toggleSound,
        resetToDefaults,
        triggerTransition,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
