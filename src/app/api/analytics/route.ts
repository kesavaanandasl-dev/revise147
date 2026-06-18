import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getStartOfDay, checkAndUpdateStreak } from '@/lib/streak';

export async function GET() {
  try {
    // 1. First run streak verification to ensure streak numbers are current
    await checkAndUpdateStreak();

    // 2. Fetch User Profile
    const profile = await db.userProfile.findUnique({
      where: { id: 'user' },
    });

    const today = getStartOfDay();
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setUTCDate(today.getUTCDate() - 7);

    // 3. Fetch Subjects, Topics, and Revisions
    const subjects = await db.subject.findMany({
      include: {
        topics: {
          include: {
            revisions: true,
          },
        },
      },
    });

    const allTopics = await db.topic.findMany({
      include: {
        revisions: true,
      },
    });

    // 4. Calculate General Stats
    const totalTopicsCount = allTopics.length;
    const masteredTopicsCount = allTopics.filter(t => t.status === 'Mastered').length;

    // Calculate Retention Score
    // Formula: Average rating of completed revisions
    const completedRevisions = await db.revision.findMany({
      where: { status: 'Completed' },
    });

    let retentionScore = 0;
    if (completedRevisions.length > 0) {
      let totalRatingValue = 0;
      completedRevisions.forEach(r => {
        switch (r.retentionRating) {
          case 'Forgot': totalRatingValue += 0; break;
          case 'Weak': totalRatingValue += 33; break;
          case 'Good': totalRatingValue += 75; break;
          case 'Perfect': totalRatingValue += 100; break;
        }
      });
      retentionScore = Math.round(totalRatingValue / completedRevisions.length);
    } else {
      retentionScore = 0;
    }

    // Due Today and Overdue Counts
    const dueTodayCount = await db.revision.count({
      where: {
        status: 'Pending',
        scheduledDate: { lte: today },
      },
    });

    const overdueCount = await db.revision.count({
      where: {
        status: 'Pending',
        scheduledDate: { lt: today },
      },
    });

    // 5. Calculate Subject Progress & Distributions
    const subjectProgresses: { [key: string]: number } = {};
    const subjectTopicDistribution: { name: string; value: number }[] = [];

    subjects.forEach(sub => {
      const topicsInSubject = sub.topics;
      subjectTopicDistribution.push({
        name: sub.name,
        value: topicsInSubject.length,
      });

      if (topicsInSubject.length === 0) {
        subjectProgresses[sub.name] = 0;
        return;
      }

      // Calculate progress based on mastery of individual topics
      let sumOfScores = 0;
      topicsInSubject.forEach(topic => {
        const completed = topic.revisions.filter(r => r.status === 'Completed');
        if (completed.length === 0) {
          // If learning and has some pending, give a default base of 10%
          sumOfScores += topic.status === 'Learning' ? 10 : 25;
          return;
        }
        let totalVal = 0;
        completed.forEach(r => {
          switch (r.retentionRating) {
            case 'Forgot': totalVal += 10; break;
            case 'Weak': totalVal += 40; break;
            case 'Good': totalVal += 80; break;
            case 'Perfect': totalVal += 100; break;
          }
        });
        const topicScore = totalVal / completed.length;
        sumOfScores += topicScore;
      });

      subjectProgresses[sub.name] = Math.round(sumOfScores / topicsInSubject.length);
    });

    // 6. Placement Readiness Index Calculation
    // DSA Weight = 35%
    // Core Subjects (DBMS, OS, CN) Weight = 30%
    // Aptitude Weight = 15%
    // Projects Weight = 10%
    // Interview (Interview + Resume) Weight = 10%

    const dsaScore = subjectProgresses['DSA'] || 0;
    const dbmsScore = subjectProgresses['DBMS'] || 0;
    const osScore = subjectProgresses['OS'] || 0;
    const cnScore = subjectProgresses['CN'] || 0;
    const coreScore = (dbmsScore + osScore + cnScore) / 3;
    const aptitudeScore = subjectProgresses['Aptitude'] || 0;
    const projectsScore = subjectProgresses['Projects'] || 0;
    const interviewScore = ((subjectProgresses['Interview'] || 0) + (subjectProgresses['Resume'] || 0)) / 2;

    const readinessScore = Math.round(
      (dsaScore * 0.35) +
      (coreScore * 0.30) +
      (aptitudeScore * 0.15) +
      (projectsScore * 0.10) +
      (interviewScore * 0.10)
    );

    let readinessStatus = 'Needs Work';
    if (readinessScore >= 85) readinessStatus = 'Placement Ready';
    else if (readinessScore >= 65) readinessStatus = 'Interview Ready';
    else if (readinessScore >= 40) readinessStatus = 'Improving';

    // Weakest and Strongest Subject Determinations
    const sortedSubjects = Object.keys(subjectProgresses)
      .map(name => ({ name, progress: subjectProgresses[name] }))
      .sort((a, b) => a.progress - b.progress);

    const weakestSubject = sortedSubjects.length > 0 ? sortedSubjects[0] : null;
    const strongestSubject = sortedSubjects.length > 0 ? sortedSubjects[sortedSubjects.length - 1] : null;

    // Recommendations Generator
    const recommendations: string[] = [];
    if (weakestSubject && weakestSubject.progress < 50) {
      recommendations.push(`Focus on revising topics in ${weakestSubject.name} this week. Try to solve 2 hard topics.`);
    } else {
      recommendations.push('Maintain your consistent streaks and aim to master 5 more DSA topics.');
    }
    if (dsaScore < 60) {
      recommendations.push('DSA weight is high (35%). Allocate more time to Trees and Graphs.');
    }
    if (overdueCount > 0) {
      recommendations.push(`Clear the ${overdueCount} overdue revision(s) in your queue immediately.`);
    }

    // 7. Study Sessions aggregation (last 7 days study hours)
    const sessions = await db.studySession.findMany({
      where: {
        date: { gte: oneWeekAgo },
      },
      include: { subject: true },
    });

    // Aggregate by day of week
    const weekdayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const studyHoursChartData = weekdayMap.map(day => ({ name: day, hours: 0 }));
    
    sessions.forEach(sess => {
      const dayName = weekdayMap[new Date(sess.date).getUTCDay()];
      const idx = studyHoursChartData.findIndex(d => d.name === dayName);
      if (idx !== -1) {
        studyHoursChartData[idx].hours += sess.durationMinutes / 60;
      }
    });

    // Calculate total study time
    const allSessions = await db.studySession.findMany();
    let totalMinutes = 0;
    let weeklyMinutes = 0;
    let monthlyMinutes = 0;

    const oneMonthAgo = new Date(today);
    oneMonthAgo.setUTCDate(today.getUTCDate() - 30);

    allSessions.forEach(s => {
      const sTime = new Date(s.date).getTime();
      totalMinutes += s.durationMinutes;
      if (sTime >= oneWeekAgo.getTime()) {
        weeklyMinutes += s.durationMinutes;
      }
      if (sTime >= oneMonthAgo.getTime()) {
        monthlyMinutes += s.durationMinutes;
      }
    });

    // Daily streak calendars
    const streakCalendar = await db.dailyStreak.findMany({
      orderBy: { date: 'desc' },
      take: 30,
    });

    return NextResponse.json({
      profile,
      stats: {
        topicsCount: totalTopicsCount,
        masteredCount: masteredTopicsCount,
        retentionScore,
        dueTodayCount,
        overdueCount,
        totalStudyHours: Math.round((totalMinutes / 60) * 10) / 10,
        weeklyStudyHours: Math.round((weeklyMinutes / 60) * 10) / 10,
        monthlyStudyHours: Math.round((monthlyMinutes / 60) * 10) / 10,
      },
      subjectProgress: Object.keys(subjectProgresses).map(name => ({
        name,
        progress: subjectProgresses[name],
      })),
      topicDistribution: subjectTopicDistribution,
      readiness: {
        score: readinessScore,
        status: readinessStatus,
        weakest: weakestSubject,
        strongest: strongestSubject,
        recommendations,
      },
      studyHoursChart: studyHoursChartData,
      streakCalendar,
    });
  } catch (error) {
    console.error('API analytics GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
