import React from 'react';

interface BookCoverProps {
  title: string;
  genre: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const GENRE_THEMES: Record<string, { bg: string; text: string; accent: string; pattern: string }> = {
  'Literary Fiction': {
    bg: 'from-emerald-900 via-teal-900 to-slate-900',
    text: 'text-emerald-100',
    accent: 'bg-emerald-400/20 text-emerald-200 border-emerald-400/30',
    pattern: 'radial-gradient(circle at 70% 30%, rgba(20, 184, 166, 0.25) 0%, transparent 60%)',
  },
  'Non-Fiction / Memoir': {
    bg: 'from-amber-900 via-stone-900 to-slate-950',
    text: 'text-amber-100',
    accent: 'bg-amber-400/20 text-amber-200 border-amber-400/30',
    pattern: 'radial-gradient(circle at 30% 70%, rgba(245, 158, 11, 0.2) 0%, transparent 60%)',
  },
  'Self-Help / Technology': {
    bg: 'from-blue-950 via-slate-900 to-indigo-950',
    text: 'text-blue-100',
    accent: 'bg-blue-400/20 text-blue-200 border-blue-400/30',
    pattern: 'radial-gradient(circle at 50% 20%, rgba(59, 130, 246, 0.25) 0%, transparent 60%)',
  },
  'Business / Entrepreneurship': {
    bg: 'from-slate-900 via-zinc-900 to-blue-950',
    text: 'text-slate-100',
    accent: 'bg-cyan-400/20 text-cyan-200 border-cyan-400/30',
    pattern: 'radial-gradient(circle at 80% 80%, rgba(6, 182, 212, 0.2) 0%, transparent 60%)',
  },
  'Historical Fiction': {
    bg: 'from-amber-950 via-yellow-950 to-stone-950',
    text: 'text-amber-100',
    accent: 'bg-amber-300/20 text-amber-200 border-amber-300/30',
    pattern: 'radial-gradient(circle at 40% 40%, rgba(217, 119, 6, 0.25) 0%, transparent 60%)',
  },
  'Self-Help': {
    bg: 'from-teal-950 via-emerald-950 to-slate-950',
    text: 'text-teal-100',
    accent: 'bg-teal-400/20 text-teal-200 border-teal-400/30',
    pattern: 'radial-gradient(circle at 60% 60%, rgba(13, 148, 136, 0.25) 0%, transparent 60%)',
  },
  'Poetry': {
    bg: 'from-violet-950 via-purple-950 to-slate-950',
    text: 'text-purple-100',
    accent: 'bg-purple-400/20 text-purple-200 border-purple-400/30',
    pattern: 'radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.25) 0%, transparent 60%)',
  },
  'Romance': {
    bg: 'from-rose-950 via-pink-950 to-slate-950',
    text: 'text-rose-100',
    accent: 'bg-rose-400/20 text-rose-200 border-rose-400/30',
    pattern: 'radial-gradient(circle at 30% 30%, rgba(244, 63, 94, 0.25) 0%, transparent 60%)',
  },
  'Thriller': {
    bg: 'from-stone-950 via-zinc-950 to-red-950',
    text: 'text-stone-100',
    accent: 'bg-red-400/20 text-red-200 border-red-400/30',
    pattern: 'radial-gradient(circle at 70% 70%, rgba(239, 68, 68, 0.25) 0%, transparent 60%)',
  },
  'Crime / Thriller': {
    bg: 'from-zinc-950 via-slate-900 to-stone-950',
    text: 'text-slate-100',
    accent: 'bg-rose-400/20 text-rose-200 border-rose-400/30',
    pattern: 'radial-gradient(circle at 20% 80%, rgba(225, 29, 72, 0.25) 0%, transparent 60%)',
  },
  DEFAULT: {
    bg: 'from-slate-900 via-slate-800 to-zinc-950',
    text: 'text-slate-100',
    accent: 'bg-emerald-400/20 text-emerald-200 border-emerald-400/30',
    pattern: 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.2) 0%, transparent 60%)',
  },
};

export const BookCover: React.FC<BookCoverProps> = ({
  title,
  genre,
  className = '',
  size = 'md',
}) => {
  const theme =
    Object.entries(GENRE_THEMES).find(([key]) => genre.toLowerCase().includes(key.toLowerCase()))?.[1] ||
    GENRE_THEMES.DEFAULT;

  const sizeClasses = {
    sm: 'w-24 h-36 p-3 rounded-lg',
    md: 'w-full aspect-[2/3] max-h-64 p-5 rounded-2xl',
    lg: 'w-48 sm:w-64 aspect-[2/3] p-6 rounded-2xl',
  }[size];

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-b ${theme.bg} shadow-lg shadow-black/20 flex flex-col justify-between select-none transition-transform group-hover:scale-[1.02] duration-300 ${sizeClasses} ${className}`}
      style={{ backgroundImage: theme.pattern }}
    >
      {/* 3D Realistic Spine Shadow Effect */}
      <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/40 via-white/10 to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 left-3 w-px bg-white/10 pointer-events-none" />

      {/* Top: Imprint header */}
      <div className="relative z-10 flex items-center justify-between">
        <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-white/50 font-mono">
          BookLeaf
        </span>
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
      </div>

      {/* Center: Title & Artwork element */}
      <div className="relative z-10 my-auto text-center space-y-2 px-1">
        <h4 className="font-serif font-black text-sm sm:text-lg leading-tight text-white drop-shadow-md line-clamp-3">
          {title}
        </h4>
        <div className="w-8 h-0.5 bg-white/30 mx-auto rounded-full" />
      </div>

      {/* Bottom: Genre badge */}
      <div className="relative z-10 flex justify-center">
        <span
          className={`text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-md border backdrop-blur-xs truncate max-w-full ${theme.accent}`}
        >
          {genre}
        </span>
      </div>
    </div>
  );
};
