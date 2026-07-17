import {
  BriefcaseBusiness,
  CircleHelp,
  FileText,
  LifeBuoy,
  ShieldCheck,
  UserRound,
  UsersRound,
} from 'lucide-react';

export const PUBLIC_NAV_LINKS = [
  { label: 'Solutions', hasDropdown: true, footerItem: 'Find talent' },
  { label: 'For Employers', hasDropdown: false, href: '/for-employers' },
  { label: 'Resources', hasDropdown: true, footerItem: 'Help Center' },
  { label: 'Pricing', hasDropdown: false, href: '/pricing', footerItem: 'Pricing' },
  { label: 'Documentation', hasDropdown: false, footerItem: 'Help Center' },
];

export const PUBLIC_NAV_DROPDOWNS = {
  Solutions: [
    {
      heading: 'Developers',
      items: [
        {
          title: 'Create profile',
          description: 'Build a profile that recruiters can actually filter and shortlist.',
          footerItem: 'Create profile',
          icon: UserRound,
        },
        {
          title: 'Portfolios',
          description: 'Show live work, stack depth, and project proof in one place.',
          footerItem: 'Portfolios',
          icon: FileText,
        },
        {
          title: 'Projects',
          description: 'Stay visible for contract, freelance, and full-time work.',
          footerItem: 'Projects',
          icon: BriefcaseBusiness,
        },
      ],
    },
  ],
  Resources: [
    {
      heading: 'Support',
      items: [
        { title: 'Help Center', description: 'Platform guides and account help', footerItem: 'Help Center', icon: LifeBuoy },
        { title: 'Community', description: 'Product updates and collaboration', footerItem: 'Community', icon: UsersRound },
        { title: 'Safety', description: 'Trust, privacy, and security basics', footerItem: 'Safety', icon: ShieldCheck },
        { title: 'FAQ', description: 'Common questions from applicants and teams', footerItem: 'FAQ', icon: CircleHelp },
      ],
    },
  ],
};

export function openPublicFooterItem(footerItem) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('kapit:footer-info-open', { detail: { item: footerItem } }));
}
