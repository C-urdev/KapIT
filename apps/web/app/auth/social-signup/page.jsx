import SocialSignupFlowClient from '../../../components/SocialSignupFlowClient';

export const metadata = {
  title: 'Social Sign Up Verification | KapIT',
  description:
    'Verify your social sign up with email code, set your password, and complete your KapIT profile as developer or company.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SocialSignupPage() {
  return <SocialSignupFlowClient />;
}
