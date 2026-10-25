import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';

interface RunawayButtonProps {
  isValid: boolean;
  loading: boolean;
  label?: string;
  loadingLabel?: string;
  type?: 'submit' | 'button';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  roleContext?: 'CUSTOMER' | 'ADMIN';
}

const DODGE_HINTS = [
  'Fill in your email first! 📝',
  'Password is required! 🔒',
  "I don't open for empty forms! 😉",
  'Nice try! Please complete the fields ✨',
];

export function RunawayButton({
  isValid,
  loading,
  label = 'Sign In',
  loadingLabel = 'Authenticating...',
  type = 'submit',
  onClick,
  className = '',
  roleContext = 'CUSTOMER',
}: RunawayButtonProps) {
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dodgeCount, setDodgeCount] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if touch screen or prefers-reduced-motion
  const isReducedMotionOrTouch = () => {
    if (typeof window === 'undefined') return false;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = !window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    return reducedMotion || isTouch;
  };

  // Reset offset whenever the form becomes valid
  useEffect(() => {
    if (isValid) {
      setOffset({ x: 0, y: 0 });
      setDodgeCount(0);
      setHint(null);
    }
  }, [isValid]);

  const handlePointerEnter = () => {
    // Escape hatches:
    // 1. If form is valid
    // 2. If button is loading
    // 3. If focused via keyboard
    // 4. If dodgeCount >= 3 (escape hatch so user is never permanently frustrated)
    // 5. If touch screen or prefers-reduced-motion
    if (isValid || loading || isFocused || dodgeCount >= 3 || isReducedMotionOrTouch()) {
      return;
    }

    const nextCount = dodgeCount + 1;
    setDodgeCount(nextCount);

    if (nextCount >= 3) {
      // Escape hatch triggered! Stay in place
      setOffset({ x: 0, y: 0 });
      setHint('Okay, fine! Fill the fields below 😊');
      return;
    }

    // Calculate evasion inside safe bounds (never move upward to cover inputs)
    // Alternate between left and right with a slight downward shift
    const xDirection = nextCount % 2 === 1 ? 1 : -1;
    const xDistance = 65 * xDirection; // moves 65px left or right
    const yDistance = 10; // moves 10px down, never up

    setOffset({ x: xDistance, y: yDistance });
    const randomHint = DODGE_HINTS[(nextCount - 1) % DODGE_HINTS.length];
    setHint(randomHint);
  };

  const handleFocus = () => {
    // Keyboard Tab focus immediately disables evasion and brings button home
    setIsFocused(true);
    setOffset({ x: 0, y: 0 });
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const isDodgeLocked = dodgeCount >= 3;

  return (
    <div ref={containerRef} className="relative w-full flex flex-col items-center pt-2">
      {/* Witty helper hint message */}
      <div
        aria-live="polite"
        className={`h-6 flex items-center justify-center transition-all duration-300 text-xs font-semibold ${
          hint ? 'opacity-100 translate-y-0 text-amber-400' : 'opacity-0 -translate-y-1 pointer-events-none'
        }`}
      >
        {hint && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] shadow-sm animate-pulse">
            <Sparkles className="w-3 h-3 text-amber-400" />
            {hint}
          </span>
        )}
      </div>

      {/* Button with dynamic transform */}
      <button
        ref={buttonRef}
        type={type}
        disabled={loading}
        onPointerEnter={handlePointerEnter}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={onClick}
        aria-disabled={!isValid && !isFocused && !isDodgeLocked}
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
          transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s, box-shadow 0.2s',
        }}
        className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 select-none outline-none focus:ring-2 focus:ring-teal-400/80 focus:ring-offset-2 focus:ring-offset-navy-900 ${
          isValid
            ? roleContext === 'ADMIN'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/30 ring-1 ring-orange-400/50 cursor-pointer animate-pulse-subtle'
              : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30 cursor-pointer'
            : isFocused || isDodgeLocked
            ? 'bg-navy-700 hover:bg-navy-600 text-gray-200 border border-navy-500 cursor-pointer'
            : 'bg-navy-700/80 hover:bg-navy-700 text-gray-400 border border-navy-600/60 cursor-pointer'
        } ${className}`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>{loadingLabel}</span>
          </>
        ) : (
          <>
            <span>{label}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>

      {/* Screen-reader only status */}
      <span className="sr-only">
        {isValid ? 'Form is valid. Press Enter or click to submit.' : 'Form requires email and password to proceed.'}
      </span>
    </div>
  );
}
