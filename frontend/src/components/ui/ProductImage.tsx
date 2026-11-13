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
  /** Sizes attribute for responsive images */
  sizes?: string;
}

/**
 * Build a Pexels srcset by swapping the w= query param.
 * For non-Pexels URLs, returns undefined (browser picks the single src).
 */
function buildSrcSet(src: string): string | undefined {
  if (!src.includes('pexels.com')) return undefined;
  const base = src.replace(/([?&])w=\d+/, '');
  const sep = base.includes('?') ? '&' : '?';
  return [
    `${base}${sep}w=200 200w`,
    `${base}${sep}w=400 400w`,
    `${base}${sep}w=800 800w`,
    `${base}${sep}w=1200 1200w`,
  ].join(', ');
}

export function ProductImage({ src, alt, className, priority, sizes }: Props) {
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

  const srcSet = buildSrcSet(src);

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes ?? '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'}
      alt={alt}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      // @ts-expect-error fetchpriority is valid HTML5 but not yet in React types
      fetchpriority={priority ? 'high' : 'auto'}
      onError={() => setFailed(true)}
    />
  );
}
