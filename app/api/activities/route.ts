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
      .from('activities')
      .select('*')
      .eq('profile_id', user.id)
      .order('tanggal', { ascending: false })
      .order('jam_mulai', { ascending: true });

    if (tanggal) {
      query = query.eq('tanggal', tanggal);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true, activities: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const payload = await req.json();

    const requiredFields: Array<keyof typeof payload> = [
      'tanggal',
      'jam_mulai',
      'jam_selesai',
      'kegiatan',
    ];

    const missing = requiredFields.filter((field) => !payload?.[field]);

    if (missing.length > 0) {
      return NextResponse.json(
        { ok: false, message: `Missing fields: ${missing.join(', ')}` },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from('activities')
      .insert({
        profile_id: user.id,
        tanggal: payload.tanggal,
        jam_mulai: payload.jam_mulai,
        jam_selesai: payload.jam_selesai,
        kegiatan: payload.kegiatan,
        catatan: payload.catatan ?? null,
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true, activity: data });
  } catch (error) {
    return handleApiError(error);
  }
}

