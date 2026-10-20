import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft } from 'lucide-react';

interface Props {
  title: string;
  subtitle: string;
  phase: string;
}

export function CustomerPlaceholder({ title, subtitle, phase }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-3xl bg-navy-800 border border-navy-700 flex items-center justify-center text-orange-400 mb-4 shadow-xl">
        <ShoppingBag className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-black text-white mb-2">{title}</h1>
      <p className="text-xs text-gray-400 max-w-md mb-3">{subtitle}</p>
      <span className="text-[10px] font-mono bg-orange-500/10 text-orange-400 border border-orange-500/30 px-3 py-1 rounded-full uppercase mb-6">
        Full Workflow Active in {phase}
      </span>
      <Link to="/shop" className="btn-primary text-xs flex items-center gap-2">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Catalog</span>
      </Link>
    </div>
  );
}
