import { useQuery } from '@tanstack/react-query'
import { productsApi, ProductListParams } from '../lib/api'

export function useProducts(params?: ProductListParams) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productsApi.list(params).then(r => r.data),
    staleTime: 60_000,
  })
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productsApi.featured().then(r => r.data),
    staleTime: 60_000,
  })
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.detail(slug).then(r => r.data),
    enabled: !!slug,
    staleTime: 60_000,
  })
}
