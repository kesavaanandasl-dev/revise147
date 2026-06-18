import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const topic = await db.topic.findUnique({
      where: { id },
      include: {
        subject: true,
        revisions: {
          orderBy: { scheduledDate: 'asc' },
        },
      },
    });

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // Calculate details
    const completedRevisions = topic.revisions.filter(r => r.status === 'Completed');
    const totalRevisions = topic.revisions.length;
    const completedCount = completedRevisions.length;
    
    // Retention history score
    // Forgot = 0, Weak = 33, Good = 66, Perfect = 100
    let masteryScore = 0;
    if (completedCount > 0) {
      const scores: number[] = completedRevisions.map(r => {
        switch (r.retentionRating) {
          case 'Forgot': return 0;
          case 'Weak': return 33;
          case 'Good': return 75;
          case 'Perfect': return 100;
          default: return 0;
        }
      });
      const totalScore = scores.reduce((sum, s) => sum + s, 0);
      masteryScore = Math.round(totalScore / completedCount);
    }

    // If status is 'Mastered' and score is low, we might adjust or let user manage it.
    // Next Revision Date
    const nextRevision = topic.revisions.find(r => r.status === 'Pending');

    return NextResponse.json({
      topic,
      stats: {
        totalRevisions,
        completedCount,
        masteryScore,
        nextRevisionDate: nextRevision ? nextRevision.scheduledDate : null,
      }
    });
  } catch (error) {
    console.error('API topic detail GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, difficulty, status, notes } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const topic = await db.topic.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(topic);
  } catch (error) {
    console.error('API topic detail PATCH error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.topic.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Topic deleted' });
  } catch (error) {
    console.error('API topic detail DELETE error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
