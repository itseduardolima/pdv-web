import { useState } from 'react'
import { useProductCategories } from '@/hooks/queries/use-product-categories'
import { useProducts } from '@/hooks/queries/use-products'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useSession } from '@/hooks/use-session'
import { apiErrorMessage } from '@/lib/utils/api-error-message'

export function useProductsPage() {
  const { operator } = useSession()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const debouncedSearch = useDebouncedValue(search.trim())
  const categories = useProductCategories()
  const products = useProducts({
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(category ? { category } : {}),
  })

  return {
    search,
    setSearch,
    category,
    setCategory,
    categories: categories.data ?? [],
    products: products.data ?? [],
    isLoading: products.isPending,
    errorMessage: apiErrorMessage(products.error),
    canManage: operator.role === 'ADMIN',
    hasFilter: debouncedSearch !== '' || category !== null,
  }
}
