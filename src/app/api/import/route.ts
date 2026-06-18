import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const backupData = await request.json();
    const { profile, subjects, topics, revisions, studySessions, dailyStreaks } = backupData;

    if (!subjects) {
      return NextResponse.json({ error: 'Invalid backup file structure' }, { status: 400 });
    }

    await db.$transaction(async (tx) => {
      // 1. Wipe current database
      await tx.revision.deleteMany();
      await tx.studySession.deleteMany();
      await tx.topic.deleteMany();
      await tx.subject.deleteMany();
      await tx.dailyStreak.deleteMany();
      await tx.userProfile.deleteMany();

      // 2. Import Profile
      if (profile) {
        await tx.userProfile.create({
          data: {
            id: profile.id,
            name: profile.name,
            xp: profile.xp,
            currentStreak: profile.currentStreak,
            longestStreak: profile.longestStreak,
            theme: profile.theme,
          },
        });
      } else {
        await tx.userProfile.create({
          data: { id: 'user' },
        });
      }

      // 3. Import Subjects
      if (subjects && subjects.length > 0) {
        await tx.subject.createMany({
          data: subjects.map((s: any) => ({
            id: s.id,
            name: s.name,
            createdAt: new Date(s.createdAt),
          })),
        });
      }

      // 4. Import Topics
      if (topics && topics.length > 0) {
        await tx.topic.createMany({
          data: topics.map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            subjectId: t.subjectId,
            difficulty: t.difficulty,
            status: t.status,
            notes: t.notes,
            createdAt: new Date(t.createdAt),
            updatedAt: new Date(t.updatedAt),
          })),
        });
      }

      // 5. Import Revisions
      if (revisions && revisions.length > 0) {
        await tx.revision.createMany({
          data: revisions.map((r: any) => ({
            id: r.id,
            topicId: r.topicId,
            revisionNumber: r.revisionNumber,
            scheduledDate: new Date(r.scheduledDate),
            completedDate: r.completedDate ? new Date(r.completedDate) : null,
            status: r.status,
            retentionRating: r.retentionRating,
            createdAt: new Date(r.createdAt),
          })),
        });
      }

      // 6. Import Study Sessions
      if (studySessions && studySessions.length > 0) {
        await tx.studySession.createMany({
          data: studySessions.map((s: any) => ({
            id: s.id,
            date: new Date(s.date),
            subjectId: s.subjectId,
            durationMinutes: s.durationMinutes,
            notes: s.notes,
            createdAt: new Date(s.createdAt),
          })),
        });
      }

      // 7. Import Streaks
      if (dailyStreaks && dailyStreaks.length > 0) {
        await tx.dailyStreak.createMany({
          data: dailyStreaks.map((s: any) => ({
            id: s.id,
            date: new Date(s.date),
            completed: s.completed,
            createdAt: new Date(s.createdAt),
          })),
        });
      }
    });

    return NextResponse.json({ success: true, message: 'Data imported successfully' });
  } catch (error) {
    console.error('API import POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
