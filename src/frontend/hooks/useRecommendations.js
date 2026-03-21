import { useState, useEffect } from 'react'
import { allProducts } from "@/data/products";

const useRecommendations = () => {
  const [recommendations, setRecommendations] = useState([])
  const [label, setLabel] = useState('Popular This Week 🔥')
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState('popular')

  // Get user
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('ks_user')) || null
    } catch { return null }
  })()

  const uid = user?.uid || null

  // Get browsing history fallback
  const browsedCategories = (() => {
    try {
      return JSON.parse(localStorage.getItem(`ks_browsed_${uid}`) || '[]')
    } catch { return [] }
  })()

  useEffect(() => {
    fetchRecommendations()
  }, [uid])

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

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)

      const res = await fetch(`/api/recommendations/${uid}`, { signal: controller.signal })
      clearTimeout(timeout)
      
      // Handle non-JSON response
      const contentType = res.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        throw new Error('Server returned HTML')
      }

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`)
      }

      const data = await res.json()

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
          setRecommendations([...personalized, ...popular])
        } else {
          setRecommendations(personalized)
        }

        setLabel(data.label || 'Picked For You 🌾')
        setType('personalized')

      } else {
        // New user or fallback - use browsing history if available
        if (!data.totalOrders && browsedCategories.length) {
          const browsingBased = allProducts
            .filter(p => browsedCategories.includes(p.category))
            .slice(0, 8)
          
          if (browsingBased.length > 0) {
            setRecommendations(browsingBased)
            setLabel('Based on Your Interest 👀')
            setType('browsing')
            setLoading(false)
            return
          }
        }
        
        setRecommendations(getPopularProducts())
        setLabel(data.label || 'Popular This Week 🔥')
        setType('popular')
      }

    } catch (error) {
      console.error('Recommendations fetch error:', error)
      console.warn('Recommendations unavailable:', error.message)
      // Server down or any error
      // Silently fallback to local products
      setRecommendations(getPopularProducts())
      setLabel('Popular This Week 🔥')
      setType('popular')
    } finally {
      setLoading(false)
    }
  }

  // Get popular products
  // Since we don't have soldCount yet, use price as proxy (mix categories)
  const getPopularProducts = () => {
    const categories = ['Vegetables', 'Fruits', 'Dairy', 'Grains']
    const mixed = []
    categories.forEach(cat => {
      const catProducts = allProducts
        .filter(p => p.category === cat)
        .slice(0, 2)
      mixed.push(...catProducts)
    })
    return mixed.slice(0, 8)
  }

  return {
    recommendations,
    label,
    loading,
    type,
    refresh: fetchRecommendations
  }
}

export default useRecommendations
