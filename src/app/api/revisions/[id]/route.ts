import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getStartOfDay, recordRevisionCompletedToday } from '@/lib/streak';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { retentionRating } = body;

    if (!retentionRating) {
      return NextResponse.json({ error: 'Missing retention rating' }, { status: 400 });
    }

    const validRatings = ['Forgot', 'Weak', 'Good', 'Perfect'];
    if (!validRatings.includes(retentionRating)) {
      return NextResponse.json({ error: 'Invalid retention rating' }, { status: 400 });
    }

    // Retrieve the target revision
    const revision = await db.revision.findUnique({
      where: { id },
      include: { topic: true },
    });

    if (!revision) {
      return NextResponse.json({ error: 'Revision not found' }, { status: 404 });
    }

    if (revision.status === 'Completed') {
      return NextResponse.json({ error: 'Revision is already completed' }, { status: 400 });
    }

    const today = getStartOfDay();
    const completedTime = new Date();

    // Determine next scheduled interval (in days)
    let intervalDays = 7;
    let xpBonus = 30;

    switch (retentionRating) {
      case 'Forgot':
        intervalDays = 1;
        xpBonus = 10;
        break;
      case 'Weak':
        intervalDays = 3;
        xpBonus = 20;
        break;
      case 'Good':
        intervalDays = 7;
        xpBonus = 30;
        break;
      case 'Perfect':
        intervalDays = 14;
        xpBonus = 50;
        break;
    }

    const nextScheduledDate = new Date(today);
    nextScheduledDate.setUTCDate(today.getUTCDate() + intervalDays);

    const baseXP = 50; // XP for completing any revision
    const totalXPEarned = baseXP + xpBonus;

    // Run database updates inside a transaction
    const result = await db.$transaction(async (tx) => {
      // 1. Mark revision completed
      const updatedRevision = await tx.revision.update({
        where: { id },
        data: {
          status: 'Completed',
          completedDate: completedTime,
          retentionRating,
        },
      });

      // 2. Schedule next revision
      const nextRevision = await tx.revision.create({
        data: {
          topicId: revision.topicId,
          revisionNumber: revision.revisionNumber + 1,
          scheduledDate: nextScheduledDate,
          status: 'Pending',
        },
      });

      // 3. Determine and update Topic status
      let nextStatus = revision.topic.status;
      if (nextStatus === 'Learning') {
        nextStatus = 'Active';
      }
      if (retentionRating === 'Perfect' || (revision.revisionNumber >= 3 && retentionRating === 'Good')) {
        nextStatus = 'Mastered';
      }

      await tx.topic.update({
        where: { id: revision.topicId },
        data: { status: nextStatus },
      });

      return { updatedRevision, nextRevision };
    });

    // 4. Record streak (outside transaction to avoid complex locking on dates)
    const streakResult = await recordRevisionCompletedToday();

    // 5. Award user XP
    await db.userProfile.update({
      where: { id: 'user' },
      data: {
        xp: { increment: totalXPEarned },
      },
    });

    return NextResponse.json({
      success: true,
      updatedRevision: result.updatedRevision,
      nextRevision: result.nextRevision,
      xpEarned: totalXPEarned,
      currentStreak: streakResult,
    });
  } catch (error) {
    console.error('API revision patch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
