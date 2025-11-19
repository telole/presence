import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { handleApiError, requireAuth } from '../../../../lib/apiAuth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(req);
    const payload = await req.json();
    const { id } = await context.params;

    const { data, error } = await supabaseAdmin
      .from('schedule_items')
      .update({
        tanggal: payload.tanggal,
        jam: payload.jam,
        judul: payload.judul,
        deskripsi: payload.deskripsi,
      })
      .eq('id', id)
      .eq('profile_id', user.id)
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

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(req);
    const { id } = await context.params;

    const { error } = await supabaseAdmin
      .from('schedule_items')
      .delete()
      .eq('id', id)
      .eq('profile_id', user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

