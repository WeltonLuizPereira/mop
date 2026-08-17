import React, { useState, useEffect, useId, useRef } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { ROTULO } from './Input';

export const MultiSelect = ({ label, options, value, onChange }: {
  label: string,
  options: {value: string, label: string}[],
  value: string[],
  onChange: (val: string[]) => void
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const rotuloId = useId();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (val: string) => {
    const newValue = value.includes(val)
      ? value.filter(v => v !== val)
      : [...value, val];
    onChange(newValue);
  };

  const toggleAll = () => {
    if (value.length === filteredOptions.length) {
      onChange([]);
    } else {
      onChange(filteredOptions.map(opt => opt.value));
    }
  };

  const clearAll = () => onChange([]);

  const displayText = value.length === 0
    ? 'Todos'
    : value.length === 1
      ? options.find(o => o.value === value[0])?.label || value[0]
      : `${value.length} selecionados`;

  const filteredOptions = options.filter(o => o.label.toLowerCase().includes(searchTerm.toLowerCase()));
  const todosMarcados = value.length === filteredOptions.length && filteredOptions.length > 0;

  return (
    <div className="relative mb-3" ref={containerRef}>
      <span id={rotuloId} className={ROTULO}>{label}</span>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-labelledby={rotuloId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={
          'w-full text-left rounded-sm border bg-canvas text-ink text-sm px-3 py-[9px] ' +
          'min-h-9 flex justify-between items-center gap-2 transition-colors duration-100 ' +
          (isOpen ? 'border-brand' : 'border-hairline-2 hover:bg-canvas-soft')
        }
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown size={14} className={`text-ink-faint shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {value.map(v => (
            <span key={v} className="inline-flex items-center gap-1 bg-brand-wash text-ink rounded-sm px-2 py-0.5 text-xs">
              {options.find(o => o.value === v)?.label ?? v}
              <button
                type="button"
                onClick={() => toggleOption(v)}
                aria-label={`Remover ${options.find(o => o.value === v)?.label ?? v}`}
                className="text-ink-faint hover:text-ink"
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-1 bg-canvas border border-hairline rounded-md shadow-2 z-50 flex flex-col min-w-[200px]">
           <div className="p-2 border-b border-hairline">
               <input
                   type="text"
                   placeholder="Buscar..."
                   aria-label={`Buscar em ${label}`}
                   className="w-full rounded-sm border border-hairline-2 bg-canvas text-ink text-xs px-2 py-1.5 placeholder:text-ink-faint"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   onClick={(e) => e.stopPropagation()}
               />
               <div className="flex justify-between items-center mt-2 px-1">
                   <button
                       type="button"
                       className="flex items-center gap-2 group/select"
                       onClick={(e) => { e.stopPropagation(); toggleAll(); }}
                   >
                       <span className={`w-4 h-4 rounded-xs border grid place-items-center transition-colors ${todosMarcados ? 'bg-brand border-brand' : 'border-hairline-2 bg-canvas'}`}>
                           {todosMarcados && <Check size={10} className="text-on-brand" />}
                       </span>
                       <span className="text-xs text-brand-text font-medium group-hover/select:underline">Selecionar todos</span>
                   </button>
                   <button
                       type="button"
                       className="t-eyebrow text-ink-faint hover:text-ink transition-colors"
                       onClick={(e) => { e.stopPropagation(); clearAll(); }}
                   >
                       Limpar
                   </button>
               </div>
           </div>
           <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                 filteredOptions.map(opt => {
                    const isSelected = value.includes(opt.value);
                    return (
                    <button
                      type="button"
                      key={opt.value}
                      role="option"
                      aria-selected={isSelected}
                      className={`w-full text-left flex items-center gap-2 px-3 py-2 transition-colors ${isSelected ? 'bg-brand-wash text-ink' : 'hover:bg-canvas-soft text-ink-2'}`}
                      onClick={() => toggleOption(opt.value)}
                    >
                      <span className={`w-4 h-4 rounded-xs border grid place-items-center shrink-0 transition-colors ${isSelected ? 'bg-brand border-brand' : 'border-hairline-2 bg-canvas'}`}>
                          {isSelected && <Check size={10} className="text-on-brand" />}
                      </span>
                      <span className="text-xs">{opt.label}</span>
                    </button>
                 )})
              ) : (
                <p className="px-3 py-3 text-center text-xs text-ink-faint">Nenhum resultado</p>
              )}
           </div>
        </div>
      )}
    </div>
  );
};
