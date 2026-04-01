import CompanyAppClient from '../../../components/CompanyAppClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Company Dashboard',
  description: 'Private company workspace for KapIT.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CompanyCatchAllPage() {
  return <CompanyAppClient />;
}