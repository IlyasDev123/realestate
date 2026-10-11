import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

// Headers that must not be forwarded to the browser:
// - content-encoding: Node.js fetch already decompresses the body; forwarding
//   the header would cause the browser to double-decompress and corrupt the data.
// - transfer-encoding: only meaningful for chunked streaming; we buffer the body.
// - set-cookie: the cookie Domain would be the backend domain, not localhost/this
//   origin; Firefox throws an XrayWrapper security error when it sees a cross-origin
//   cookie in a same-origin response.
// - connection: hop-by-hop, must not be forwarded per HTTP spec.
const HOP_BY_HOP = new Set([
  'content-encoding',
  'transfer-encoding',
  'set-cookie',
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'upgrade',
]);

type Ctx = { params: Promise<{ path: string[] }> };

async function handler(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  const search = request.nextUrl.search;
  const targetUrl = `${BACKEND}/${path.join('/')}${search}`;

  // Forward all request headers except host/connection
  const reqHeaders = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower !== 'host' && lower !== 'connection') {
      reqHeaders.set(key, value);
    }
  });

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  const reqBody = hasBody ? await request.arrayBuffer() : undefined;

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      method: request.method,
      headers: reqHeaders,
      body: reqBody,
    });
  } catch {
    return NextResponse.json({ message: 'Backend unreachable' }, { status: 502 });
  }

  // Buffer the body — Node.js fetch already decoded any Content-Encoding (gzip etc.)
  // so the buffer contains plain decompressed bytes.
  const body = await upstream.arrayBuffer();

  // Copy response headers, stripping hop-by-hop and problematic cross-origin ones
  const resHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      resHeaders.set(key, value);
    }
  });

  return new NextResponse(body, {
    status: upstream.status,
    headers: resHeaders,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const HEAD = handler;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
