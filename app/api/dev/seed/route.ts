import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';

import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

const DEMO_EMAIL = 'demo@student.app';
const DEMO_PASSWORD = 'Demo1234!';

export async function POST() {
  try {
    const { data: listData, error: listError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      throw listError;
    }

    const existingUser = listData.users.find(
      (user) => user.email?.toLowerCase() === DEMO_EMAIL.toLowerCase(),
    );

    const user =
      existingUser ??
      (await supabaseAdmin.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
      })).data.user;

    if (!user) {
      throw new Error('Failed to ensure demo user exists');
    }

    const profileId = user.id;

    await supabaseAdmin.from('profiles').upsert({
      id: profileId,
      full_name: 'Bengbeng Demo',
      username: 'bengbeng',
      role: 'siswa',
    });

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const attendancePayload = [
      {
        id: randomUUID(),
        profile_id: profileId,
        tanggal: yesterday.toISOString().slice(0, 10),
        masuk_at: new Date(
          `${yesterday.toISOString().slice(0, 10)}T08:00:00Z`,
        ).toISOString(),
        status: 'masuk',
      },
      {
        id: randomUUID(),
        profile_id: profileId,
        tanggal: yesterday.toISOString().slice(0, 10),
        pulang_at: new Date(
          `${yesterday.toISOString().slice(0, 10)}T16:00:00Z`,
        ).toISOString(),
        status: 'pulang',
      },
    ];

    const activitiesPayload = [
      {
        id: randomUUID(),
        profile_id: profileId,
        tanggal: yesterday.toISOString().slice(0, 10),
        jam_mulai: '08:00',
        jam_selesai: '12:00',
        kegiatan: 'UI/UX Design',
        catatan: 'Mengerjakan wireframe halaman presensi.',
      },
      {
        id: randomUUID(),
        profile_id: profileId,
        tanggal: yesterday.toISOString().slice(0, 10),
        jam_mulai: '13:00',
        jam_selesai: '16:00',
        kegiatan: 'Frontend Development',
        catatan: 'Implementasi komponen laporan.',
      },
    ];

    const reportsPayload = [
      {
        id: randomUUID(),
        profile_id: profileId,
        judul: 'Laporan Harian UI/UX',
        tanggal: yesterday.toISOString().slice(0, 10),
        isi: 'Membuat desain onboarding dan form presensi.',
        status: 'submitted',
      },
      {
        id: randomUUID(),
        profile_id: profileId,
        judul: 'Laporan Frontend',
        tanggal: today.toISOString().slice(0, 10),
        isi: 'Integrasi Supabase untuk presensi dan laporan.',
        status: 'draft',
      },
    ];

    await Promise.all([
      supabaseAdmin.from('attendance').upsert(attendancePayload, {
        onConflict: 'id',
      }),
      supabaseAdmin.from('activities').upsert(activitiesPayload, {
        onConflict: 'id',
      }),
      supabaseAdmin.from('reports').upsert(reportsPayload, {
        onConflict: 'id',
      }),
    ]);

    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: DEMO_EMAIL },
      inserts: {
        attendance: attendancePayload.length,
        activities: activitiesPayload.length,
        reports: reportsPayload.length,
      },
      note: 'Login with demo@student.app / Demo1234! to test.',
    });
  } catch (error) {
    console.error('Demo seed failed', error);
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

