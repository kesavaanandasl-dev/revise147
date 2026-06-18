import db from './db';

// Helper to get Date object at midnight UTC
export function getStartOfDay(dateInput?: Date | string | number): Date {
  const date = dateInput ? new Date(dateInput) : new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

export async function checkAndUpdateStreak() {
  try {
    const today = getStartOfDay();
    const yesterday = new Date(today);
    yesterday.setUTCDate(today.getUTCDate() - 1);

    const profile = await db.userProfile.findUnique({
      where: { id: 'user' },
    });
    if (!profile) return;

    // Retrieve last daily streak record
    const lastStreak = await db.dailyStreak.findFirst({
      orderBy: { date: 'desc' },
    });

    if (!lastStreak) {
      if (profile.currentStreak > 0) {
        await db.userProfile.update({
          where: { id: 'user' },
          data: { currentStreak: 0 },
        });
      }
      return;
    }

    const lastStreakDate = getStartOfDay(lastStreak.date);

    // If last streak is older than yesterday, it means they missed a day, streak is broken
    if (lastStreakDate.getTime() < yesterday.getTime()) {
      await db.userProfile.update({
        where: { id: 'user' },
        data: { currentStreak: 0 },
      });
    }
  } catch (error) {
    console.error('Failed to update streak status:', error);
  }
}

export async function recordRevisionCompletedToday() {
  try {
    const today = getStartOfDay();
    const yesterday = new Date(today);
    yesterday.setUTCDate(today.getUTCDate() - 1);

    // Check if daily streak for today already exists
    const existingStreak = await db.dailyStreak.findUnique({
      where: { date: today },
    });

    if (existingStreak) {
      return; // Already registered today
    }

    // Record today's streak completion
    await db.dailyStreak.create({
      data: { date: today },
    });

    // Check last streak date
    const lastStreakBeforeToday = await db.dailyStreak.findFirst({
      where: {
        date: { lt: today },
      },
      orderBy: { date: 'desc' },
    });

    let newStreakCount = 1;

    if (lastStreakBeforeToday) {
      const lastDate = getStartOfDay(lastStreakBeforeToday.date);
      if (lastDate.getTime() === yesterday.getTime()) {
        const profile = await db.userProfile.findUnique({ where: { id: 'user' } });
        newStreakCount = (profile?.currentStreak || 0) + 1;
      }
    }

    const profile = await db.userProfile.findUnique({ where: { id: 'user' } });
    const currentLongest = profile?.longestStreak || 0;
    const nextLongest = Math.max(currentLongest, newStreakCount);

    await db.userProfile.update({
      where: { id: 'user' },
      data: {
        currentStreak: newStreakCount,
        longestStreak: nextLongest,
      },
    });

    return newStreakCount;
  } catch (error) {
    console.error('Failed to record revision completion:', error);
    return null;
  }
}
