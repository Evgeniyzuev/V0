import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateRequiredCoreForLevel(level: number): number {
  if (level <= 0) return 0;
  if (level <= 6) {
    // Levels 1-6: 2, 4, 8, 16, 32, 64
    return Math.pow(2, level);
  } else if (level === 7) {
    return 125;
  } else if (level === 8) {
    return 250;
  } else if (level === 9) {
    return 500;
  } else if (level === 10) {
    return 1000;
  } else {
    // Level 11+: doubles from 2000
    return 2000 * Math.pow(2, level - 11);
  }
}

export function calculateLevelFromCore(core: number): number {
  let level = 1;
  while (calculateRequiredCoreForLevel(level + 1) <= core) {
    level++;
  }
  return level;
}
