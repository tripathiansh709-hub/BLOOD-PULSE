import type { NextRequest } from 'next/server';
import { ApiError } from './http';

// In-memory fixed-window limiter. Fine for one server instance;
// swap for Redis/Upstash when you run multiple instances.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'local';
}

export function rateLimit(req: NextRequest, name: string, limit: number, windowMs: number) {
  const now = Date.now();
  const k = `${name}:${clientIp(req)}`;
  const b = buckets.get(k);
  if (!b || b.resetAt <= now) {
    buckets.set(k, { count: 1, resetAt: now + windowMs });
    return;
  }
  b.count += 1;
  if (b.count > limit) {
    throw new ApiError(429, 'Too many requests, slow down', 'RATE_LIMITED');
  }
}
