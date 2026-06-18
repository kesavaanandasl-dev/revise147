import db from './db';

export async function addXP(amount: number) {
  try {
    const profile = await db.userProfile.update({
      where: { id: 'user' },
      data: {
        xp: { increment: amount },
      },
    });
    return profile;
  } catch (error) {
    console.error('Failed to add XP:', error);
    return null;
  }
}

export function getLevel(xp: number) {
  // Simple formula: 500 XP per level
  return Math.floor(xp / 500) + 1;
}

export function getXPProgress(xp: number) {
  const currentLevel = getLevel(xp);
  const levelXPRequired = 500;
  const currentLevelXPStart = (currentLevel - 1) * levelXPRequired;
  const xpInLevel = xp - currentLevelXPStart;
  const percentage = Math.min(100, Math.max(0, (xpInLevel / levelXPRequired) * 100));
  return {
    level: currentLevel,
    xpInLevel,
    neededXP: levelXPRequired,
    percentage,
  };
}
