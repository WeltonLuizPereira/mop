import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { Field } from './Field';
import { CAMPO } from './Input';

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  id?: string;
  label: string;
  options: readonly MultiSelectOption[];
  value: readonly string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export const MultiSelect = ({
  id, label, options, value, onChange, placeholder = 'Todos', hint, error, disabled = false, className = '',
}: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [announcement, setAnnouncement] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();
  const filteredOptions = options.filter(option => option.label.toLowerCase().includes(searchTerm.toLowerCase()));
  const enabledOptions = filteredOptions.filter(option => !option.disabled);
  const allSelected = enabledOptions.length > 0 && enabledOptions.every(option => value.includes(option.value));

  useEffect(() => {
    const closeOnOutsidePointer = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsidePointer);
    return () => document.removeEventListener('mousedown', closeOnOutsidePointer);
  }, []);

  const open = () => {
    if (disabled) return;
    setIsOpen(true);
    setActiveIndex(current => current >= 0 && !filteredOptions[current]?.disabled ? current : filteredOptions.findIndex(option => !option.disabled));
  };
  const close = () => {
    setIsOpen(false);
    setActiveIndex(-1);
    triggerRef.current?.focus();
  };
  const toggleOption = (option: MultiSelectOption) => {
    if (option.disabled) return;
    const selected = value.includes(option.value);
    onChange(selected ? value.filter(item => item !== option.value) : [...value, option.value]);
    setAnnouncement(`${option.label} ${selected ? 'removido' : 'selecionado'}`);
  };
  const moveActiveOption = (direction: 1 | -1) => {
    if (!filteredOptions.length) return;
    let nextIndex = activeIndex;
    for (let count = 0; count < filteredOptions.length; count += 1) {
      nextIndex = (nextIndex + direction + filteredOptions.length) % filteredOptions.length;
      if (!filteredOptions[nextIndex].disabled) {
        setActiveIndex(nextIndex);
        return;
      }
    }
  };
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;
    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    if (event.target instanceof HTMLInputElement) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) open();
      moveActiveOption(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }
    if ((event.key === ' ' || event.key === 'Enter') && isOpen && activeIndex >= 0) {
      event.preventDefault();
      const option = filteredOptions[activeIndex];
      if (option) toggleOption(option);
    }
  };
  const toggleAll = () => {
    if (allSelected) {
      onChange(value.filter(item => !enabledOptions.some(option => option.value === item)));
      setAnnouncement('Seleções filtradas removidas');
    } else {
      onChange([...value, ...enabledOptions.filter(option => !value.includes(option.value)).map(option => option.value)]);
      setAnnouncement('Todas as opções filtradas selecionadas');
    }
  };
  const displayText = value.length === 0 ? placeholder : value.length === 1 ? options.find(option => option.value === value[0])?.label ?? value[0] : `${value.length} selecionados`;

  return (
    <div className={`relative ${className}`} ref={containerRef} onKeyDown={onKeyDown}>
      <Field label={label} hint={hint} error={error}>
        <button ref={triggerRef} id={id} type="button" disabled={disabled} aria-expanded={isOpen} aria-haspopup="listbox" aria-controls={isOpen ? listboxId : undefined} className={`${CAMPO} text-left flex justify-between items-center gap-2 ${isOpen ? '!border-brand' : 'hover:bg-canvas-soft'}`} onClick={() => isOpen ? close() : open()}>
          <span className="truncate">{displayText}</span>
          <ChevronDown aria-hidden="true" size={14} className={`text-ink-faint shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </Field>
      {value.length > 0 && <div className="flex flex-wrap gap-1 mt-1.5">{value.map(item => {
        const option = options.find(candidate => candidate.value === item);
        const itemLabel = option?.label ?? item;
        return <span key={item} className="inline-flex items-center gap-1 bg-brand-wash text-ink rounded-sm px-2 py-0.5 text-xs">{itemLabel}<button type="button" onClick={() => option && toggleOption(option)} aria-label={`Remover ${itemLabel}`} className="text-ink-faint hover:text-ink"><X aria-hidden="true" size={11} /></button></span>;
      })}</div>}
      {isOpen && <div className="absolute top-full left-0 w-full mt-1 bg-canvas border border-hairline rounded-md shadow-2 z-50 flex flex-col min-w-[200px]">
        <div className="p-2 border-b border-hairline">
          <input type="text" placeholder="Buscar..." aria-label={`Buscar em ${label}`} className="w-full rounded-sm border border-hairline-2 bg-canvas text-ink text-xs px-2 py-1.5 placeholder:text-ink-faint" value={searchTerm} onChange={event => { setSearchTerm(event.target.value); setActiveIndex(-1); }} />
          <div className="flex justify-between items-center mt-2 px-1">
            <button type="button" className="flex items-center gap-2 group/select" onClick={toggleAll}><span className={`w-4 h-4 rounded-xs border grid place-items-center transition-colors ${allSelected ? 'bg-brand border-brand' : 'border-hairline-2 bg-canvas'}`}>{allSelected && <Check aria-hidden="true" size={10} className="text-on-brand" />}</span><span className="text-xs text-brand-text font-medium group-hover/select:underline">Selecionar todos</span></button>
            <button type="button" className="t-eyebrow text-ink-faint hover:text-ink transition-colors" onClick={() => { onChange([]); setAnnouncement('Seleções removidas'); }}>Limpar</button>
          </div>
        </div>
        <div id={listboxId} role="listbox" aria-label={label} aria-multiselectable="true" className="max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? filteredOptions.map((option, index) => {
            const selected = value.includes(option.value);
            return <button type="button" key={option.value} role="option" aria-selected={selected} aria-disabled={option.disabled || undefined} disabled={option.disabled} className={`w-full text-left flex items-center gap-2 px-3 py-2 transition-colors ${activeIndex === index ? 'bg-canvas-soft' : ''} ${selected ? 'bg-brand-wash text-ink' : 'hover:bg-canvas-soft text-ink-2'} disabled:opacity-50`} onClick={() => { setActiveIndex(index); toggleOption(option); }}><span aria-hidden="true" className={`w-4 h-4 rounded-xs border grid place-items-center shrink-0 transition-colors ${selected ? 'bg-brand border-brand' : 'border-hairline-2 bg-canvas'}`}>{selected && <Check size={10} className="text-on-brand" />}</span><span className="text-xs">{option.label}</span></button>;
          }) : <p className="px-3 py-3 text-center text-xs text-ink-faint">Nenhum resultado</p>}
        </div>
      </div>}
      <div role="status" aria-live="polite" className="sr-only">{announcement}</div>
    </div>
  );
};
