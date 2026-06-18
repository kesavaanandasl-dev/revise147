import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const profile = await db.userProfile.findUnique({ where: { id: 'user' } });
    const subjects = await db.subject.findMany();
    const topics = await db.topic.findMany();
    const revisions = await db.revision.findMany();
    const studySessions = await db.studySession.findMany();
    const dailyStreaks = await db.dailyStreak.findMany();

    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      profile,
      subjects,
      topics,
      revisions,
      studySessions,
      dailyStreaks,
    };

    return new Response(JSON.stringify(backupData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename=revise147_backup_${new Date().toISOString().split('T')[0]}.json`,
      },
    });
  } catch (error) {
    console.error('API export GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
