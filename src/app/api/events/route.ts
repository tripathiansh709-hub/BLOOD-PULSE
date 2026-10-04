import { z } from 'zod';
import { assertDonorAccess, assertParticipant, assertSeekerAccess } from '@/server/auth';
import { db } from '@/server/db';
import { ApiError, handle, parseQuery } from '@/server/http';
import { subscribe, type Topic } from '@/server/events';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const Q = z.object({
  donorId: z.string().optional(),
  requestId: z.string().optional(),
  channelId: z.string().optional(),
  token: z.string().optional(), // EventSource cannot set headers, so strict mode passes the token here
});

/**
 * Server-Sent Events stream. Usage (browser):
 *   new EventSource('/api/events?donorId=abc')   -> EMERGENCY_ALERT, REQUEST_MATCHED...
 *   new EventSource('/api/events?requestId=xyz') -> REQUEST_MATCHED, DONATION_COMPLETED
 *   new EventSource('/api/events?channelId=123') -> RELAY_MESSAGE
 */
export const GET = handle(async (req) => {
  const q = parseQuery(req, Q);
  const topics: Topic[] = [];

  if (q.donorId) {
    await assertDonorAccess(q.token ?? null, q.donorId);
    topics.push(`donor:${q.donorId}`);
  }
  if (q.requestId) {
    await assertSeekerAccess(q.token ?? null, q.requestId);
    topics.push(`request:${q.requestId}`);
  }
  if (q.channelId) {
    const ch = await db.relayChannel.findUnique({
      where: { id: q.channelId },
      select: { donorId: true, requestId: true },
    });
    if (!ch) throw new ApiError(404, 'Relay channel not found', 'NOT_FOUND');
    await assertParticipant(q.token ?? null, ch.donorId, ch.requestId);
    topics.push(`channel:${q.channelId}`);
  }
  if (topics.length === 0) throw new ApiError(400, 'Provide donorId, requestId or channelId', 'VALIDATION_ERROR');

  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));

      send('ready', { topics });
      const unsubs = topics.map((t) => subscribe(t, (e) => send(e.type, e.payload)));
      const heartbeat = setInterval(() => controller.enqueue(encoder.encode(': ping\n\n')), 25_000);

      cleanup = () => {
        clearInterval(heartbeat);
        unsubs.forEach((u) => u());
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };
      req.signal.addEventListener('abort', cleanup);
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
});
