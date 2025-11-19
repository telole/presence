import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { handleApiError, requireAuth } from '../../../lib/apiAuth';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    let query = supabaseAdmin
      .from('attendance')
      .select('*, attendance_events(*)')
      .eq('profile_id', user.id)
      .order('tanggal', { ascending: false })
      .order('created_at', { ascending: false });

    if (start) {
      query = query.gte('tanggal', start);
    }

    if (end) {
      query = query.lte('tanggal', end);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true, attendance: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { tanggal, status, timestamp, lokasi, catatan } = await req.json();

    if (!tanggal || !status) {
      return NextResponse.json(
        { ok: false, message: 'tanggal and status are required' },
        { status: 400 },
      );
    }

    const isoTimestamp = timestamp ?? new Date().toISOString();

    const record: Record<string, unknown> = {
      profile_id: user.id,
      tanggal,
      status,
      lokasi,
      catatan,
    };

    if (status === 'masuk') {
      record.masuk_at = isoTimestamp;
    } else if (status === 'pulang') {
      record.pulang_at = isoTimestamp;
    }

    const { data, error } = await supabaseAdmin
      .from('attendance')
      .upsert(record, {
        onConflict: 'profile_id,tanggal,status',
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    await supabaseAdmin.from('attendance_events').insert({
      attendance_id: data.id,
      event_type: status,
      recorded_at: isoTimestamp,
      device_info: null,
    });

    return NextResponse.json({ ok: true, attendance: data });
  } catch (error) {
    return handleApiError(error);
  }
}

