import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { handleApiError, requireAuth } from '../../../lib/apiAuth';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('reports')
      .select('*')
      .eq('profile_id', user.id)
      .order('tanggal', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true, reports: data ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const payload = await req.json();

    const required = ['judul', 'tanggal', 'isi'];
    const missing = required.filter((field) => !payload?.[field]);

    if (missing.length > 0) {
      return NextResponse.json(
        { ok: false, message: `Missing fields: ${missing.join(', ')}` },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from('reports')
      .insert({
        profile_id: user.id,
        judul: payload.judul,
        tanggal: payload.tanggal,
        isi: payload.isi,
        status: payload.status ?? 'draft',
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    await supabaseAdmin.from('report_history').insert({
      report_id: data.id,
      editor_id: user.id,
      isi: data.isi,
      status: data.status,
    });

    return NextResponse.json({ ok: true, report: data });
  } catch (error) {
    return handleApiError(error);
  }
}

