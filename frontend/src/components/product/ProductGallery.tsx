import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, ShieldCheck, ZoomIn } from 'lucide-react';
import { ProductImage } from '../ui/ProductImage';

export interface GalleryImage {
  id?: string;
  url: string;
  alt_text?: string;
  sort_order?: number;
  is_primary?: boolean;
  source_url?: string;
  license?: string;
  attribution?: string;
  verified?: boolean;
}

interface Props {
  images: GalleryImage[];
  productName: string;
  badge?: string | null;
  needsImage?: boolean;
}

export function ProductGallery({ images, productName, badge, needsImage }: Props) {
  const fallbackList: GalleryImage[] = [
    {
      url: '/products/photo-coming-soon.svg',
      alt_text: `${productName} (Photo coming soon)`,
      verified: false,
    },
  ];

  const galleryImages = images && images.length > 0 ? images : fallbackList;
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });

  // Swipe support
  const touchStartX = useRef<number | null>(null);

  const activeImage = galleryImages[selectedIndex] || galleryImages[0];

  // Keyboard navigation for image cycling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (galleryImages.length <= 1) return;

      if (e.key === 'ArrowRight') {
        setSelectedIndex((prev) => (prev + 1) % galleryImages.length);
      } else if (e.key === 'ArrowLeft') {
        setSelectedIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
      } else if (e.key === 'Escape' && isLightboxOpen) {
        setIsLightboxOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [galleryImages.length, isLightboxOpen]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Swipe left -> next image
        setSelectedIndex((prev) => (prev + 1) % galleryImages.length);
      } else {
        // Swipe right -> prev image
        setSelectedIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
      }
    }
    touchStartX.current = null;
  };

  // Hover zoom handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  return (
    <div className="flex flex-col gap-3.5 w-full select-none" tabIndex={0} aria-label="Product Image Gallery">
      {/* Main Image Frame with Zoom */}
      <div
        className="relative aspect-square rounded-3xl overflow-hidden bg-navy-800/90 border border-navy-700 shadow-xl cursor-zoom-in group"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={() => setIsLightboxOpen(true)}
      >
        {/* Standard View */}
        <div
          className={`w-full h-full transition-opacity duration-200 ${
            isZoomed && !activeImage.url.endsWith('.svg') ? 'opacity-0 md:opacity-0' : 'opacity-100'
          }`}
        >
          <ProductImage
            src={activeImage.url}
            alt={activeImage.alt_text || productName}
            priority
            objectFit="contain"
            className="w-full h-full"
          />
        </div>

        {/* Hover Zoom View (Desktop only, photographic non-svg) */}
        {isZoomed && !activeImage.url.endsWith('.svg') && (
          <div
            className="hidden md:block absolute inset-0 pointer-events-none bg-no-repeat bg-navy-900/90"
            style={{
              backgroundImage: `url(${activeImage.url})`,
              backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
              backgroundSize: '220%',
            }}
          />
        )}

        {/* Badge & Quick Action Overlays */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
          {badge ? (
            <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
              {badge}
            </span>
          ) : <div />}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsLightboxOpen(true);
            }}
            className="pointer-events-auto p-2.5 rounded-xl bg-navy-900/80 hover:bg-navy-900 text-gray-300 hover:text-white border border-white/10 backdrop-blur-md shadow-md transition-all hover:scale-105"
            title="Open Fullscreen Lightbox"
            aria-label="Open Fullscreen Lightbox"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Verified Status Tag */}
        {activeImage.verified && (
          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-green-950/80 border border-green-500/30 text-[11px] font-semibold text-green-300 backdrop-blur-md pointer-events-none">
            <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
            <span>Verified Exact Photo</span>
          </div>
        )}

        {/* Zoom Hint Icon */}
        <div className="absolute bottom-4 right-4 z-10 hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-navy-900/70 border border-white/10 text-[11px] text-gray-400 backdrop-blur-md pointer-events-none">
          <ZoomIn className="w-3 h-3" />
          <span>Hover to zoom</span>
        </div>

        {/* Navigation Arrows for multi-image */}
        {galleryImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-navy-900/80 hover:bg-navy-900 text-white border border-white/10 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
              aria-label="Previous Image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex((prev) => (prev + 1) % galleryImages.length);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-navy-900/80 hover:bg-navy-900 text-white border border-white/10 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
              aria-label="Next Image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Row */}
      {galleryImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto py-1 px-0.5">
          {galleryImages.map((img, i) => (
            <button
              key={img.id || i}
              type="button"
              onClick={() => setSelectedIndex(i)}
              className={`relative w-18 h-18 rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${
                selectedIndex === i
                  ? 'border-orange-500 scale-105 shadow-md shadow-orange-500/20'
                  : 'border-navy-700/80 hover:border-gray-500 opacity-70 hover:opacity-100'
              }`}
              aria-label={`View image ${i + 1}`}
            >
              <ProductImage
                src={img.url}
                alt={img.alt_text || `${productName} thumbnail ${i + 1}`}
                aspectRatio="aspect-square"
                objectFit="contain"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Top Lightbox Bar */}
          <div className="flex items-center justify-between text-white z-10">
            <div className="flex items-center gap-3">
              <span className="font-bold text-sm text-gray-200">{productName}</span>
              <span className="text-xs bg-navy-800 text-gray-400 px-2.5 py-1 rounded-full border border-navy-700">
                {selectedIndex + 1} / {galleryImages.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Close Lightbox"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Centered Main Image */}
          <div
            className="relative flex-1 flex items-center justify-center max-h-[82vh] my-auto"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={activeImage.url}
              alt={activeImage.alt_text || productName}
              className="max-h-full max-w-full object-contain drop-shadow-2xl select-none"
            />

            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)
                  }
                  className="absolute left-2 sm:left-4 p-3 rounded-2xl bg-black/60 hover:bg-black/90 text-white border border-white/10 backdrop-blur-md transition-all"
                  aria-label="Previous Image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedIndex((prev) => (prev + 1) % galleryImages.length)
                  }
                  className="absolute right-2 sm:right-4 p-3 rounded-2xl bg-black/60 hover:bg-black/90 text-white border border-white/10 backdrop-blur-md transition-all"
                  aria-label="Next Image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Attribution & Thumbnails in Lightbox */}
          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400 z-10 pt-2 border-t border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              {activeImage.license && (
                <span>
                  Photo license: <strong className="text-gray-200">{activeImage.license}</strong> | Source:{' '}
                  <span className="text-gray-300">{activeImage.attribution || 'Verified Reference'}</span>
                </span>
              )}
            </div>
            <span className="text-[11px] text-gray-500">
              Press <kbd className="px-1.5 py-0.5 bg-navy-800 rounded text-gray-300">Esc</kbd> or click outside to exit
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
