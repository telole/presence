import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { handleApiError, requireAuth } from '../../../lib/apiAuth';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      const { data: newProfile, error: upsertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: user.id,
          full_name: user.user_metadata?.full_name ?? user.email,
          username: user.user_metadata?.username ?? user.email?.split('@')[0],
          avatar_url: user.user_metadata?.avatar_url ?? null,
        })
        .select('*')
        .single();

      if (upsertError) {
        throw upsertError;
      }

      return NextResponse.json({ ok: true, profile: newProfile });
    }

    return NextResponse.json({ ok: true, profile: data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const payload = await req.json();

    const allowedFields = ['full_name', 'username', 'avatar_url', 'role'] as const;
    const updates: Record<string, unknown> = {};

    allowedFields.forEach((field) => {
      if (field in payload) {
        updates[field] = payload[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { ok: false, message: 'No updatable fields provided' },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true, profile: data });
  } catch (error) {
    return handleApiError(error);
  }
}

