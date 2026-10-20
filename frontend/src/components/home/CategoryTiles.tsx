import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Laptop, 
  Shirt, 
  Armchair, 
  Sparkle, 
  Trophy, 
  BookOpen, 
  Gamepad2, 
  ArrowRight 
} from 'lucide-react';

interface CategoryTile {
  name: string;
  slug: string;
  count: string;
  icon: React.ReactNode;
  color: string;
}

const CATEGORY_TILES: CategoryTile[] = [
  { name: 'Electronics', slug: 'electronics', count: '10+ Items', icon: <Laptop className="w-5 h-5" />, color: 'from-blue-500/20 to-blue-600/10 text-blue-400 border-blue-500/30' },
  { name: 'Fashion', slug: 'fashion', count: '8+ Items', icon: <Shirt className="w-5 h-5" />, color: 'from-pink-500/20 to-pink-600/10 text-pink-400 border-pink-500/30' },
  { name: 'Home & Living', slug: 'home-living', count: '6+ Items', icon: <Armchair className="w-5 h-5" />, color: 'from-emerald-500/20 to-emerald-600/10 text-emerald-400 border-emerald-500/30' },
  { name: 'Beauty & Care', slug: 'beauty-personal-care', count: '5+ Items', icon: <Sparkle className="w-5 h-5" />, color: 'from-purple-500/20 to-purple-600/10 text-purple-400 border-purple-500/30' },
  { name: 'Sports', slug: 'sports-outdoors', count: '5+ Items', icon: <Trophy className="w-5 h-5" />, color: 'from-amber-500/20 to-amber-600/10 text-amber-400 border-amber-500/30' },
  { name: 'Books', slug: 'books-stationery', count: '4+ Items', icon: <BookOpen className="w-5 h-5" />, color: 'from-indigo-500/20 to-indigo-600/10 text-indigo-400 border-indigo-500/30' },
  { name: 'Toys & Games', slug: 'toys-games', count: '4+ Items', icon: <Gamepad2 className="w-5 h-5" />, color: 'from-red-500/20 to-red-600/10 text-red-400 border-red-500/30' },
];

export function CategoryTiles() {
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Popular Categories
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Browse verified quality items across our multi-department store
          </p>
        </div>
        <Link
          to="/shop"
          className="text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1 group"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {CATEGORY_TILES.map((cat) => (
          <Link
            key={cat.slug}
            to={`/shop?category=${cat.slug}`}
            className="group flex flex-col items-center text-center p-3.5 rounded-2xl bg-navy-800/80 hover:bg-navy-700/80 border border-navy-700 hover:border-orange-500/40 transition-all duration-200 hover:-translate-y-0.5 shadow-md"
          >
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cat.color} border flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform duration-200`}>
              {cat.icon}
            </div>
            <p className="text-xs font-bold text-gray-200 group-hover:text-white line-clamp-1">
              {cat.name}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {cat.count}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
