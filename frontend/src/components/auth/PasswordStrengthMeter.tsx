import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  if (!password) return null;

  const checks = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
    { label: 'One number (0-9)', met: /[0-9]/.test(password) },
    { label: 'One special symbol (!@#$...)', met: /[^A-Za-z0-9]/.test(password) },
  ];

  const score = checks.filter((c) => c.met).length;

  const strengthConfig = [
    { label: 'Too Weak', color: 'bg-red-500', textColor: 'text-red-400' },
    { label: 'Weak', color: 'bg-red-400', textColor: 'text-red-400' },
    { label: 'Fair', color: 'bg-amber-400', textColor: 'text-amber-400' },
    { label: 'Good', color: 'bg-teal-400', textColor: 'text-teal-400' },
    { label: 'Strong', color: 'bg-emerald-400', textColor: 'text-emerald-400' },
  ];

  const current = strengthConfig[score];

  return (
    <div className="mt-2 space-y-2 animate-fadeIn">
      {/* Visual bars */}
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="text-gray-400">Password strength:</span>
        <span className={`font-bold ${current.textColor}`}>{current.label}</span>
      </div>

      <div className="grid grid-cols-4 gap-1.5 h-1.5">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`h-full rounded-full transition-all duration-300 ${
              index < score ? current.color : 'bg-navy-700'
            }`}
          />
        ))}
      </div>

      {/* Criteria checks list */}
      <div className="grid grid-cols-2 gap-1 pt-1">
        {checks.map((c, idx) => (
          <div key={idx} className="flex items-center gap-1.5 text-[10px]">
            {c.met ? (
              <Check className="w-3 h-3 text-emerald-400 shrink-0" />
            ) : (
              <X className="w-3 h-3 text-gray-500 shrink-0" />
            )}
            <span className={c.met ? 'text-gray-300 font-medium' : 'text-gray-500'}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
