import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { ZodError, ZodTypeAny, z } from 'zod';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code: string = 'ERROR'
  ) {
    super(message);
  }
}

const allowedOrigins = () =>
  (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get('origin');
  if (origin && allowedOrigins().includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      Vary: 'Origin',
    };
  }
  return {};
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

type Handler<C> = (req: NextRequest, ctx: C) => Promise<Response>;

/** Wraps a route handler: CORS headers + uniform JSON errors. */
export function handle<C = unknown>(fn: Handler<C>) {
  return async (req: NextRequest, ctx: C): Promise<Response> => {
    let res: Response;
    try {
      res = await fn(req, ctx);
    } catch (e) {
      res = toErrorResponse(e);
    }
    for (const [k, v] of Object.entries(corsHeaders(req))) res.headers.set(k, v);
    return res;
  };
}

/** Reusable OPTIONS handler for preflight requests. */
export function preflight(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

function toErrorResponse(e: unknown): Response {
  if (e instanceof ApiError) {
    return NextResponse.json({ success: false, error: { code: e.code, message: e.message } }, { status: e.status });
  }
  if (e instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: e.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        },
      },
      { status: 400 }
    );
  }
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
    return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Record not found' } }, { status: 404 });
  }
  console.error('[api] unhandled error', e);
  return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Internal server error' } }, { status: 500 });
}

export async function parseBody<S extends ZodTypeAny>(req: NextRequest, schema: S): Promise<z.infer<S>> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new ApiError(400, 'Request body must be valid JSON', 'BAD_JSON');
  }
  return schema.parse(json);
}

export function parseQuery<S extends ZodTypeAny>(req: NextRequest, schema: S): z.infer<S> {
  return schema.parse(Object.fromEntries(req.nextUrl.searchParams.entries()));
}
