import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default user profile if it doesn't exist
  const profile = await prisma.userProfile.upsert({
    where: { id: 'user' },
    update: {},
    create: {
      id: 'user',
      name: 'Placement Aspirant',
      xp: 0,
      currentStreak: 0,
      longestStreak: 0,
      theme: 'dark',
    },
  });
  console.log('User profile created/upserted:', profile);

  // Default subjects
  const defaultSubjects = [
    'DSA',
    'DBMS',
    'OS',
    'CN',
    'Aptitude',
    'Projects',
    'Interview',
    'Resume',
  ];

  for (const subjectName of defaultSubjects) {
    const subject = await prisma.subject.upsert({
      where: { name: subjectName },
      update: {},
      create: { name: subjectName },
    });
    console.log(`Subject upserted: ${subject.name}`);
  }

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
