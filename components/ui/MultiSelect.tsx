import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export const MultiSelect = ({ label, options, value, onChange }: {
  label: string,
  options: {value: string, label: string}[],
  value: string[],
  onChange: (val: string[]) => void
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="relative group" ref={containerRef}>
      <label className="text-[10px] font-bold text-fg-muted uppercase mb-1 block">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left px-3 py-2 bg-surface-alt border rounded-lg text-xs focus:ring-1 focus:ring-primary flex justify-between items-center h-[34px] transition-colors ${isOpen ? 'border-primary ring-1 ring-primary bg-surface' : 'border-transparent hover:bg-border/30'}`}
      >
        <span className="truncate block max-w-[90%] text-fg font-medium">{displayText}</span>
        <ChevronDown size={14} className={`text-fg-subtle transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="mop-pop-in absolute top-full left-0 w-full mt-1 bg-surface border border-border rounded-lg shadow-2 z-50 flex flex-col min-w-[200px]">
           <div className="p-2 border-b border-border">
               <input
                   type="text"
                   placeholder="Buscar..."
                   className="w-full px-2 py-1.5 bg-surface text-fg border border-primary rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   onClick={(e) => e.stopPropagation()}
               />
               <div className="flex justify-between items-center mt-2 px-1">
                   <div
                       className="flex items-center gap-2 cursor-pointer group/select"
                       onClick={(e) => { e.stopPropagation(); toggleAll(); }}
                   >
                       <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${value.length === filteredOptions.length && filteredOptions.length > 0 ? 'bg-primary border-primary' : 'border-border-strong bg-surface'}`}>
                           {value.length === filteredOptions.length && filteredOptions.length > 0 && <Check size={10} className="text-on-primary" />}
                       </div>
                       <span className="text-xs text-primary font-medium group-hover/select:underline">Selecionar todos</span>
                   </div>
                   <span
                       className="text-[10px] uppercase font-bold text-fg-subtle cursor-pointer hover:text-fg transition-colors"
                       onClick={(e) => { e.stopPropagation(); clearAll(); }}
                   >
                       Limpar
                   </span>
               </div>
           </div>
           <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                 filteredOptions.map(opt => {
                    const isSelected = value.includes(opt.value);
                    return (
                    <div key={opt.value} className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${isSelected ? 'bg-primary-tonal text-primary' : 'hover:bg-surface-alt text-fg'}`} onClick={() => toggleOption(opt.value)}>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-border-strong bg-surface'}`}>
                          {isSelected && <Check size={10} className="text-on-primary" />}
                      </div>
                      <span className="text-xs">{opt.label}</span>
                    </div>
                 )})
              ) : (
                <div className="px-3 py-3 text-center text-xs text-fg-subtle">Nenhum resultado</div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};
