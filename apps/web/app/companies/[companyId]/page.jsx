import { notFound } from 'next/navigation';
import CompanyProfileSeo from '../../../components/CompanyProfileSeo';
import { expressFetch } from '../../../lib/api';

export async function generateMetadata({ params }) {
  try {
    const data = await expressFetch(`/public/companies/${params.companyId}`, {
      next: { revalidate: 300 },
    });

    const profile = data?.profile;
    if (!profile) {
      return { title: 'Company not found' };
    }

    return {
      title: profile.companyName,
      description: profile.shortDescription || profile.bio || `Explore ${profile.companyName} on KapIT.`,
    };
  } catch {
    return { title: 'Company not found' };
  }
}

export default async function CompanyProfilePage({ params }) {
  try {
    const data = await expressFetch(`/public/companies/${params.companyId}`, {
      next: { revalidate: 300 },
    });

    if (!data?.profile) {
      notFound();
    }

    return <CompanyProfileSeo profile={data.profile} />;
  } catch {
    notFound();
  }
}