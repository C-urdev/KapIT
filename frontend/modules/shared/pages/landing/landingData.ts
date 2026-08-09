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

export const USER_LANDING_FAQ = [
  {
    question: 'Who can create a KapIT developer profile?',
    answer: 'Anyone looking for an IT role in the Philippines can create a profile and share their skills, experience, and work.',
  },
  {
    question: 'What should I add to my profile?',
    answer: 'Add your skills, experience, projects, portfolio, resume, and the roles you want.',
  },
  {
    question: 'How does KapIT match me with roles?',
    answer: 'KapIT compares your profile with each role’s skills and requirements to show clearer fit signals.',
  },
  {
    question: 'Can I track my applications in KapIT?',
    answer: 'Yes. You can follow application statuses, messages, and next steps from one place.',
  },
  {
    question: 'Who makes the final hiring decision?',
    answer: 'The employer does. KapIT organizes profile and role fit information, while the company controls every hiring decision.',
  },
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
