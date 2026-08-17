import React from 'react';

export interface MetricItem {
  label: string;
  value: string | number;
}

export interface MetricStripProps {
  label?: string;
  items: readonly MetricItem[];
  className?: string;
}

export const MetricStrip = ({ label, items, className = '' }: MetricStripProps) => (
  <dl aria-label={label} className={`flex flex-wrap items-stretch divide-x divide-hairline ${className}`}>
    {items.map((item, index) => (
      <div key={`${item.label}-${index}`} className="flex min-w-24 flex-col gap-0.5 px-3 first:pl-0 last:pr-0">
        <dt className="t-eyebrow text-ink-faint">{item.label}</dt>
        <dd className="t-data text-base font-semibold text-ink">{item.value}</dd>
      </div>
    ))}
  </dl>
);
