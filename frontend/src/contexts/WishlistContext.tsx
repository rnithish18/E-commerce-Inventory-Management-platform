import React, { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';
import { ProductData } from '../components/product/ProductCard';

interface WishlistContextType {
  items: ProductData[];
  wishlistIds: string[];
  isLoading: boolean;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (product: ProductData) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch wishlisted items
  const { data, isLoading } = useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: async () => {
      if (!user) return { items: [] };
      const res = await api.get('/wishlists');
      return res.data;
    },
    enabled: !!user,
    staleTime: 60000,
  });

  const items: ProductData[] = data?.items || [];
  const wishlistIds = items.map((i) => i.id);

  // Add Mutation
  const addMutation = useMutation({
    mutationFn: async (productId: string) => {
      await api.post(`/wishlists/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', user?.id] });
      toast.success('Added to Wishlist');
    },
    onError: () => {
      toast.error('Failed to add to wishlist');
    },
  });

  // Remove Mutation
  const removeMutation = useMutation({
    mutationFn: async (productId: string) => {
      await api.delete(`/wishlists/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', user?.id] });
      toast.success('Removed from Wishlist');
    },
    onError: () => {
      toast.error('Failed to remove from wishlist');
    },
  });

  const isWishlisted = (productId: string) => {
    return wishlistIds.includes(productId);
  };

  const toggleWishlist = async (product: ProductData) => {
    if (!user) {
      toast.error('Please sign in to save items to your wishlist');
      return;
    }

    if (isWishlisted(product.id)) {
      await removeMutation.mutateAsync(product.id);
    } else {
      await addMutation.mutateAsync(product.id);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!user) return;
    await removeMutation.mutateAsync(productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        wishlistIds,
        isLoading,
        isWishlisted,
        toggleWishlist,
        removeFromWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return ctx;
}
