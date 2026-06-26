import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '@sharedServices/apiClient';
import CompanyProfileSeo from '../../../components/CompanyProfileSeo';

export default function CompanyDetails() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await apiRequest(`/public/companies/${companyId}`);
        if (!data?.profile) {
          navigate('/');
          return;
        }
        setProfile(data.profile);
      } catch (err) {
        console.error('Failed to load company profile', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [companyId, navigate]);

  if (loading) return <div>Loading...</div>;
  if (!profile) return null;

  return <CompanyProfileSeo profile={profile} />;
}
