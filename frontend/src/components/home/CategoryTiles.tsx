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
  ArrowRight,
  Package
} from 'lucide-react';
import { useCategories } from '../../hooks/useProducts';

interface CategoryMeta {
  icon: React.ReactNode;
  color: string;
}

const CATEGORY_META: Record<string, CategoryMeta> = {
  'electronics': { icon: <Laptop className="w-5 h-5" />, color: 'from-blue-500/20 to-blue-600/10 text-blue-400 border-blue-500/30' },
  'fashion': { icon: <Shirt className="w-5 h-5" />, color: 'from-pink-500/20 to-pink-600/10 text-pink-400 border-pink-500/30' },
  'home-living': { icon: <Armchair className="w-5 h-5" />, color: 'from-emerald-500/20 to-emerald-600/10 text-emerald-400 border-emerald-500/30' },
  'beauty-personal-care': { icon: <Sparkle className="w-5 h-5" />, color: 'from-purple-500/20 to-purple-600/10 text-purple-400 border-purple-500/30' },
  'sports-outdoors': { icon: <Trophy className="w-5 h-5" />, color: 'from-amber-500/20 to-amber-600/10 text-amber-400 border-amber-500/30' },
  'books-stationery': { icon: <BookOpen className="w-5 h-5" />, color: 'from-indigo-500/20 to-indigo-600/10 text-indigo-400 border-indigo-500/30' },
  'toys-games': { icon: <Gamepad2 className="w-5 h-5" />, color: 'from-red-500/20 to-red-600/10 text-red-400 border-red-500/30' },
};

const DEFAULT_CATEGORIES = [
  { name: 'Electronics', slug: 'electronics', product_count: 10 },
  { name: 'Fashion', slug: 'fashion', product_count: 8 },
  { name: 'Home & Living', slug: 'home-living', product_count: 6 },
  { name: 'Beauty & Personal Care', slug: 'beauty-personal-care', product_count: 5 },
  { name: 'Sports & Outdoors', slug: 'sports-outdoors', product_count: 5 },
  { name: 'Books & Stationery', slug: 'books-stationery', product_count: 4 },
  { name: 'Toys & Games', slug: 'toys-games', product_count: 4 },
];

export function CategoryTiles() {
  const { data: categories, isLoading } = useCategories();
  const list = categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;

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
        {list.map((cat: any) => {
          const meta = CATEGORY_META[cat.slug] || {
            icon: <Package className="w-5 h-5" />,
            color: 'from-gray-500/20 to-gray-600/10 text-gray-400 border-gray-500/30',
          };
          const count = Number(cat.product_count || 0);
          const countLabel = `${count} ${count === 1 ? 'Item' : 'Items'}`;

          return (
            <Link
              key={cat.slug}
              to={`/shop?category=${cat.slug}`}
              className="group flex flex-col items-center text-center p-3.5 rounded-2xl bg-navy-800/80 hover:bg-navy-700/80 border border-navy-700 hover:border-orange-500/40 transition-all duration-200 hover:-translate-y-0.5 shadow-md"
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${meta.color} border flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform duration-200`}>
                {meta.icon}
              </div>
              <p className="text-xs font-bold text-gray-200 group-hover:text-white line-clamp-1">
                {cat.name}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                {countLabel}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
