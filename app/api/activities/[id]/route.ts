import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { handleApiError, requireAuth } from '../../../../lib/apiAuth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

type RouteContext = {
  params: { id: string };
};

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireAuth(req);
    const { id } = params;

    const { data, error } = await supabaseAdmin
      .from('activities')
      .select('*')
      .eq('id', id)
      .eq('profile_id', user.id)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true, activity: data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireAuth(req);
    const payload = await req.json();

    const { data, error } = await supabaseAdmin
      .from('activities')
      .update({
        tanggal: payload.tanggal,
        jam_mulai: payload.jam_mulai,
        jam_selesai: payload.jam_selesai,
        kegiatan: payload.kegiatan,
        catatan: payload.catatan,
      })
      .eq('id', params.id)
      .eq('profile_id', user.id)
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

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const user = await requireAuth(req);

    const { error } = await supabaseAdmin
      .from('activities')
      .delete()
      .eq('id', params.id)
      .eq('profile_id', user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

