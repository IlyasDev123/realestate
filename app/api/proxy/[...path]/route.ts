import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

type Ctx = { params: Promise<{ path: string[] }> };

async function handler(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  const search = request.nextUrl.search;
  const targetUrl = `${BACKEND}/${path.join('/')}${search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower !== 'host' && lower !== 'connection') {
      headers.set(key, value);
    }
  });

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  const body = hasBody ? await request.arrayBuffer() : undefined;

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: body ? body : undefined,
    });
  } catch {
    return NextResponse.json({ message: 'Backend unreachable' }, { status: 502 });
  }

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete('transfer-encoding');
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  responseHeaders.set('Access-Control-Allow-Headers', 'Authorization,Content-Type,Accept');

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const HEAD = handler;

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization,Content-Type,Accept',
      'Access-Control-Max-Age': '86400',
    },
  });
}
