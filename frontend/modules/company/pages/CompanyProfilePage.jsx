import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@sharedComponents/ui/ToastProvider';
import { companyAPI } from '@companyFeatures/companyAPI';
import ImageCropperModal from '@sharedComponents/modals/ImageCropperModal';
import { readFileAsDataUrl, validateImageFile } from '@sharedUtils/imageUpload';

const createRelatedCompany = () => ({ name: '', shortDescription: '', website: '' });

export default function CompanyProfilePage({ user, onUpdated }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logoBusy, setLogoBusy] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [rawImage, setRawImage] = useState('');
  const [form, setForm] = useState({
    name: user?.companyName || user?.username || '',
    logo: user?.profileImage || '',
    shortDescription: user?.bio || '',
    description: user?.bio || '',
    location: user?.address || '',
    website: user?.website || '',
    relatedCompanies: [],
  });

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
    const validation = validateImageFile(file);
    if (!validation.ok) {
      toast.warning(validation.message);
      return;
    }
    (async () => {
      try {
        setLogoBusy(true);
        const raw = await readFileAsDataUrl(file);
        setRawImage(raw);
        setCropOpen(true);
      } catch (err) {
        setError(err?.message || 'Failed to load image');
      } finally {
        setLogoBusy(false);
      }
    })();
  };

  const handleConfirmCrop = async (croppedDataUrl) => {
    setForm((prev) => ({ ...prev, logo: croppedDataUrl }));
    setCropOpen(false);
    setRawImage('');
    toast.success('Logo updated.');
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
      toast.success('Company profile saved.');
    } catch (err) {
      setError(err?.message || 'Failed to save company profile');
    } finally {
      setSaving(false);
    }
  };

  const initial = (form.name || 'C').charAt(0).toUpperCase();

  return (
    <div className="company-workspace-page company-workspace-form-page space-y-6">
      <div>
        <h1 className="company-workspace-page-title">Company profile</h1>
        <p className="mt-1 text-sm text-[var(--workspace-text-muted)]">Manage the employer identity and information candidates can review.</p>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {loading && <p className="text-sm text-[#344e41] dark:text-[#d0d7dd]">Loading company profile...</p>}

      <div className="company-workspace-form-shell space-y-6">
        <section className="company-workspace-form-section space-y-6">
          <div>
            <h2 className="company-workspace-section-title">Public company profile</h2>
            <p className="mt-1 text-xs text-[var(--workspace-text-muted)]">Keep the identity, summary, and company links candidates will see in sync.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#f5f5f2] dark:bg-[#353c44] border border-[#a3b18a] dark:border-[#444d57] overflow-hidden text-[#3a5a40] dark:text-white flex items-center justify-center font-extrabold text-2xl transition-colors duration-300">
              {form.logo ? <img src={form.logo} alt="Company logo" className="w-full h-full object-cover" /> : initial}
            </div>
            <div className="space-y-1">
              <div className="text-sm font-semibold text-[#3a5a40] dark:text-white">Company logo</div>
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#a3b18a] dark:border-[#444d57] text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#353c44] cursor-pointer text-sm transition-colors">
                {logoBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {logoBusy ? 'Preparing...' : 'Upload'}
                <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handleLogoSelect} disabled={logoBusy} />
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
        </section>

        <section className="company-workspace-form-section space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="company-workspace-section-title">Related companies</h2>
            </div>
            <button type="button" onClick={addRelatedCompany} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#a3b18a] dark:border-[#444d57] text-[#344e41] dark:text-white hover:bg-[#f5f5f2] dark:hover:bg-[#353c44] transition-colors">
              <Plus className="w-4 h-4" />
              Add company
            </button>
          </div>

          {form.relatedCompanies.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#a3b18a] dark:border-[#444d57] p-4 text-sm text-[#344e41] dark:text-[#d0d7dd]">
              No related companies added yet.
            </div>
          ) : (
            <div className="space-y-4">
              {form.relatedCompanies.map((item, index) => (
                <div key={`related-company-${index}`} className="rounded-xl border border-[#a3b18a] dark:border-[#444d57] p-4 space-y-3">
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

        <div className="company-workspace-form-actions">
          <button type="button" disabled={saving || loading} onClick={handleSave} className="px-4 py-2.5 rounded-xl bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#6f9b74] dark:hover:bg-[#82ad86] text-white font-semibold disabled:opacity-60 transition-colors">
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </div>
      </div>

      <ImageCropperModal
        isOpen={cropOpen}
        imageSrc={rawImage}
        title="Crop company logo"
        confirmLabel="Use cropped logo"
        onClose={() => {
          setCropOpen(false);
          setRawImage('');
        }}
        onConfirm={handleConfirmCrop}
      />
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



