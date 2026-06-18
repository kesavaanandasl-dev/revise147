import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getStartOfDay } from '@/lib/streak';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // due, overdue, upcoming, completed
    const subjectId = searchParams.get('subjectId');
    const difficulty = searchParams.get('difficulty');
    const statusFilter = searchParams.get('status');

    const today = getStartOfDay();
    
    // Construct base where clause
    const baseWhere: any = {};
    if (subjectId) {
      baseWhere.topic = { ...baseWhere.topic, subjectId };
    }
    if (difficulty) {
      baseWhere.topic = { ...baseWhere.topic, difficulty };
    }
    if (statusFilter) {
      baseWhere.topic = { ...baseWhere.topic, status: statusFilter };
    }

    if (type === 'due') {
      // Due today + Overdue
      const revisions = await db.revision.findMany({
        where: {
          ...baseWhere,
          status: 'Pending',
          scheduledDate: {
            lte: today,
          },
        },
        include: {
          topic: {
            include: { subject: true, revisions: true },
          },
        },
        orderBy: { scheduledDate: 'asc' },
      });
      return NextResponse.json(revisions);
    } else if (type === 'overdue') {
      const revisions = await db.revision.findMany({
        where: {
          ...baseWhere,
          status: 'Pending',
          scheduledDate: {
            lt: today,
          },
        },
        include: {
          topic: {
            include: { subject: true, revisions: true },
          },
        },
        orderBy: { scheduledDate: 'asc' },
      });
      return NextResponse.json(revisions);
    } else if (type === 'upcoming') {
      const revisions = await db.revision.findMany({
        where: {
          ...baseWhere,
          status: 'Pending',
          scheduledDate: {
            gt: today,
          },
        },
        include: {
          topic: {
            include: { subject: true, revisions: true },
          },
        },
        orderBy: { scheduledDate: 'asc' },
      });
      return NextResponse.json(revisions);
    } else if (type === 'completed') {
      const revisions = await db.revision.findMany({
        where: {
          ...baseWhere,
          status: 'Completed',
        },
        include: {
          topic: {
            include: { subject: true, revisions: true },
          },
        },
        orderBy: { completedDate: 'desc' },
      });
      return NextResponse.json(revisions);
    }

    // Default: return all revisions grouped
    const overdue = await db.revision.findMany({
      where: { ...baseWhere, status: 'Pending', scheduledDate: { lt: today } },
      include: { topic: { include: { subject: true, revisions: true } } },
      orderBy: { scheduledDate: 'asc' },
    });

    const dueToday = await db.revision.findMany({
      where: { ...baseWhere, status: 'Pending', scheduledDate: today },
      include: { topic: { include: { subject: true, revisions: true } } },
      orderBy: { scheduledDate: 'asc' },
    });

    const upcoming = await db.revision.findMany({
      where: { ...baseWhere, status: 'Pending', scheduledDate: { gt: today } },
      include: { topic: { include: { subject: true, revisions: true } } },
      orderBy: { scheduledDate: 'asc' },
    });

    return NextResponse.json({ overdue, dueToday, upcoming });
  } catch (error) {
    console.error('API revisions GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
