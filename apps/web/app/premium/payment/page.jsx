import UserPremiumPaymentClient from '../../../components/UserPremiumPaymentClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Premium Payment',
  description: 'Secure KapIT premium checkout.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function UserPremiumPaymentPage() {
  return <UserPremiumPaymentClient />;
}
