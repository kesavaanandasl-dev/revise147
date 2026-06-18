import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getStartOfDay } from '@/lib/streak';
import { addXP } from '@/lib/xp';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');
    const difficulty = searchParams.get('difficulty');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const whereClause: any = {};
    if (subjectId) whereClause.subjectId = subjectId;
    if (difficulty) whereClause.difficulty = difficulty;
    if (status) whereClause.status = status;
    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { notes: { contains: search } },
      ];
    }

    const topics = await db.topic.findMany({
      where: whereClause,
      include: {
        subject: true,
        revisions: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(topics);
  } catch (error) {
    console.error('API topics GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, subjectId, difficulty, status, notes } = body;

    if (!title || !subjectId || !difficulty) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const today = getStartOfDay();

    // Create topic and revisions inside a transaction
    const result = await db.$transaction(async (tx) => {
      const topic = await tx.topic.create({
        data: {
          title,
          description,
          subjectId,
          difficulty,
          status: status || 'Learning',
          notes,
        },
      });

      // revision 1: +1 day
      const date1 = new Date(today);
      date1.setUTCDate(today.getUTCDate() + 1);

      // revision 2: +4 days
      const date2 = new Date(today);
      date2.setUTCDate(today.getUTCDate() + 4);

      // revision 3: +7 days
      const date3 = new Date(today);
      date3.setUTCDate(today.getUTCDate() + 7);

      const revisions = await tx.revision.createMany({
        data: [
          {
            topicId: topic.id,
            revisionNumber: 1,
            scheduledDate: date1,
            status: 'Pending',
          },
          {
            topicId: topic.id,
            revisionNumber: 2,
            scheduledDate: date2,
            status: 'Pending',
          },
          {
            topicId: topic.id,
            revisionNumber: 3,
            scheduledDate: date3,
            status: 'Pending',
          },
        ],
      });

      // Update XP for adding a topic (+100 XP)
      await tx.userProfile.update({
        where: { id: 'user' },
        data: {
          xp: { increment: 100 },
        },
      });

      return { topic, revisionsCount: 3 };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('API topics POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
