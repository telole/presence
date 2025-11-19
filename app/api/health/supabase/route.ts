import { NextResponse } from 'next/server';

import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export async function GET() {
  try {
    const { error, count } = await supabaseAdmin    
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      ok: true,
      checkedTable: 'profiles',
      rowCount: count ?? 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Supabase health check failed:', error);
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

