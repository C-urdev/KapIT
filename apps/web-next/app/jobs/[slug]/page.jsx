import { notFound } from 'next/navigation';
import JobDetail from '../../../components/JobDetail';
import { expressFetch } from '../../../lib/api';

export async function generateMetadata({ params }) {
  try {
    const data = await expressFetch(`/public/jobs/${params.slug}`, {
      next: { revalidate: 300 },
    });

    const job = data?.job;
    if (!job) {
      return { title: 'Job not found' };
    }

    return {
      title: job.title,
      description: job.description || `Apply for ${job.title} at ${job.company?.name || 'KapIT'}.`,
    };
  } catch {
    return { title: 'Job not found' };
  }
}

export default async function JobDetailPage({ params }) {
  try {
    const data = await expressFetch(`/public/jobs/${params.slug}`, {
      next: { revalidate: 300 },
    });

    if (!data?.job) {
      notFound();
    }

    return <JobDetail job={data.job} />;
  } catch {
    notFound();
  }
}