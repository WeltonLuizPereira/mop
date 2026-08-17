import React, { useRef } from 'react';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  panelId: string;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string> {
  label: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const activate = (index: number) => {
    const option = options[index];
    if (!option || option.disabled) return;
    refs.current[index]?.focus();
    onChange(option.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    const enabledIndexes = options.flatMap((option, index) => option.disabled ? [] : [index]);
    if (!enabledIndexes.length) return;
    const enabledPosition = enabledIndexes.indexOf(currentIndex);
    let nextIndex: number | undefined;

    if (event.key === 'ArrowRight') {
      nextIndex = enabledIndexes[(enabledPosition + 1) % enabledIndexes.length];
    } else if (event.key === 'ArrowLeft') {
      nextIndex = enabledIndexes[(enabledPosition - 1 + enabledIndexes.length) % enabledIndexes.length];
    } else if (event.key === 'Home') {
      nextIndex = enabledIndexes[0];
    } else if (event.key === 'End') {
      nextIndex = enabledIndexes[enabledIndexes.length - 1];
    }

    if (nextIndex === undefined) return;
    event.preventDefault();
    activate(nextIndex);
  };

  return (
    <div role="tablist" aria-label={label} className="inline-flex rounded-md border border-hairline bg-canvas-soft p-1">
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={element => { refs.current[index] = element; }}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={option.panelId}
            disabled={option.disabled}
            tabIndex={selected ? 0 : -1}
            className={`min-h-8 rounded-sm px-3 text-[13px] font-semibold transition-colors ${selected ? 'bg-canvas text-ink shadow-1' : 'text-ink-mute hover:text-ink'} disabled:opacity-40`}
            onClick={() => onChange(option.value)}
            onKeyDown={event => handleKeyDown(event, index)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
