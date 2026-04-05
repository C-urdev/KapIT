import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { companyAPI } from '@companyFeatures/companyAPI';

const createRelatedCompany = () => ({ name: '', shortDescription: '', website: '' });

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

const downscaleImageDataUrl = (dataUrl, { maxSize = 320, quality = 0.85 } = {}) =>
  new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const width = image.naturalWidth || image.width || 0;
      const height = image.naturalHeight || image.height || 0;
      if (!width || !height) return resolve(dataUrl);

      const scale = Math.min(1, maxSize / Math.max(width, height));
      const targetWidth = Math.max(1, Math.round(width * scale));
      const targetHeight = Math.max(1, Math.round(height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

      try {
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch {
        resolve(dataUrl);
      }
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });

export default function CompanyProfilePage({ user, onUpdated }) {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: user?.companyName || user?.username || '',
    logo: user?.profileImage || '',
    shortDescription: user?.bio || '',
    description: user?.bio || '',
    location: user?.address || '',
    website: user?.website || '',
    relatedCompanies: [],
  });
  const [onboardingDetails, setOnboardingDetails] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const loadProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await companyAPI.getProfile();
        if (cancelled) return;
        const company = data?.company || {};
        setForm({
          name: company?.name || user?.companyName || user?.username || '',
          logo: company?.logo || user?.profileImage || '',
          shortDescription: company?.short_description || user?.bio || '',
          description: company?.description || user?.bio || '',
          location: company?.location || user?.address || '',
          website: company?.website || user?.website || '',
          relatedCompanies: Array.isArray(company?.related_companies) ? company.related_companies.map((item) => ({
            name: item?.name || '',
            shortDescription: item?.shortDescription || '',
            website: item?.website || '',
          })) : [],
        });
        setOnboardingDetails({
          ...(company?.onboardingProfile || {}),
          latestProject: company?.latestProject || null,
        });
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Failed to load company profile');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleLogoSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    (async () => {
      try {
        const raw = await readFileAsDataUrl(file);
        const next = await downscaleImageDataUrl(raw, { maxSize: 320, quality: 0.85 });
        setForm((prev) => ({ ...prev, logo: next }));
      } catch (err) {
        setError(err?.message || 'Failed to load image');
      }
    })();
  };

  const handleRelatedCompanyChange = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      relatedCompanies: prev.relatedCompanies.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)),
    }));
  };

  const addRelatedCompany = () => {
    setForm((prev) => ({
      ...prev,
      relatedCompanies: [...prev.relatedCompanies, createRelatedCompany()],
    }));
  };

  const removeRelatedCompany = (index) => {
    setForm((prev) => ({
      ...prev,
      relatedCompanies: prev.relatedCompanies.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        relatedCompanies: form.relatedCompanies.filter((item) => String(item?.name || '').trim()),
      };
      const data = await companyAPI.updateProfile(payload);
      onUpdated?.(data?.company, payload);
      window.alert('Company profile saved.');
    } catch (err) {
      setError(err?.message || 'Failed to save company profile');
    } finally {
      setSaving(false);
    }
  };

  const initial = (form.name || 'C').charAt(0).toUpperCase();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-[#3a5a40] dark:text-white">Company profile</h2>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {loading && <p className="text-sm text-[#344e41] dark:text-[#b8d4e8]">Loading company profile...</p>}

      <div className="rounded-2xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#162842] shadow-lg shadow-black/5 dark:shadow-black/20 p-8 space-y-6 transition-colors duration-300">
        {onboardingDetails && (
          <section className="space-y-4 rounded-2xl border border-[#d8dfc9] dark:border-[#2a4a6f] bg-[#f8faf5] dark:bg-[#102235] p-5">
            <div>
              <h3 className="text-lg font-bold text-[#3a5a40] dark:text-white">Company onboarding details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ReadOnlyField label="Industry" value={onboardingDetails.industry} />
              <ReadOnlyField label="Company Size" value={onboardingDetails.companySize} />
              <ReadOnlyField label="Contact Email" value={onboardingDetails.contactEmail} />
              <ReadOnlyField label="Phone Number" value={onboardingDetails.phoneNumber} />
              <ReadOnlyField
                label="Services Needed"
                value={Array.isArray(onboardingDetails.servicesNeeded) ? onboardingDetails.servicesNeeded.join(', ') : ''}
              />
              <ReadOnlyField label="Saved Location" value={onboardingDetails.location} />
            </div>

            {onboardingDetails.latestProject ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ReadOnlyField label="Project Title" value={onboardingDetails.latestProject.title} />
                <ReadOnlyField label="Budget Range" value={onboardingDetails.latestProject.budgetRange} />
                <ReadOnlyField label="Timeline" value={onboardingDetails.latestProject.timeline} />
                <ReadOnlyField label="Project Description" value={onboardingDetails.latestProject.description} full />
              </div>
            ) : null}
          </section>
        )}

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#f5f5f2] dark:bg-[#1e3a5f] border border-[#a3b18a] dark:border-[#2a4a6f] overflow-hidden text-[#3a5a40] dark:text-white flex items-center justify-center font-extrabold text-2xl transition-colors duration-300">
            {form.logo ? <img src={form.logo} alt="Company logo" className="w-full h-full object-cover" /> : initial}
          </div>
          <div className="space-y-1">
            <div className="text-sm font-semibold text-[#3a5a40] dark:text-white">Company logo</div>
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#a3b18a] dark:border-[#2a4a6f] text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] cursor-pointer text-sm transition-colors">
              Upload
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
            </label>
          </div>
        </div>

        <Field label="Company name">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="field" placeholder="Your company name" required />
        </Field>

        <Field label="Short description">
          <input value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} className="field" placeholder="A short public summary about your company" maxLength={220} />
        </Field>

        <Field label="Full company description (optional)">
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="field min-h-32" placeholder="Tell candidates what your company does, who you serve, and who you hire." />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Website (optional)">
            <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="field" placeholder="https://" />
          </Field>

          <Field label="Location (optional)">
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="field" placeholder="City, Province" />
          </Field>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-[#3a5a40] dark:text-white">Related companies</h3>
            </div>
            <button type="button" onClick={addRelatedCompany} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#a3b18a] dark:border-[#2a4a6f] text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#1e3a5f] transition-colors">
              <Plus className="w-4 h-4" />
              Add company
            </button>
          </div>

          {form.relatedCompanies.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#a3b18a] dark:border-[#2a4a6f] p-4 text-sm text-[#344e41] dark:text-[#b8d4e8]">
              No related companies added yet.
            </div>
          ) : (
            <div className="space-y-4">
              {form.relatedCompanies.map((item, index) => (
                <div key={`related-company-${index}`} className="rounded-xl border border-[#a3b18a] dark:border-[#2a4a6f] p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#3a5a40] dark:text-white">Related company #{index + 1}</p>
                    <button type="button" onClick={() => removeRelatedCompany(index)} className="inline-flex items-center gap-2 text-sm text-red-600 dark:text-red-300 hover:underline">
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                  <input value={item.name} onChange={(e) => handleRelatedCompanyChange(index, 'name', e.target.value)} className="field" placeholder="Company name" />
                  <input value={item.shortDescription} onChange={(e) => handleRelatedCompanyChange(index, 'shortDescription', e.target.value)} className="field" placeholder="Short description" maxLength={220} />
                  <input value={item.website} onChange={(e) => handleRelatedCompanyChange(index, 'website', e.target.value)} className="field" placeholder="https://" />
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="flex justify-end">
          <button type="button" disabled={saving || loading} onClick={handleSave} className="px-4 py-2.5 rounded-xl bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de] text-white font-semibold disabled:opacity-60 transition-colors">
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-semibold text-[#3a5a40] dark:text-white">{label}</label>
      {children}
    </div>
  );
}

function ReadOnlyField({ label, value, full = false }) {
  if (!String(value || '').trim()) {
    return null;
  }

  return (
    <div className={`${full ? 'md:col-span-2' : ''} space-y-1`}>
      <p className="text-sm font-semibold text-[#3a5a40] dark:text-white">{label}</p>
      <div className="rounded-xl border border-[#d8dfc9] dark:border-[#2a4a6f] bg-white dark:bg-[#162842] px-4 py-3 text-sm text-[#344e41] dark:text-[#dcecff]">
        {value}
      </div>
    </div>
  );
}



