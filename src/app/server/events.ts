import { EventEmitter } from 'events';

// In-memory pub/sub powering the Server-Sent Events stream (/api/events).
// Single-instance only; use Redis pub/sub if you deploy multiple instances.
const g = globalThis as unknown as { __bus?: EventEmitter };
export const bus = g.__bus ?? new EventEmitter();
bus.setMaxListeners(0);
g.__bus = bus;

export type Topic = `donor:${string}` | `request:${string}` | `channel:${string}`;

export interface BusEvent {
  type: 'EMERGENCY_ALERT' | 'REQUEST_MATCHED' | 'REQUEST_CANCELLED' | 'RELAY_MESSAGE' | 'DONATION_COMPLETED';
  payload: unknown;
}

export function publish(topic: Topic, event: BusEvent) {
  bus.emit(topic, event);
}

export function subscribe(topic: Topic, fn: (e: BusEvent) => void) {
  bus.on(topic, fn);
  return () => bus.off(topic, fn);
}
