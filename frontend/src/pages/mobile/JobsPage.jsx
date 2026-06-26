import { useEffect, useState } from 'react';
import JobsList from '../../../components/JobsList';

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('/api/public/jobs');
        if (!response.ok) throw new Error('Failed to fetch jobs');
        const data = await response.json();
        setJobs(Array.isArray(data?.jobs) ? data.jobs : []);
      } catch {
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f6f1] dark:bg-[#121416]">
        <div className="text-sm text-slate-500 dark:text-slate-400">Loading jobs...</div>
      </div>
    );
  }

  return <JobsList jobs={jobs} />;
}
