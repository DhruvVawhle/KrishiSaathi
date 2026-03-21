import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'


const __dirname = path.dirname(
  fileURLToPath(import.meta.url)
)

// Grade multipliers
// How much above mandi is acceptable per grade
const GRADE_MULTIPLIERS = {
  local:          { min: 0.80, max: 1.10 },
  b_grade:        { min: 0.90, max: 1.15 },
  a_grade:        { min: 1.00, max: 1.30 },
  farm_fresh:     { min: 1.05, max: 1.35 },
  premium:        { min: 1.20, max: 1.60 },
  organic:        { min: 1.40, max: 2.00 },
  export_quality: { min: 1.50, max: 2.50 }
}

// Grade display labels
export const GRADE_LABELS = {
  local:          'Local Grade',
  b_grade:        'B Grade',
  a_grade:        'A Grade',
  farm_fresh:     'Farm Fresh',
  premium:        'Premium',
  organic:        'Organic',
  export_quality: 'Export Quality'
}

// Get current mandi rate from CSV (Manual parser to avoid dependencies)
export const getMandiRate = async (commodity) => {
  try {
    const csvPath = path.join(
      __dirname,
      '../data/IMC_topcrops_trend.csv'
    )

    if (!fs.existsSync(csvPath)) return null

    const content = fs.readFileSync(csvPath, 'utf8')
    const lines = content.split('\n').filter(l => l.trim())
    
    // Skip header
    const rows = lines.slice(1)
    const rates = []

    for (const row of rows) {
      const cols = row.split(',')
      const rowComm = cols[0]
      const rowDate = cols[1]
      const rowPrice = parseFloat(cols[3])

      if (rowComm && rowComm.toLowerCase().includes(commodity.toLowerCase())) {
        if (!isNaN(rowPrice)) {
          rates.push({
            date: rowDate,
            price_kg: rowPrice / 100
          })
        }
      }
    }

    if (rates.length > 0) {
      // Get latest rate by date string comparison
      rates.sort((a, b) => b.date.localeCompare(a.date))
      return rates[0].price_kg
    }

    return null
  } catch (err) {
    console.error('Mandi rate read error:', err)
    return null
  }
}


// Categorize price vs mandi rate
export const categorizePriceVsMandi = (
  productPrice,
  mandiRate,
  grade = 'local'
) => {
  if (!mandiRate || mandiRate <= 0) {
    return {
      category: 'unknown',
      diffPercent: 0,
      diffAmount: 0,
      isGoodDeal: false,
      badge: 'fair_price',
      label: 'Market Price',
      color: '#7A7A7A',
      message: 'Mandi rate unavailable'
    }
  }

  const diffPercent = Math.round(
    ((productPrice - mandiRate) / mandiRate)
    * 100
  )
  const diffAmount = Math.round(
    (productPrice - mandiRate) * 100
  ) / 100

  const multiplier =
    GRADE_MULTIPLIERS[grade]
    || GRADE_MULTIPLIERS.local

  // Is price fair for this grade?
  const expectedMin =
    mandiRate * multiplier.min
  const expectedMax =
    mandiRate * multiplier.max

  const isFairForGrade =
    productPrice >= expectedMin &&
    productPrice <= expectedMax

  const isTooLow =
    productPrice < mandiRate * 0.7

  const isTooHigh =
    productPrice > mandiRate * multiplier.max

  // Determine category
  let category, badge, label, color, message

  if (diffPercent <= -15) {
    category = 'below_mandi'
    badge = 'best_deal'
    label = 'Best Deal'
    color = '#4CAF50'
    message = `₹${Math.abs(diffAmount)}/kg below mandi rate — great deal!`
  } else if (diffPercent <= 5) {
    category = 'at_mandi'
    badge = 'fair_price'
    label = 'Fair Price'
    color = '#2D4F1E'
    message = `Priced at mandi rate — competitive`
  } else if (diffPercent <= 30) {
    category = 'above_mandi'
    badge = 'fair_price'
    label = 'Slightly Above'
    color = '#E27D60'
    message = `₹${diffAmount}/kg above mandi rate`
  } else {
    category = 'premium'
    badge = 'premium'
    label = 'Premium'
    color = '#C96848'
    message = `Premium pricing — ${diffPercent}% above mandi`
  }

  return {
    category,
    badge,
    label,
    color,
    diffPercent,
    diffAmount,
    mandiRate,
    isGoodDeal: diffPercent <= 5,
    isFairForGrade,
    isTooLow,
    isTooHigh,
    message,
    expectedRange: {
      min: Math.round(expectedMin * 100) / 100,
      max: Math.round(expectedMax * 100) / 100,
      grade: GRADE_LABELS[grade]
    }
  }
}

// Calculate farmer trust score
export const calcFarmerScore = (farmer) => {
  const rating = farmer?.rating || 0
  const orders = farmer?.totalOrders || 0
  const verified = farmer?.isVerified ? 20 : 0

  // Rating contributes 40 points max
  const ratingScore = (rating / 5) * 40

  // Order history contributes 30 points
  const orderScore = Math.min(orders / 10, 1) * 30

  // Verification contributes 20 points
  const verificationScore = verified

  // Response rate contributes 10 points
  const responseScore = (farmer?.responseRate || 0) * 10

  return Math.round(
    ratingScore +
    orderScore +
    verificationScore +
    responseScore
  )
}

// Calculate final product rank score
// Higher score = shown first in results
export const calcRankScore = (
  product, priceAnalysis, farmerScore
) => {
  let score = 0

  // Price competitiveness (40 points)
  if (priceAnalysis.category === 'below_mandi') score += 40
  else if (priceAnalysis.category === 'at_mandi') score += 30
  else if (priceAnalysis.category === 'above_mandi') score += 15
  else score += 5

  // Farmer trust (30 points)
  score += Math.min(farmerScore * 0.3, 30)

  // Grade quality (20 points)
  const gradeScores = {
    export_quality: 20,
    organic:        18,
    premium:        15,
    a_grade:        12,
    farm_fresh:     10,
    b_grade:        7,
    local:          5
  }
  score += gradeScores[product.grade] || 5

  // Recency (10 points)
  const daysSinceListed = Math.floor(
    (Date.now() - new Date(product.createdAt).getTime()) / 86400000
  )
  if (daysSinceListed < 1) score += 10
  else if (daysSinceListed < 3) score += 7
  else if (daysSinceListed < 7) score += 4
  else score += 1

  return Math.round(score)
}

// Assign badges to product
export const assignBadges = (
  product,
  priceAnalysis,
  farmerScore
) => {
  const badges = []

  // Price badges
  if (priceAnalysis.category === 'below_mandi') {
    badges.push('best_deal')
  }
  if (priceAnalysis.isFairForGrade) {
    badges.push('fair_price')
  }
  if (priceAnalysis.category === 'premium' ||
      product.grade === 'premium' ||
      product.grade === 'organic' ||
      product.grade === 'export_quality') {
    badges.push('premium')
  }

  // Grade badges
  if (product.grade === 'organic') {
    badges.push('organic')
  }

  // Farmer badges
  if (farmerScore >= 80) {
    badges.push('top_seller')
  }
  if (product?.farmer?.isVerified) {
    badges.push('verified_farmer')
  }

  // Freshness badge
  const hoursSinceListed = Math.floor(
    (Date.now() - new Date(product.createdAt).getTime()) / 3600000
  )
  if (hoursSinceListed < 24) {
    badges.push('fresh_today')
  }

  return [...new Set(badges)]
}

// Full product analysis
export const analyzeProduct = async (
  product, farmerData = {}
) => {
  const commodity = product.name
    || product.category
    || 'Tomato'

  // Get mandi rate
  const mandiRate = await getMandiRate(commodity)

  // Price analysis
  const priceAnalysis = categorizePriceVsMandi(
    product.price,
    mandiRate,
    product.grade || 'local'
  )

  // Farmer score
  const farmerScore = calcFarmerScore(farmerData)

  // Rank score
  const rankScore = calcRankScore(
    product, priceAnalysis, farmerScore
  )

  // Badges
  const badges = assignBadges(
    product, priceAnalysis, farmerScore
  )

  return {
    priceAnalysis,
    farmerScore,
    rankScore,
    badges,
    mandiRate,
    recommendation: getPricingAdvice(
      product.price,
      mandiRate,
      product.grade || 'local'
    )
  }
}

// Give farmer pricing advice
export const getPricingAdvice = (
  price, mandiRate, grade
) => {
  if (!mandiRate) {
    return {
      advice: 'Set a competitive price',
      status: 'unknown'
    }
  }

  const multiplier =
    GRADE_MULTIPLIERS[grade]
    || GRADE_MULTIPLIERS.local

  const idealMin = mandiRate * multiplier.min
  const idealMax = mandiRate * multiplier.max
  const ideal = (idealMin + idealMax) / 2

  if (price < idealMin) {
    return {
      advice: `⬆️ Your price is too low for ${GRADE_LABELS[grade] || grade}. Consider ₹${Math.round(ideal)}/kg for better profit.`,
      status: 'too_low',
      suggestedPrice: Math.round(ideal),
      color: '#FF5252'
    }
  } else if (price > idealMax) {
    return {
      advice: `⬇️ Your price may be too high. Buyers prefer ₹${Math.round(idealMax)}/kg for ${GRADE_LABELS[grade] || grade}.`,
      status: 'too_high',
      suggestedPrice: Math.round(idealMax),
      color: '#E27D60'
    }
  } else {
    return {
      advice: `✅ Great price for ${GRADE_LABELS[grade] || grade}! You are in the competitive range.`,
      status: 'optimal',
      suggestedPrice: Math.round(price),
      color: '#4CAF50'
    }
  }
}

export default {
  getMandiRate,
  categorizePriceVsMandi,
  calcFarmerScore,
  calcRankScore,
  assignBadges,
  analyzeProduct,
  getPricingAdvice,
  GRADE_LABELS,
  GRADE_MULTIPLIERS
}
