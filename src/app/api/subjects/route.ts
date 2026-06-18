import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const subjects = await db.subject.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(subjects);
  } catch (error) {
    console.error('API subjects GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Subject name is required' }, { status: 400 });
    }

    const nameUpper = name.trim();

    // Check duplicate
    const existing = await db.subject.findUnique({
      where: { name: nameUpper },
    });
    if (existing) {
      return NextResponse.json({ error: 'Subject already exists' }, { status: 400 });
    }

    const subject = await db.subject.create({
      data: { name: nameUpper },
    });

    return NextResponse.json(subject, { status: 201 });
  } catch (error) {
    console.error('API subjects POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
