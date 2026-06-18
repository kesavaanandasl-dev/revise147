import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    let profile = await db.userProfile.findUnique({
      where: { id: 'user' },
    });
    if (!profile) {
      profile = await db.userProfile.create({
        data: {
          id: 'user',
          name: 'Placement Aspirant',
          xp: 0,
          currentStreak: 0,
          longestStreak: 0,
          theme: 'dark',
        },
      });
    }
    return NextResponse.json(profile);
  } catch (error) {
    console.error('API profile GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { name, theme, xp, currentStreak, longestStreak } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (theme !== undefined) updateData.theme = theme;
    if (xp !== undefined) {
      if (typeof xp === 'object' && xp.increment !== undefined) {
        updateData.xp = { increment: xp.increment };
      } else {
        updateData.xp = xp;
      }
    }
    if (currentStreak !== undefined) updateData.currentStreak = currentStreak;
    if (longestStreak !== undefined) updateData.longestStreak = longestStreak;

    const profile = await db.userProfile.update({
      where: { id: 'user' },
      data: updateData,
    });
    return NextResponse.json(profile);
  } catch (error) {
    console.error('API profile PATCH error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
