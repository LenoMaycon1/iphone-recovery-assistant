import type { ReactNode } from 'react';

export type BadgeTone = 'blue' | 'green' | 'amber' | 'red' | 'neutral';

const TONE_CLASSES: Record<BadgeTone, string> = {
  blue: 'bg-electric-500/15 text-electric-300 ring-electric-400/30',
  green: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30',
  amber: 'bg-amber-500/15 text-amber-300 ring-amber-400/30',
  red: 'bg-red-500/15 text-red-300 ring-red-400/30',
  neutral: 'bg-graphite-700/60 text-graphite-200 ring-white/10',
};

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
}

export default function Badge({ tone = 'neutral', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}
