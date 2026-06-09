import JobMatchClient from '../../components/JobMatchClient';
import SessionGate from '../../components/SessionGate';

export default function JobMatchPage() {
  return (
    <SessionGate requiredAccountType="developer" redirectTo="/">
      {({ user }) => <JobMatchClient user={user} />}
    </SessionGate>
  );
}
