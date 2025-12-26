import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export const StatInput = ({ label, value, onChange, colorClass, placeholder, disabled, min, max, step }: any) => (
  <div>
    <label className={`text-[10px] font-black uppercase tracking-widest mb-1 block ${disabled ? 'text-gray-300' : 'text-gray-400'}`}>
      {label}
    </label>
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      value={value === 0 && !disabled ? '' : value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 rounded-xl border-2 outline-none transition-all font-mono text-base font-bold 
        ${disabled 
          ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' 
          : `${colorClass} focus:ring-2 focus:ring-opacity-50`}`}
      onWheel={(e) => e.currentTarget.blur()}
    />
  </div>
);

export const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = false }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-emerald-500" />}
          <h3 className="font-black text-gray-800 text-sm uppercase tracking-wide">{title}</h3>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>
      {isOpen && (
        <div className="p-6 pt-0 border-t border-gray-50 animate-in slide-in-from-top-2 duration-200">
          <div className="pt-6">{children}</div>
        </div>
      )}
    </div>
  );
};
