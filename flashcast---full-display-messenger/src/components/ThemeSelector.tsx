import React from 'react';
import { DisplayTheme } from '../types';

interface ThemeSelectorProps {
  selectedTheme: DisplayTheme;
  onSelectTheme: (theme: DisplayTheme) => void;
}

const THEMES: { id: DisplayTheme; label: string; previewColor: string; bg: string }[] = [
  { id: 'neon', label: 'Neon Cyan', previewColor: 'bg-cyan-400', bg: 'hover:border-cyan-500/50' },
  { id: 'midnight', label: 'Midnight', previewColor: 'bg-purple-500', bg: 'hover:border-purple-500/50' },
  { id: 'crimson', label: 'Crimson', previewColor: 'bg-rose-500', bg: 'hover:border-rose-500/50' },
  { id: 'emerald', label: 'Emerald', previewColor: 'bg-emerald-400', bg: 'hover:border-emerald-500/50' },
  { id: 'sunset', label: 'Sunset', previewColor: 'bg-amber-500', bg: 'hover:border-amber-500/50' },
  { id: 'cyberpunk', label: 'Cyber Gold', previewColor: 'bg-yellow-400', bg: 'hover:border-yellow-500/50' },
  { id: 'monochrome', label: 'Monochrome', previewColor: 'bg-white', bg: 'hover:border-zinc-400' },
];

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ selectedTheme, onSelectTheme }) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 scrollbar-none">
      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider shrink-0 mr-1">
        ডিসপ্লে থিম:
      </span>
      {THEMES.map((th) => {
        const isSelected = selectedTheme === th.id;
        return (
          <button
            key={th.id}
            type="button"
            id={`theme-btn-${th.id}`}
            onClick={() => onSelectTheme(th.id)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
              isSelected
                ? 'bg-slate-800 text-white border-slate-600 shadow-md ring-1 ring-white/20'
                : 'bg-slate-900/60 text-slate-400 border-slate-800/80 hover:text-slate-200'
            } ${th.bg}`}
          >
            <span className={`w-2 h-2 rounded-full ${th.previewColor} shrink-0`} />
            <span>{th.label}</span>
          </button>
        );
      })}
    </div>
  );
};
