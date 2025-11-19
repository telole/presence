import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { handleApiError, requireAuth } from '../../../../lib/apiAuth';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(req);
    const { id } = await context.params;

    const { data, error } = await supabaseAdmin
      .from('reports')
      .select('*, report_history(*)')
      .eq('id', id)
      .eq('profile_id', user.id)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true, report: data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(req);
    const payload = await req.json();
    const { id } = await context.params;

    const { data, error } = await supabaseAdmin
      .from('reports')
      .update({
        judul: payload.judul,
        tanggal: payload.tanggal,
        isi: payload.isi,
        status: payload.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('profile_id', user.id)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    await supabaseAdmin.from('report_history').insert({
      report_id: id,
      editor_id: user.id,
      isi: data.isi,
      status: data.status,
    });

    return NextResponse.json({ ok: true, report: data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth(req);
    const { id } = await context.params;

    const { error } = await supabaseAdmin
      .from('reports')
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

