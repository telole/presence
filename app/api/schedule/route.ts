import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { handleApiError, requireAuth } from '../../../lib/apiAuth';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const tanggal = searchParams.get('tanggal');

    let query = supabaseAdmin
      .from('schedule_items')
      .select('*')
      .eq('profile_id', user.id)
      .order('tanggal', { ascending: true })
      .order('jam', { ascending: true });

    if (tanggal) {
      query = query.eq('tanggal', tanggal);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true, schedule: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const payload = await req.json();

    if (!payload?.tanggal || !payload?.judul) {
      return NextResponse.json(
        { ok: false, message: 'tanggal and judul are required' },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from('schedule_items')
      .insert({
        profile_id: user.id,
        tanggal: payload.tanggal,
        jam: payload.jam ?? null,
        judul: payload.judul,
        deskripsi: payload.deskripsi ?? null,
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true, schedule: data });
  } catch (error) {
    return handleApiError(error);
  }
}

