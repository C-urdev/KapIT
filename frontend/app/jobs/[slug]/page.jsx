import { notFound } from 'next/navigation';
import { cache } from 'react';
import JobDetail from '../../../components/JobDetail';
import { expressFetch } from '../../../lib/api';
import {
  SEO_DEFAULT_IMAGE_PATH,
  SEO_SITE_NAME,
  toAbsoluteUrl,
} from '../../../lib/seo';

const getPublicJob = cache(async (slug) => {
  const data = await expressFetch(`/public/jobs/${slug}`, {
    next: { revalidate: 300 },
  });
  return data?.job || null;
});

export async function generateMetadata({ params }) {
  try {
    const job = await getPublicJob(params.slug);
    if (!job) {
      return { title: 'Job Details' };
    }

    const title = String(job.title || 'Job Details');
    const companyName = String(job.company?.name || SEO_SITE_NAME).trim();
    const description = job.description || `Apply for ${title} at ${companyName}.`;
    const path = `/jobs/${params.slug}`;

    return {
      title,
      description,
      alternates: {
        canonical: path,
      },
      openGraph: {
        type: 'article',
        url: toAbsoluteUrl(path),
        siteName: SEO_SITE_NAME,
        title,
        description,
        images: [SEO_DEFAULT_IMAGE_PATH],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [SEO_DEFAULT_IMAGE_PATH],
      },
    };
  } catch {
    return { title: 'Job Details' };
  }
}

export default async function JobDetailPage({ params }) {
  try {
    const job = await getPublicJob(params.slug);
    if (!job) {
      notFound();
    }

    return <JobDetail job={job} />;
  } catch {
    notFound();
  }
}
