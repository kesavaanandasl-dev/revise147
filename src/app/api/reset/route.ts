import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST() {
  try {
    await db.$transaction(async (tx) => {
      // 1. Delete progress tables
      await tx.revision.deleteMany();
      await tx.studySession.deleteMany();
      await tx.topic.deleteMany();
      await tx.dailyStreak.deleteMany();

      // 2. Reset profile statistics
      await tx.userProfile.update({
        where: { id: 'user' },
        data: {
          xp: 0,
          currentStreak: 0,
          longestStreak: 0,
        },
      });
    });

    return NextResponse.json({ success: true, message: 'All progress has been reset.' });
  } catch (error) {
    console.error('API reset POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
