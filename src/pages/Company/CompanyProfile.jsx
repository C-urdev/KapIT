import React, { useState } from 'react';
import { companyAPI } from '@features/company/companyAPI';

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

export default function CompanyProfile({ user, onUpdated }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: user?.companyName || user?.username || '',
    logo: user?.profileImage || '',
    description: user?.bio || '',
    location: user?.address || '',
    website: user?.website || '',
  });

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

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      const data = await companyAPI.updateProfile(form);
      onUpdated?.(data?.company, form);
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
        <p className="text-sm text-[#344e41] dark:text-[#b8d4e8]">Update your branding and company info.</p>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="rounded-2xl border border-[#a3b18a] dark:border-[#1e3a5f] bg-white dark:bg-[#162842] shadow-lg shadow-black/5 dark:shadow-black/20 p-8 space-y-6 transition-colors duration-300">
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
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="field"
            placeholder="Your company name"
            required
          />
        </Field>

        <Field label="Website (optional)">
          <input
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            className="field"
            placeholder="https://"
          />
        </Field>

        <Field label="Location (optional)">
          <input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="field"
            placeholder="City, Province"
          />
        </Field>

        <Field label="Description (optional)">
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="field min-h-32"
            placeholder="Tell candidates what you do and who you’re hiring."
          />
        </Field>

        <div className="flex justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="px-4 py-2.5 rounded-xl bg-[#3a5a40] hover:bg-[#344e41] dark:bg-[#3ba9d6] dark:hover:bg-[#5bc0de] text-white font-semibold disabled:opacity-60 transition-colors"
          >
            {saving ? 'Saving…' : 'Save profile'}
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
