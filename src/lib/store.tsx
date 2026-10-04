'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Donor,
  SeekerRequest,
  RelayChannel,
  EmergencyNotification,
  DonorStatus,
} from '@/types';
import {
  INITIAL_DONORS,
  INITIAL_REQUESTS,
  INITIAL_RELAY_CHANNELS,
  INITIAL_HOSPITALS,
} from './mockData';
import { findMatchingDonors, calculateDistanceKm } from './compatibility';
import { soundManager } from './audio';
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

const STORAGE_KEY = 'bloodpulse_emergency_state_v1';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [donors, setDonors] = useState<Donor[]>(INITIAL_DONORS);
  const [currentDonorId, setCurrentDonorIdState] = useState<string>('donor-1');
  const [requests, setRequests] = useState<SeekerRequest[]>(INITIAL_REQUESTS);
  const [relayChannels, setRelayChannels] = useState<RelayChannel[]>(INITIAL_RELAY_CHANNELS);
  const [activeRelayChannelId, setActiveRelayChannelId] = useState<string | null>('relay-chan-101');
  const [currentTab, setCurrentTabState] = useState<AppTab>('HOME');
  const [activeAlert, setActiveAlert] = useState<EmergencyNotification | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isRelayModalOpen, setIsRelayModalOpen] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [isPageTransitioning, setIsPageTransitioning] = useState<boolean>(false);
  const [transitionMessage, setTransitionMessage] = useState<string>('Accessing Emergency Transfusion Grid...');

  // Load from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.donors) setDonors(parsed.donors);
        if (parsed.requests) setRequests(parsed.requests);
        if (parsed.relayChannels) setRelayChannels(parsed.relayChannels);
        if (parsed.currentDonorId) setCurrentDonorIdState(parsed.currentDonorId);
      }
    } catch {
      // LocalStorage error fallback
    }
    setIsHydrated(true);
  }, []);

  // Save to local storage on changes
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          donors,
          requests,
          relayChannels,
          currentDonorId,
        })
      );
    } catch {
      // Ignore quota error
    }
  }, [donors, requests, relayChannels, currentDonorId, isHydrated]);

  const currentDonor = donors.find((d) => d.id === currentDonorId) || donors[0];

  const setCurrentDonorId = (id: string) => {
    setCurrentDonorIdState(id);
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
      prev.map((d) => {
        if (d.id === donorId) {
          return {
            ...d,
            status,
            isEligible: status !== 'OFFLINE' && (!d.cooldownUntil || new Date(d.cooldownUntil) <= new Date()),
          };
        }
        return d;
      })
    );
  };

  // PRD 90-Day Auto-Cooldown Engine
  const completeDonation = (donorId: string) => {
    const now = new Date();
    const cooldownEndDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    setDonors((prev) =>
      prev.map((d) => {
        if (d.id === donorId) {
          return {
            ...d,
            status: 'RECENTLY_DONATED',
            lastDonationDate: now.toISOString(),
            cooldownUntil: cooldownEndDate.toISOString(),
            isEligible: false,
            totalDonations: d.totalDonations + 1,
          };
        }
        return d;
      })
    );

    // If there is an active relay for this donor, mark it fulfilled
    setRelayChannels((prev) =>
      prev.map((ch) => {
        if (ch.donorId === donorId && ch.status === 'ACTIVE') {
          return {
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
          };
        }
        return ch;
      })
    );

    soundManager.playSuccessChime();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#DC2626', '#E11D48', '#FB7185', '#059669'],
    });
  };

  const createEmergencyRequest = (
    reqData: Omit<SeekerRequest, 'id' | 'createdAt' | 'status' | 'dispatchedDonorIds'>
  ): SeekerRequest => {
    const newId = `req-${Date.now().toString().slice(-5)}`;
    
    // Find matching candidate donors
    const matched = findMatchingDonors(
      reqData.recipientBloodType,
      reqData.hospitalLat,
      reqData.hospitalLng,
      reqData.urgency,
      donors,
      50
    );

    const dispatchedDonorIds = matched.map((m) => m.donor.id);

    const newRequest: SeekerRequest = {
      ...reqData,
      id: newId,
      status: 'DISPATCHED',
      createdAt: new Date().toISOString(),
      dispatchedDonorIds,
    };

    setRequests((prev) => [newRequest, ...prev]);

    // Check if current donor is notified
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

    return newRequest;
  };

  const acceptEmergencyRequest = (requestId: string, donorId: string): RelayChannel => {
    const req = requests.find((r) => r.id === requestId);
    const donor = donors.find((d) => d.id === donorId) || currentDonor;

    // Generate masked virtual proxy relay
    const proxyRandom = Math.floor(100 + Math.random() * 900);
    const newChannel: RelayChannel = {
      id: `relay-${Date.now().toString().slice(-6)}`,
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
          senderMaskedName: 'Twilio Virtual Bridge',
          text: `Simulated Virtual Relay Number: +91 800-RELAY-${proxyRandom}. Calls and SMS routed via proxy.`,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    setRelayChannels((prev) => [newChannel, ...prev]);
    setActiveRelayChannelId(newChannel.id);
    setIsRelayModalOpen(true);

    // Update request state
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'MATCHED', acceptedDonorId: donor.id } : r))
    );

    setActiveAlert(null);
    soundManager.playSuccessChime();
    return newChannel;
  };

  const sendChatMessage = (channelId: string, text: string, sender: 'SEEKER' | 'DONOR') => {
    if (!text.trim()) return;
    const channel = relayChannels.find((c) => c.id === channelId);
    if (!channel) return;

    const senderMaskedName = sender === 'DONOR' ? `Donor ${channel.donorMaskedCode}` : channel.seekerContactMasked;

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender,
      senderMaskedName,
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setRelayChannels((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, messages: [...c.messages, newMsg] } : c))
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

  const resetToDefaults = () => {
    setDonors(INITIAL_DONORS);
    setRequests(INITIAL_REQUESTS);
    setRelayChannels(INITIAL_RELAY_CHANNELS);
    setCurrentDonorIdState('donor-1');
    setActiveRelayChannelId('relay-chan-101');
    setActiveAlert(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
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
        hospitals: INITIAL_HOSPITALS,
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
