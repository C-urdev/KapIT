import {
  Code2,
  Shield,
  Palette,
  Smartphone,
  Cpu,
  Cloud,
} from 'lucide-react';

export const TRUSTED_LOGOS = ['Google', 'Microsoft', 'PayPal', 'Meta'];

export const CATEGORIES = [
  { title: 'Programming & Tech', icon: Code2 },
  { title: 'Cybersecurity', icon: Shield },
  { title: 'UI/UX Design', icon: Palette },
  { title: 'Mobile Development', icon: Smartphone },
  { title: 'AI & Data', icon: Cpu },
  { title: 'Cloud & DevOps', icon: Cloud },
];

export const HERO_DEMO_DOMAIN = 'kapit.online';

type LandingStar = { top: string; left: string; size: string };

export const createLandingBgStars = (): LandingStar[] => {
  const stars: LandingStar[] = [];
  let seed = 182736;
  const count = 7;
  const sizes = ['h-1 w-1', 'h-1.5 w-1.5'];

  const rand = (): number => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const isInsideNoStarZone = (top: number, left: number): boolean => {
    const inHorizontalCenter = left >= 18 && left <= 84;
    const inVerticalCenter = top >= 14 && top <= 74;
    return inHorizontalCenter && inVerticalCenter;
  };

  const isOnSideLanes = (left: number): boolean => left <= 16 || left >= 84;

  while (stars.length < count) {
    const top = Math.round((8 + rand() * 76) * 10) / 10;
    const left = Math.round((6 + rand() * 88) * 10) / 10;
    if (isInsideNoStarZone(top, left)) continue;
    if (!isOnSideLanes(left)) continue;

    stars.push({
      top: `${top}%`,
      left: `${left}%`,
      size: sizes[stars.length % 2],
    });
  }

  return stars;
};
