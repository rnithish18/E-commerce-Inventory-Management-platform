import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  cta: string;
  to: string;
  discount: string;
  bgColor: string;
  image: string;
}

const SLIDES: Slide[] = [
  {
    id: 1,
    title: 'Electronics Sale',
    subtitle: 'Up to 30% off on smartphones, earphones, laptops and accessories.',
    cta: 'Shop Electronics',
    to: '/shop?category=electronics',
    discount: 'Up to 30% off',
    bgColor: '#1e3a8a',
    image: '/uploads/products/banner-electronics.jpg',
  },
  {
    id: 2,
    title: 'Fashion & Style',
    subtitle: 'New season styles for men, women and kids. Flat prices, no surprises.',
    cta: 'Shop Fashion',
    to: '/shop?category=fashion',
    discount: 'New arrivals',
    bgColor: '#7f1d1d',
    image: '/uploads/products/banner-fashion.jpg',
  },
  {
    id: 3,
    title: 'Home & Living',
    subtitle: 'Kitchen, décor, storage and lifestyle essentials. Starting ₹199.',
    cta: 'Shop Home',
    to: '/shop?category=home-living',
    discount: 'Starting ₹199',
    bgColor: '#064e3b',
    image: '/uploads/products/banner-home.jpg',
  },
];

export function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const total = SLIDES.length;

  // Auto-advance every 5 s
  useEffect(() => {
    const t = setTimeout(() => setCurrent(c => (c + 1) % total), 5000);
    return () => clearTimeout(t);
  }, [current, total]);

  const slide = SLIDES[current];

  return (
    <div
      className="relative w-full h-44 sm:h-52 md:h-60 lg:h-72 rounded-card overflow-hidden select-none"
      style={{ backgroundColor: slide.bgColor }}
      role="banner"
    >
      {/* Product image — RIGHT column only, never overlaps text */}
      <div
        className="absolute right-0 top-0 bottom-0 w-[42%] pointer-events-none"
        aria-hidden="true"
      >
        <img
          src={slide.image}
          alt=""
          className="w-full h-full object-contain object-right p-4 sm:p-6"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          loading="eager"
        />
      </div>

      {/* Text content — LEFT 55%, guaranteed no overlap */}
      <div className="relative z-10 h-full flex flex-col justify-center px-5 sm:px-8 md:px-10 max-w-[57%]">
        <span className="inline-block self-start bg-white/20 text-white text-[11px] font-semibold px-2.5 py-1 rounded-chip mb-3">
          {slide.discount}
        </span>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight mb-2">
          {slide.title}
        </h2>
        <p className="text-xs sm:text-sm text-white/80 mb-4 line-clamp-2 leading-relaxed">
          {slide.subtitle}
        </p>
        <Link
          to={slide.to}
          className="self-start inline-flex items-center gap-2 bg-white text-neutral-900 font-semibold text-xs sm:text-sm px-4 py-2 rounded-btn hover:bg-neutral-100 transition-colors"
        >
          {slide.cta}
        </Link>
      </div>

      {/* Navigation dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? 'w-5 bg-white' : 'w-1.5 bg-white/40'
            }`}
          />
        ))}
      </div>

      {/* Prev/Next arrows */}
      <button
        onClick={() => setCurrent(c => (c - 1 + total) % total)}
        aria-label="Previous slide"
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center transition"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        onClick={() => setCurrent(c => (c + 1) % total)}
        aria-label="Next slide"
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center transition"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
