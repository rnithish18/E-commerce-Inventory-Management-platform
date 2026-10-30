import React, { useState } from 'react';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  aspectRatio?: string;
  priority?: boolean;
  objectFit?: 'contain' | 'cover';
  sizes?: string;
}

export function ProductImage({
  src,
  alt,
  className = '',
  aspectRatio = 'aspect-square',
  priority = false,
  objectFit = 'contain',
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px',
}: ProductImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const fallbackUrl = '/products/photo-coming-soon.svg';
  const effectiveSrc = hasError || !src ? fallbackUrl : src;

  // Determine if this is one of our multi-size WebP images
  let srcSet: string | undefined = undefined;
  if (!hasError && effectiveSrc.endsWith('-640.webp')) {
    const base = effectiveSrc.replace(/-640\.webp$/, '');
    srcSet = `${base}-320.webp 320w, ${base}-640.webp 640w, ${base}-960.webp 960w, ${base}-1280.webp 1280w`;
  }

  const isSvgFallback = effectiveSrc.endsWith('.svg');

  return (
    <div
      className={`relative w-full ${aspectRatio} overflow-hidden bg-navy-900/60 rounded-xl flex items-center justify-center select-none ${className}`}
    >
      {/* Skeleton Blur-up placeholder while loading */}
      {!loaded && !hasError && (
        <div className="absolute inset-0 bg-navy-800/80 animate-pulse flex items-center justify-center z-0">
          <div className="w-8 h-8 rounded-full border-2 border-orange-500/20 border-t-orange-500 animate-spin" />
        </div>
      )}

      {/* Main Image */}
      <img
        src={effectiveSrc}
        srcSet={srcSet}
        sizes={srcSet ? sizes : undefined}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (!hasError) {
            setHasError(true);
            setLoaded(true);
          }
        }}
        className={`w-full h-full p-2 transition-all duration-300 ${
          isSvgFallback || objectFit === 'contain' ? 'object-contain' : 'object-cover'
        } ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      />
    </div>
  );
}
