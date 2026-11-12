import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface Slide {
  badge: string;
  badgeIcon: React.ReactNode;
  title: string;
  subtitle: string;
  discount: string;
  category: string;
  bgGradient: string;
  image: string;
}

const SLIDES: Slide[] = [
  {
    badge: 'CURATED ELECTRONICS',
    badgeIcon: <Zap className="w-3.5 h-3.5 text-yellow-400" />,
    title: 'Flagship Performance. Honest Pricing.',
    subtitle: 'Explore authentic flagship smartphones, noise-cancelling acoustics, and wearable tech with manufacturer warranty.',
    discount: 'Up to 35% OFF',
    category: 'electronics',
    bgGradient: 'from-navy-800 via-navy-900 to-navy-950',
    image: '/products/samsung-galaxy-s24-ultra/image-0-640.webp',
  },
  {
    badge: 'AUTHENTIC FOOTWEAR',
    badgeIcon: <Sparkles className="w-3.5 h-3.5 text-orange-400" />,
    title: 'Iconic Silhouettes & Street Classics',
    subtitle: 'Step into genuine, verified sneakers and apparel inspected for physical authenticity and build quality.',
    discount: 'Starting at ₹2,499',
    category: 'fashion',
    bgGradient: 'from-navy-800 via-navy-900 to-navy-950',
    image: '/products/nike-air-force-1-low-white-sneakers/image-0-640.webp',
  },
  {
    badge: 'PRECISION CREATOR GEAR',
    badgeIcon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
    title: 'High-Speed Mirrorless Systems',
    subtitle: 'Next-generation optical sensor bodies, stabilization lenses, and creator optics ready for same-day dispatch.',
    discount: 'Flat 15% OFF',
    category: 'electronics',
    bgGradient: 'from-navy-800 via-navy-900 to-navy-950',
    image: '/products/canon-eos-r50-mirrorless-camera/image-0-640.webp',
  },
];

export function HeroBanner() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[current];

  return (
    <div className="relative rounded-3xl overflow-hidden border border-navy-700/80 shadow-2xl bg-navy-800 transition-all mb-8 min-h-[280px] sm:min-h-[320px]">
      {/* Background Gradient & Effects */}
      <div className={`absolute inset-0 bg-gradient-to-r ${slide.bgGradient} transition-all duration-700`} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 px-6 sm:px-10 py-10 sm:py-14 max-w-[55%] md:max-w-lg lg:max-w-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white text-xs font-bold mb-4 shadow-sm">
          {slide.badgeIcon}
          <span>{slide.badge}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black font-display text-white tracking-tight leading-tight">
          {slide.title}
        </h1>

        <p className="mt-3 text-xs sm:text-sm text-gray-200 font-normal leading-relaxed line-clamp-2 hidden sm:block">
          {slide.subtitle}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link
            to={`/shop?category=${slide.category}`}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-orange-500/30 transition-all hover:scale-[1.02]"
          >
            <span>Shop Now ({slide.discount})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm px-4 py-2.5 rounded-xl backdrop-blur-md border border-white/10 transition-colors"
          >
            Browse All
          </Link>
        </div>
      </div>

      {/* Featured Product Image — right side, contained within banner */}
      <div className="absolute right-0 top-0 bottom-0 w-[42%] md:w-[40%] flex items-center justify-center pointer-events-none z-0">
        <div className="relative w-full h-full flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-orange-500/10 blur-3xl animate-pulse rounded-full scale-75" />
          <img
            src={slide.image}
            alt={slide.title}
            className="max-h-[85%] max-w-full object-contain filter drop-shadow-2xl transition-all duration-700 hover:scale-105 relative z-10"
            loading="eager"
            // @ts-expect-error fetchpriority
            fetchpriority="high"
          />
        </div>
      </div>

      {/* Carousel navigation buttons */}
      <div className="absolute right-4 bottom-4 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)}
          className="p-2 rounded-xl bg-black/40 hover:bg-black/60 text-white border border-white/10 backdrop-blur-md transition-colors"
          aria-label="Previous Slide"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setCurrent((prev) => (prev + 1) % SLIDES.length)}
          className="p-2 rounded-xl bg-black/40 hover:bg-black/60 text-white border border-white/10 backdrop-blur-md transition-colors"
          aria-label="Next Slide"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Slide indicators */}
      <div className="absolute left-6 sm:left-10 bottom-3 z-20 flex items-center gap-1">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrent(i)}
            className="p-2 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-orange-400 rounded-full"
            aria-label={`Go to slide ${i + 1}`}
          >
            <span
              className={`h-2 rounded-full transition-all block ${
                i === current ? 'w-6 bg-orange-400' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
