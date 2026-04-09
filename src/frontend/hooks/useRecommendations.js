import { useState, useEffect, useCallback } from 'react'
import { allProducts } from "@/data/products";
import { fetchWithCache } from '../utils/fetchUtils';
import { TTL } from '../utils/apiCache';

import { useUser } from '@/frontend/contexts/UserContext';

const useRecommendations = () => {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [type, setType] = useState('popular')
  const [label, setLabel] = useState('Popular This Week 🔥')

  // Get user dynamically from context to update on login/logout
  const { user } = useUser() || { user: null }
  const uid = user?.uid || null

  // Get popular products
  const getPopularProducts = useCallback(() => {
    const categories = ['Vegetables', 'Fruits', 'Dairy', 'Grains']
    const mixed = []
    categories.forEach(cat => {
      const catProducts = allProducts
        .filter(p => p.category === cat)
        .slice(0, 2)
      mixed.push(...catProducts)
    })
    return mixed.slice(0, 8)
  }, []);

  const getBrowsedCategories = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem(`ks_browsed_${uid}`) || '[]')
    } catch { return [] }
  }, [uid]);

  useEffect(() => {
    const controller = new AbortController()

    const fetchRecommendations = async () => {
      setLoading(true)
      try {
        if (!uid || uid === "null") {
          // Guest user — show popular
          setRecommendations(getPopularProducts())
          setLabel('Popular This Week 🔥')
          setType('popular')
          setLoading(false)
          return
        }

        setError(null)
        const res = await fetchWithCache(`/api/recommendations/${uid}`, { 
          signal: controller.signal 
        }, TTL.RECOMMENDATIONS)
        
        const contentType = res.headers.get('content-type')

        if (!res.ok) {
          const text = await res.text()
          throw new Error(`Server error (${res.status}): ${text.substring(0, 50)}`)
        }

        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server returned HTML or invalid content-type')
        }

        const data = await res.json()

        // Guard the data setter
        let finalRecs = []

        if (data.type === 'personalized' && data.categories?.length) {
          // Filter products by user's categories
          const personalized = allProducts
            .filter(p =>
              data.categories.includes(p.category) &&
              !data.excludeIds?.includes(p.id?.toString())
            )
            .slice(0, 8)

          // If not enough personalized, fill with popular
          if (personalized.length < 4) {
            const popular = getPopularProducts()
              .filter(p => !personalized.find(r => r.id === p.id))
              .slice(0, 8 - personalized.length)
            finalRecs = [...personalized, ...popular]
          } else {
            finalRecs = personalized
          }

          setLabel(data.label || 'Picked For You 🌾')
          setType('personalized')

        } else {
          // New user or fallback - use browsing history if available
          const browsed = getBrowsedCategories();
          if (!data.totalOrders && browsed.length) {
            const browsingBased = allProducts
              .filter(p => browsed.includes(p.category))
              .slice(0, 8)
            
            if (browsingBased.length > 0) {
              setRecommendations(browsingBased)
              setLabel('Based on Your Interest 👀')
              setType('browsing')
              setLoading(false)
              return
            }
          }
          
          finalRecs = getPopularProducts()
          setLabel(data.label || 'Popular This Week 🔥')
          setType('popular')
        }

        setRecommendations(Array.isArray(finalRecs) ? finalRecs : (finalRecs?.items ?? []))

      } catch (error) {
        if (error.name === 'AbortError') return
        console.error('Recommendations fetch error:', error)
        setError(error.message)
        // Fallback to local products
        setRecommendations([])
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
    
    return () => {
      controller.abort()
    }
  }, [uid, getPopularProducts, getBrowsedCategories])

  return {
    recommendations,
    loading,
    error,
    type,
    label
  }
}

export default useRecommendations
