import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import JobDetail from '../../../components/JobDetail';

export default function JobDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await fetch(`/api/public/jobs/${slug}`);
        if (!response.ok) throw new Error('Not found');
        const data = await response.json();
        if (!data?.job) {
          navigate('/', { replace: true });
          return;
        }
        setJob(data.job);
      } catch {
        navigate('/', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f6f1] dark:bg-[#121416]">
        <div className="text-sm text-slate-500 dark:text-slate-400">Loading job details...</div>
      </div>
    );
  }

  if (!job) return null;

  return <JobDetail job={job} />;
}
