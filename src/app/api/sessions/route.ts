import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    
    const sessions = await db.studySession.findMany({
      include: {
        subject: true,
      },
      orderBy: { date: 'desc' },
      take: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('API sessions GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, subjectId, durationMinutes, notes } = body;

    if (!subjectId || !durationMinutes) {
      return NextResponse.json({ error: 'Missing subject or duration' }, { status: 400 });
    }

    const duration = parseInt(durationMinutes);
    if (isNaN(duration) || duration <= 0) {
      return NextResponse.json({ error: 'Duration must be a positive number' }, { status: 400 });
    }

    const sessionDate = date ? new Date(date) : new Date();

    const session = await db.studySession.create({
      data: {
        date: sessionDate,
        subjectId,
        durationMinutes: duration,
        notes,
      },
      include: {
        subject: true,
      },
    });

    // XP calculation: 20 XP flat bonus + 1 XP per minute of study duration
    const xpReward = 20 + duration;
    await db.userProfile.update({
      where: { id: 'user' },
      data: {
        xp: { increment: xpReward },
      },
    });

    return NextResponse.json({
      session,
      xpEarned: xpReward,
    }, { status: 201 });
  } catch (error) {
    console.error('API sessions POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
