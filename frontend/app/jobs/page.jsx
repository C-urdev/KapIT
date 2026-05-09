import JobsList from '../../components/JobsList';
import { expressFetch } from '../../lib/api';
import {
  SEO_DEFAULT_IMAGE_PATH,
  SEO_SITE_NAME,
  toAbsoluteUrl,
} from '../../lib/seo';

export const revalidate = 300;

export const metadata = {
  title: 'IT & Developer Jobs',
  description: 'Browse public IT, software engineering, and developer jobs on KapIT.',
  alternates: {
    canonical: '/jobs',
  },
  openGraph: {
    type: 'website',
    url: toAbsoluteUrl('/jobs'),
    siteName: SEO_SITE_NAME,
    title: 'IT & Developer Jobs | KapIT',
    description: 'Browse public IT, software engineering, and developer jobs on KapIT.',
    images: [SEO_DEFAULT_IMAGE_PATH],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IT & Developer Jobs | KapIT',
    description: 'Browse public IT, software engineering, and developer jobs on KapIT.',
    images: [SEO_DEFAULT_IMAGE_PATH],
  },
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
