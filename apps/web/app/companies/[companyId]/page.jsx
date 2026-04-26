import { notFound } from 'next/navigation';
import { cache } from 'react';
import CompanyProfileSeo from '../../../components/CompanyProfileSeo';
import { expressFetch } from '../../../lib/api';
import {
  SEO_DEFAULT_IMAGE_PATH,
  SEO_SITE_NAME,
  toAbsoluteUrl,
} from '../../../lib/seo';

const getPublicCompanyProfile = cache(async (companyId) => {
  const data = await expressFetch(`/public/companies/${companyId}`, {
    next: { revalidate: 300 },
  });
  return data?.profile || null;
});

export async function generateMetadata({ params }) {
  try {
    const profile = await getPublicCompanyProfile(params.companyId);
    if (!profile) {
      return { title: 'Company Profile' };
    }

    const title = String(profile.companyName || 'Company Profile');
    const description = profile.shortDescription || profile.bio || `Explore ${title} on ${SEO_SITE_NAME}.`;
    const path = `/companies/${params.companyId}`;

    return {
      title,
      description,
      alternates: {
        canonical: path,
      },
      openGraph: {
        type: 'profile',
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
    return { title: 'Company Profile' };
  }
}

export default async function CompanyProfilePage({ params }) {
  try {
    const profile = await getPublicCompanyProfile(params.companyId);
    if (!profile) {
      notFound();
    }

    return <CompanyProfileSeo profile={profile} />;
  } catch {
    notFound();
  }
}
