import JobMatchClient from '../../components/JobMatchClient';
import SessionGate from '../../components/SessionGate';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Job Matchmaking',
  description: 'Match your skills to open roles on KapIT.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function JobMatchPage() {
  return (
    <SessionGate requiredAccountType="developer" redirectTo="/">
      {({ user }) => <JobMatchClient user={user} />}
    </SessionGate>
  );
}
