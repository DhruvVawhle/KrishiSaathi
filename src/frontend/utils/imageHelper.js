export const getOptimizedImage = (
  url,
  width = 400,
  quality = 80,
  format = 'webp'
) => {
  if (!url || typeof url !== 'string') {
    return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=70&auto=format'
  }

  // Unsplash optimization
  if (url.includes('unsplash.com')) {
    const base = url.split('?')[0]
    return `${base}?w=${width}&q=${quality}&auto=format&fit=crop&fm=${format}`
  }

  // Already optimized
  return url
}

// Preset sizes
export const imagePresets = {
  thumbnail: (url) => getOptimizedImage(url, 100, 60),
  card: (url) => getOptimizedImage(url, 400, 75),
  hero: (url) => getOptimizedImage(url, 1200, 85),
  avatar: (url) => getOptimizedImage(url, 80, 70),
  banner: (url) => getOptimizedImage(url, 800, 80),
}
