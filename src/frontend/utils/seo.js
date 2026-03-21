const BASE_URL = 'https://krishisaathi.vercel.app'
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.jpg`
const DEFAULT_DESCRIPTION = 'Buy fresh vegetables, fruits, grains directly from verified Indian farmers. Live mandi rates, AI price prediction. Free delivery above ₹499.'

const PAGE_SEO = {
  '/': {
    title: 'KrishiSaathi — Fresh Farm Produce Directly from Indian Farmers',
    description: DEFAULT_DESCRIPTION,
    keywords: 'fresh vegetables online India, buy from farmers, farm fresh delivery'
  },
  '/marketplace': {
    title: 'Fresh Farm Produce Marketplace — Vegetables, Fruits, Grains',
    description: 'Browse 65+ fresh farm products at best mandi rates. Tomatoes ₹12/kg, Onions ₹13/kg. Direct from verified Maharashtra farmers.',
    keywords: 'buy vegetables online, fresh fruits marketplace, farm produce India'
  },
  '/about': {
    title: 'About KrishiSaathi — Connecting Farmers to Buyers Directly',
    description: 'KrishiSaathi eliminates middlemen connecting 500+ verified farmers directly to buyers across Maharashtra for fresh, affordable produce.',
    keywords: 'about krishisaathi, farm to table India, farmer marketplace'
  },
  '/contact': {
    title: 'Contact KrishiSaathi — Get Help & Support',
    description: 'Contact KrishiSaathi for help with orders, farmer registration, or any queries. We respond within 24 hours.',
    keywords: 'contact krishisaathi, customer support, farmer helpline'
  },
  '/support': {
    title: 'Support & FAQ — KrishiSaathi Help Center',
    description: 'Find answers to common questions about ordering, delivery, payments and farmer registration on KrishiSaathi.',
    keywords: 'krishisaathi FAQ, help center, delivery questions, return policy'
  },
  '/login': {
    title: 'Login to KrishiSaathi — Farmer & Buyer Portal',
    description: 'Login to your KrishiSaathi account. Farmers manage listings and check mandi rates. Buyers track orders and discover fresh produce.',
    keywords: 'krishisaathi login, farmer login, buyer login'
  },
  '/register': {
    title: 'Register on KrishiSaathi — Join as Farmer or Buyer',
    description: 'Join KrishiSaathi as a farmer to sell directly to buyers, or register as a buyer for fresh farm produce at best prices.',
    keywords: 'krishisaathi register, join as farmer, become a buyer'
  },
  '/dashboard/farmer': {
    title: 'Farmer Dashboard — Manage Products & Mandi Rates',
    description: 'Manage your farm produce listings, check live mandi rates, get AI price predictions and track your sales.',
    keywords: 'farmer dashboard, mandi rates today, sell produce online, farm analytics'
  },
  '/dashboard/buyer': {
    title: 'Buyer Dashboard — Track Orders & Discover Products',
    description: 'Track your orders, discover new farm produce, manage your profile and view personalized product recommendations.',
    keywords: 'buyer dashboard, track order, fresh produce recommendations'
  }
}

export const updateSEO = (pathname) => {
  const page = PAGE_SEO[pathname] || PAGE_SEO['/']

  // Update title
  document.title = page.title

  // Update meta tags helper
  const setMeta = (selector, attr, content) => {
    const el = document.querySelector(selector)
    if (el) el.setAttribute(attr, content)
  }

  // Description
  setMeta('meta[name="description"]', 'content', page.description)

  // Keywords
  setMeta('meta[name="keywords"]', 'content', page.keywords || '')

  // Canonical
  setMeta('link[rel="canonical"]', 'href', `${BASE_URL}${pathname}`)

  // Open Graph
  setMeta('meta[property="og:title"]', 'content', page.title)
  setMeta('meta[property="og:description"]', 'content', page.description)
  setMeta('meta[property="og:url"]', 'content', `${BASE_URL}${pathname}`)

  // Twitter
  setMeta('meta[name="twitter:title"]', 'content', page.title)
  setMeta('meta[name="twitter:description"]', 'content', page.description)
}

// Custom SEO for dynamic pages
export const setCustomSEO = ({ title, description, image, url, keywords }) => {
  if (title) {
    document.title = title.includes('KrishiSaathi') ? title : `${title} | KrishiSaathi`
  }

  const setMeta = (sel, attr, val) => {
    const el = document.querySelector(sel)
    if (el && val) el.setAttribute(attr, val)
  }

  setMeta('meta[name="description"]', 'content', description)
  setMeta('meta[name="keywords"]', 'content', keywords)
  setMeta('meta[property="og:title"]', 'content', title)
  setMeta('meta[property="og:description"]', 'content', description)
  setMeta('meta[property="og:image"]', 'content', image || DEFAULT_OG_IMAGE)
  setMeta('meta[property="og:url"]', 'content', url ? `${BASE_URL}${url}` : BASE_URL)
}
