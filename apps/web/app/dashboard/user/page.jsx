import UserDashboardClient from '../../../components/UserDashboardClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Dashboard',
  description: 'Your private KapIT dashboard.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function UserDashboardPage() {
  return <UserDashboardClient />;
}
