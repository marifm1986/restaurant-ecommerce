'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { PRODUCT_CATEGORIES } from '@/config/features';

export function CategoryFilter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const currentCategory = searchParams.get('category') || 'all';

  const handleCategoryChange = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug === 'all') {
      params.delete('category');
    } else {
      params.set('category', slug);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex gap-2 min-w-max">
        <button
          onClick={() => handleCategoryChange('all')}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
            currentCategory === 'all'
              ? 'bg-orange-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          )}
        >
          All Products
        </button>
        {PRODUCT_CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryChange(category.slug)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
              currentCategory === category.slug
                ? 'bg-orange-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            )}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}
