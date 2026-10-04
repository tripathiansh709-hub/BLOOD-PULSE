/**
 * OPTIONAL typed client for the backend. Nothing in the UI imports this yet —
 * when you are ready, call these from src/lib/store.tsx instead of local state.
 * It reuses the exact types the UI already has, so no UI markup has to change.
 */
import type {
  Donor,
  DonorStatus,
  EmergencyNotification,
  RelayChannel,
  SeekerRequest,
  TransfusionMatchResult,
  ChatMessage,
} from '@/types';

type Envelope<T> = { success: true; data: T } | { success: false; error: { code: string; message: string } };

export class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
  }
}

async function call<T>(path: string, init?: RequestInit & { token?: string }): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.token ? { Authorization: `Bearer ${init.token}` } : {}),
      ...init?.headers,
    },
  });
  const json = (await res.json()) as Envelope<T>;
  if (!json.success) throw new ApiClientError(json.error.code, json.error.message);
  return json.data;
}

const post = <T>(path: string, body?: unknown, token?: string) =>
  call<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body), token });

export const api = {
  hospitals: () => call<{ id: string; name: string; address: string; lat: number; lng: number; emergencyPhoneMasked: string }[]>('/hospitals'),
  stats: () => call<Record<string, unknown>>('/stats'),

  donors: {
    list: (params: Record<string, string | number> = {}) =>
      call<Donor[]>(`/donors?${new URLSearchParams(params as Record<string, string>)}`),
    get: (id: string) => call<Donor>(`/donors/${id}`),
    register: (body: unknown) => post<{ donor: Donor; accessToken: string }>('/donors', body),
    setStatus: (id: string, status: DonorStatus, token?: string) => post<Donor>(`/donors/${id}/status`, { status }, token),
    completeDonation: (id: string, token?: string) => post<Donor>(`/donors/${id}/donate`, undefined, token),
    alerts: (id: string, token?: string) => call<EmergencyNotification[]>(`/donors/${id}/alerts`, { token }),
    channels: (id: string, token?: string) => call<RelayChannel[]>(`/donors/${id}/channels`, { token }),
  },

  requests: {
    list: (status?: string) => call<SeekerRequest[]>(`/requests${status ? `?status=${status}` : ''}`),
    get: (id: string) => call<SeekerRequest>(`/requests/${id}`),
    create: (body: unknown) =>
      post<{ request: SeekerRequest; matches: TransfusionMatchResult[]; seekerToken: string }>('/requests', body),
    matches: (id: string) => call<TransfusionMatchResult[]>(`/requests/${id}/matches`),
    accept: (id: string, donorId: string, actor: 'DONOR' | 'SEEKER', token?: string) =>
      post<RelayChannel>(`/requests/${id}/accept`, { donorId, actor }, token),
    cancel: (id: string, token?: string) => post<SeekerRequest>(`/requests/${id}/cancel`, undefined, token),
  },

  relay: {
    get: (id: string, token?: string) => call<RelayChannel>(`/relay/${id}`, { token }),
    send: (id: string, sender: 'DONOR' | 'SEEKER', text: string, token?: string) =>
      post<ChatMessage>(`/relay/${id}/messages`, { sender, text }, token),
  },

  /** Live updates. Returns a function that closes the stream. */
  subscribe(
    target: { donorId?: string; requestId?: string; channelId?: string; token?: string },
    handlers: Partial<Record<'EMERGENCY_ALERT' | 'REQUEST_MATCHED' | 'REQUEST_CANCELLED' | 'RELAY_MESSAGE' | 'DONATION_COMPLETED', (payload: unknown) => void>>
  ) {
    const qs = new URLSearchParams(Object.entries(target).filter(([, v]) => v) as [string, string][]);
    const es = new EventSource(`/api/events?${qs}`);
    for (const [event, fn] of Object.entries(handlers)) {
      es.addEventListener(event, (e) => fn?.(JSON.parse((e as MessageEvent).data)));
    }
    return () => es.close();
  },
};
