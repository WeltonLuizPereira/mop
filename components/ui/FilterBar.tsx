import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from './Button';

export interface FilterBarProps {
  children: React.ReactNode;
  hasActiveFilters: boolean;
  onClear: () => void;
  clearLabel?: string;
  className?: string;
}

export const FilterBar = ({
  children,
  hasActiveFilters,
  onClear,
  clearLabel = 'Limpar filtros',
  className = '',
}: FilterBarProps) => (
  <section aria-label="Filtros" className={`rounded-lg border border-hairline bg-canvas-soft p-4 ${className}`}>
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="t-eyebrow flex items-center gap-2 text-ink-faint">
        <SlidersHorizontal aria-hidden="true" size={13} />
        Filtros
      </div>
      <Button variant="ghost" size="sm" disabled={!hasActiveFilters} onClick={onClear}>
        {clearLabel}
      </Button>
    </div>
    {children}
  </section>
);
