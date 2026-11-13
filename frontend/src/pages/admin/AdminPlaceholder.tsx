import React from 'react';
import { Construction } from 'lucide-react';

interface Props {
  title: string;
  description: string;
}

export function AdminPlaceholder({ title, description }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-3xl bg-[var(--adm-surface)] border border-[var(--adm-border)] flex items-center justify-center text-orange-400 mb-4 shadow-xl">
        <Construction className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-[var(--adm-text-1)] mb-2">{title}</h2>
      <p className="text-xs text-[var(--adm-text-2)] max-w-md">{description}</p>
      <span className="mt-4 text-[10px] font-mono bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3 py-1 rounded-full uppercase">
        Scheduled for Week 2 / Week 3
      </span>
    </div>
  );
}
