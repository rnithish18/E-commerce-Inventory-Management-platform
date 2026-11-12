import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface Props {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
  /** Legacy prop — ignored, use className to control fit */
  objectFit?: string;
  /** Legacy prop — ignored, use className to control aspect ratio */
  aspectRatio?: string;
}

export function ProductImage({ src, alt, className, priority }: Props) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-neutral-100 dark:bg-navy-700 text-neutral-300 dark:text-neutral-600 ${className ?? 'w-full h-full'}`}
        role="img"
        aria-label={alt}
      >
        <ImageOff className="w-7 h-7 mb-1" />
        <span className="text-[9px] text-center px-2 line-clamp-2 text-neutral-400 leading-tight">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
