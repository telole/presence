import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { supabaseAdmin } from './supabaseAdmin';

export class UnauthorizedError extends Error {
  status = 401;

  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class BadRequestError extends Error {
  status = 400;

  constructor(message = 'Bad Request') {
    super(message);
    this.name = 'BadRequestError';
  }
}

export async function requireAuth(req: NextRequest) {
  const header = req.headers.get('authorization');

  if (!header?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing Authorization header');
  }

  const token = header.replace('Bearer ', '').trim();
  if (!token) {
    throw new UnauthorizedError('Invalid Authorization header');
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data?.user) {
    throw new UnauthorizedError('Invalid or expired token');
  }

  return data.user;
}

export function handleApiError(error: unknown) {
  console.error(error);

  if (error instanceof UnauthorizedError || error instanceof BadRequestError) {
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: error.status },
    );
  }

  return NextResponse.json(
    { ok: false, message: error instanceof Error ? error.message : 'Internal Server Error' },
    { status: 500 },
  );
}

