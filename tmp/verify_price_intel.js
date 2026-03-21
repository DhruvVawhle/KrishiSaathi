import {
  getMandiRate,
  categorizePriceVsMandi,
  calcFarmerScore,
  calcRankScore,
  assignBadges
} from '../src/backend/services/priceIntelligence.js'

async function runTests() {
  console.log('--- Price Intelligence Verification ---')

  // 1. Test Mandi Rate Lookup
  console.log('\n1. Testing Mandi Rate Lookup...')
  const tomatoRate = await getMandiRate('Tomato')
  console.log('Tomato Mandi Rate (KG):', tomatoRate)
  
  if (tomatoRate) {
    // 2. Test Categorization
    console.log('\n2. Testing Categorization...')
    const analysis = categorizePriceVsMandi(tomatoRate * 0.8, tomatoRate, 'a_grade')
    console.log('Price Analysis (20% below mandi):', JSON.stringify(analysis, null, 2))

    // 3. Test Farmer Score
    console.log('\n3. Testing Farmer Score...')
    const farmerScore = calcFarmerScore({
      rating: 4.5,
      totalOrders: 50,
      isVerified: true,
      responseRate: 0.9
    })
    console.log('Farmer Score (Top Tier):', farmerScore)

    // 4. Test Rank Score
    console.log('\n4. Testing Rank Score...')
    const rank = calcRankScore(
      { grade: 'organic', createdAt: new Date() },
      analysis,
      farmerScore
    )
    console.log('Product Rank Score:', rank)

    // 5. Test Badges
    console.log('\n5. Testing Badges...')
    const badges = assignBadges(
      { grade: 'organic', createdAt: new Date(), farmer: { isVerified: true } },
      analysis,
      farmerScore
    )
    console.log('Assigned Badges:', badges)
  } else {
    console.log('❌ Could not fetch Mandi Rate. Ensure CSV exists.')
  }
}

runTests().catch(console.error)
