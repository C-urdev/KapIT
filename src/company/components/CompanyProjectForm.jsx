import React from 'react';
import { ClipboardList } from 'lucide-react';

const SERVICES = [
  'Web Development',
  'Mobile Development',
  'Cybersecurity',
  'UI/UX Design',
  'Database Development',
];

export default function ProjectForm({ value, onChange }) {
  const project = value || {};

  const set = (patch) => onChange?.({ ...project, ...patch });

  const toggleService = (service) => {
    const current = Array.isArray(project.servicesNeeded) ? project.servicesNeeded : [];
    const exists = current.includes(service);
    const next = exists ? current.filter((s) => s !== service) : [...current, service];
    set({ servicesNeeded: next });
  };

  return (
    <div className="rounded-xl border border-[#a3b18a] dark:border-[#2a4a6f] bg-white dark:bg-[#162842] p-4 transition-colors duration-300">
      <div className="flex items-center gap-2 text-[#344e41] dark:text-white">
        <ClipboardList className="w-5 h-5 text-[#588157] dark:text-[#3ba9d6]" />
        <span className="font-semibold">Project Details</span>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Project Title">
          <input
            value={project.title || ''}
            onChange={(e) => set({ title: e.target.value })}
            className="field"
            placeholder="e.g. Company website redesign"
          />
        </Field>

        <Field label="Budget Range">
          <input
            value={project.budgetRange || ''}
            onChange={(e) => set({ budgetRange: e.target.value })}
            className="field"
            placeholder="e.g. ₱50k–₱150k"
          />
        </Field>

        <Field label="Timeline">
          <input
            value={project.timeline || ''}
            onChange={(e) => set({ timeline: e.target.value })}
            className="field"
            placeholder="e.g. 6 weeks"
          />
        </Field>

        <Field label="Services Needed" full>
          <div className="grid sm:grid-cols-2 gap-2">
            {SERVICES.map((service) => {
              const selected = Array.isArray(project.servicesNeeded) && project.servicesNeeded.includes(service);
              return (
                <button
                  key={service}
                  type="button"
                  onClick={() => toggleService(service)}
                  className={`text-left rounded-xl border px-4 py-3 text-sm font-semibold ${
                    selected
                      ? 'border-[#588157] bg-[#eef6ee] text-[#3a5a40] dark:border-[#3ba9d6] dark:bg-[#1e3a5f] dark:text-white'
                      : 'border-[#a3b18a] dark:border-[#2a4a6f] bg-[#f5f5f2] dark:bg-[#0f2139] text-[#344e41] dark:text-white hover:bg-[#dad7cd] dark:hover:bg-[#1e3a5f]'
                  }`}
                >
                  {service}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Project Description" full>
          <textarea
            value={project.description || ''}
            onChange={(e) => set({ description: e.target.value })}
            className="field min-h-28"
            placeholder="Describe the project scope, goals, and requirements."
          />
        </Field>
      </div>
    </div>
  );
}

function Field({ label, full = false, children }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="block text-sm font-semibold text-[#3a5a40] dark:text-white mb-1">{label}</label>
      {children}
    </div>
  );
}



