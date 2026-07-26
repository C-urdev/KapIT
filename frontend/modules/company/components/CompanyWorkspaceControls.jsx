import React from 'react';

export function CompanyPeriodControl({ value, options, onChange, label = 'Period' }) {
  return (
    <div className="company-workspace-period-control" aria-label={label}>
      <span className="company-workspace-period-label">{label}</span>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          data-active={value === option.value}
          aria-pressed={value === option.value}
          className="company-workspace-period-option"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function CompanyStatStrip({ metrics, loading = false }) {
  return (
    <section className="company-workspace-stat-strip" aria-label="Workspace metrics">
      {metrics.map((metric) => (
        <article key={metric.label} className="company-workspace-stat-cell">
          <p className="company-workspace-stat-label">{metric.label}</p>
          <p className="company-workspace-stat-value">{loading ? '-' : metric.value}</p>
          {metric.sublabel ? <p className="company-workspace-stat-copy">{metric.sublabel}</p> : null}
        </article>
      ))}
    </section>
  );
}
