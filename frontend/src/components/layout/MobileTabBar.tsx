import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Grid3X3, Search, ShoppingCart, User } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

export function MobileTabBar() {
  const { pathname } = useLocation();
  const { itemCount } = useCart();

  const tabs: { to: string; Icon: React.ElementType; label: string; count?: number }[] = [
    { to: '/',                Icon: Home,         label: 'Home' },
    { to: '/shop',            Icon: Grid3X3,      label: 'Categories' },
    { to: '/shop?search=1',   Icon: Search,       label: 'Search' },
    { to: '/cart',            Icon: ShoppingCart, label: 'Cart', count: itemCount },
    { to: '/account/orders',  Icon: User,         label: 'Account' },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white dark:bg-navy-900 border-t border-surface-border dark:border-white/10 flex safe-area-bottom"
    >
      {tabs.map(({ to, Icon, label, count }) => {
        const active = to === '/'
          ? pathname === '/'
          : pathname.startsWith(to.split('?')[0]);
        return (
          <Link
            key={label}
            to={to}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
              active ? 'text-primary' : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            <div className="relative">
              <Icon
                className="w-5 h-5"
                strokeWidth={active ? 2.5 : 1.75}
              />
              {count && count > 0 ? (
                <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-primary text-white text-[9px] font-bold leading-none px-1">
                  {count > 9 ? '9+' : count}
                </span>
              ) : null}
            </div>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
