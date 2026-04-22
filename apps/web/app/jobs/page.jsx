import JobsList from '../../components/JobsList';
import { expressFetch } from '../../lib/api';

export const revalidate = 300;

export const metadata = {
  title: 'Jobs',
  description: 'Browse public IT and developer jobs on KapIT.',
};

export default async function JobsPage() {
  let jobs = [];

  try {
    const data = await expressFetch('/public/jobs', {
      next: { revalidate: 300 },
    });
    jobs = Array.isArray(data?.jobs) ? data.jobs : [];
  } catch {
    jobs = [];
  }

  return <JobsList jobs={jobs} />;
}
