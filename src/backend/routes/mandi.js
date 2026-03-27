import express from 'express'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import axios from 'axios'
dotenv.config()

const router = express.Router()
const __dirname = path.dirname(
  fileURLToPath(import.meta.url)
)

// Run Python script helper
const runPython = (args, timeout = 15000) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(
      __dirname,
      '../../Python/mandi_predictor.py'
    )

    // Try python3 first then python
    const pythonCmd =
      process.platform === 'win32'
        ? 'python'
        : 'python3'

    console.log('[runPython] Spawning:', pythonCmd, scriptPath, args)

    const proc = spawn(pythonCmd, [
      scriptPath, ...args
    ])

    let output = ''
    let error = ''

    const timer = setTimeout(() => {
      proc.kill()
      console.error('[runPython] TIMEOUT after', timeout, 'ms')
      reject(new Error('Python timeout'))
    }, timeout)

    proc.stdout.on('data', d => {
      output += d.toString()
    })
    proc.stderr.on('data', d => {
      error += d.toString()
    })
    proc.on('close', code => {
      clearTimeout(timer)
      console.log('[runPython] Process ended with code', code)
      if (error) console.error('[runPython] stderr:', error)
      if (output) console.log('[runPython] stdout:', output.substring(0, 200))
      
      if (code !== 0 && !output) {
        reject(new Error(
          error || 'Python script failed'
        ))
        return
      }
      try {
        resolve(JSON.parse(output.trim()))
      } catch (parseErr) {
        console.error('[runPython] JSON parse error:', parseErr.message)
        reject(new Error(
          'Invalid Python output: ' + output.substring(0, 200)
        ))
      }
    })
  })
}

const formatCommodityForApi = (name) => {
  if (!name) return null

  // Known API commodity name mappings
  const mappings = {
    'tomatoes': 'Tomato',
    'tomato': 'Tomato',
    'onions': 'Onion',
    'onion': 'Onion',
    'potatoes': 'Potato',
    'potato': 'Potato',
    'wheat': 'Wheat',
    'rice': 'Rice',
    'paddy': 'Paddy',
    'gram': 'Gram',
    'arhar': 'Arhar (Tur/Red Gram)',
    'tur': 'Arhar (Tur/Red Gram)',
    'moong': 'Moong (Green Gram)',
    'groundnut': 'Groundnut',
    'mustard': 'Mustard',
    'spinach': 'Spinach',
    'cauliflower': 'Cauliflower',
    'carrot': 'Carrot',
    'brinjal': 'Brinjal',
    'ladyfinger': 'Ladies Finger',
    'okra': 'Ladies Finger',
    'capsicum': 'Capsicum',
    'apple': 'Apple',
    'banana': 'Banana',
    'mango': 'Mango'
  }

  const lower = name.toLowerCase().trim()
  return mappings[lower]
    || name.charAt(0).toUpperCase()
       + name.slice(1).toLowerCase()
}

// Fetch from data.gov.in API
const fetchLiveMandiData = async (
  commodity = null,
  limit = 100
) => {
  const API_KEY =
    '579b464db66ec23bdd000001' +
    'b7d45cb5d72243dd58f4c958c5478779'

  const RESOURCE_ID =
    '5921640d-851d-4de9-9c31-c4d7195a7953'

  try {
    // Format commodity name for API
    const apiCommodity = commodity
      ? formatCommodityForApi(commodity)
      : null

    // Build URL
    let url =
      `https://api.data.gov.in/resource/` +
      `${RESOURCE_ID}` +
      `?api-key=${API_KEY}` +
      `&format=json` +
      `&limit=${limit}` +
      `&offset=0`

    // Add commodity filter
    if (apiCommodity) {
      url += `&filters[commodity]=` +
        encodeURIComponent(apiCommodity)
    }

    console.log(
      `[API] Fetching: ${url
        .replace(API_KEY, 'KEY_HIDDEN')}`
    )

    // Fetch via axios to avoid Node 18 undici TLS issues
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json'
      }
    })

    const data = response.data

    console.log(
      `[API] Response status: ${
        data.status || 'unknown'
      }`
    )
    console.log(
      `[API] Total records: ${
        data.total || 0
      }`
    )
    console.log(
      `[API] Records returned: ${
        (data.records || []).length
      }`
    )

    // Check if records exist
    if (!data.records ||
        data.records.length === 0) {

      // Try without commodity filter
      // as fallback
      if (apiCommodity) {
        console.log(
          `[API] No records for ` +
          `${apiCommodity}, trying ` +
          `without filter...`
        )
        return await fetchLiveMandiData(
          null, 100
        )
      }

      console.warn(
        '[API] No records returned'
      )
      return []
    }

    // Parse records
    const records = data.records.map(r => ({
      commodity: r.commodity
        || r.Commodity || '',
      market: r.market
        || r.Market || '',
      state: r.state
        || r.State || '',
      district: r.district
        || r.District || '',
      min_price: parseFloat(
        r.min_price
        || r.Min_Price
        || r.minimum_price
        || 0
      ),
      max_price: parseFloat(
        r.max_price
        || r.Max_Price
        || r.maximum_price
        || 0
      ),
      modal_price: parseFloat(
        r.modal_price
        || r.Modal_Price
        || r.modal_x0020_price
        || 0
      ),
      arrival_date: r.arrival_date
        || r.Arrival_Date
        || r.date
        || new Date().toISOString()
        .split('T')[0]
    }))

    // Filter valid records only
    const validRecords = records.filter(
      r => r.modal_price > 0
    )

    console.log(
      `[API] ✅ Valid records: ${
        validRecords.length
      }`
    )

    return validRecords

  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn(
        '[API] ⏱️ Request timed out'
      )
    } else {
      console.warn(
        '[API] ❌ Error:',
        err.message
      )
    }
    return []
  }
}

// GET /api/mandi/rates
router.get('/rates', async (req, res) => {
  const {
    commodity = 'Tomato',
    state = 'Maharashtra',
    limit = 20
  } = req.query

  let source = 'csv'
  let rates = []

  // Try live API first
  try {
    rates = await fetchLiveMandiData(commodity, limit)
    // Filter by state locally
    if (state) {
      rates = rates.filter(r => 
        r.state.toLowerCase() === state.toLowerCase()
      )
    }
    source = 'live'
    console.log(
      `✅ Live: ${rates.length} records`
    )
  } catch (apiErr) {
    console.log(
      `⚠️ API failed (${apiErr.message}), trying CSV...`
    )

    // Fallback to CSV via Python
    try {
      const csvData = await runPython([
        'csv', commodity, state
      ])
      rates = Array.isArray(csvData)
        ? csvData : []
      source = 'csv'
      console.log(
        `📄 CSV: ${rates.length} records`
      )
    } catch (csvErr) {
      console.error('CSV also failed:', csvErr)
      return res.status(500).json({
        message: 'Both API and CSV failed',
        error: csvErr.message
      })
    }
  }

  // Calculate summary stats
  const modalPrices = rates.map(
    r => r.modal_price
  ).filter(p => p > 0)

  const summary = modalPrices.length ? {
    avg_modal: parseFloat(
      (modalPrices.reduce(
        (s, p) => s + p, 0
      ) / modalPrices.length).toFixed(2)
    ),
    min: Math.min(...rates.map(
      r => r.min_price
    )),
    max: Math.max(...rates.map(
      r => r.max_price
    )),
    latest_date: rates[rates.length - 1]
      ?.arrival_date || 'N/A'
  } : null

  res.json({
    success: true,
    source,
    commodity,
    state,
    count: rates.length,
    summary,
    rates,
    fetched_at: new Date().toISOString()
  })
})

// GET /api/mandi/predict
router.get('/predict', async (req, res) => {
  const {
    commodity = 'Tomato',
    current_price = '45',
    state = 'Maharashtra'
  } = req.query

  try {
    // Try to get live data to pass to predictor
    let liveDataArg = ""
    try {
      const live = await fetchLiveMandiData(commodity, 10)
      // Filter by state locally
      const filteredLive = live.filter(r => 
        r.state.toLowerCase() === state.toLowerCase()
      )
      if (filteredLive.length > 0) {
        liveDataArg = JSON.stringify(filteredLive)
      }
    } catch (e) {
      console.log("No live data for prediction augmentation")
    }

    const prediction = await runPython([
      'predict', commodity, current_price, liveDataArg
    ])

    if (!prediction.success) {
      throw new Error(
        prediction.error || 'Prediction failed'
      )
    }

    res.json(prediction)

  } catch (error) {
    console.error('Prediction error:', error)

    // Fallback prediction
    const price = parseFloat(current_price)
    const predictions = Array.from(
      { length: 7 }, (_, i) => ({
        date: new Date(
          Date.now() + (i + 1) * 86400000
        ).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short'
        }),
        price: parseFloat(
          (price * (1 + 0.008 * (i + 1)))
            .toFixed(2)
        ),
        day: i + 1
      })
    )

    res.json({
      success: true,
      commodity,
      current_price: price,
      predictions,
      historical_chart: predictions.map(
        p => ({ ...p, type: 'predicted' })
      ),
      trend: 'stable',
      trend_percent: 2.5,
      price_change_7d: price * 0.025,
      recommendation: {
        action: 'SELL',
        message: 'Market conditions are stable.',
        color: '#E27D60',
        icon: 'stable'
      },
      model: 'Fallback',
      data_points: 0
    })
  }
})

// GET /api/mandi/compare
router.get('/compare', async (req, res) => {
  const {
    commodity = 'Tomato',
    farmer_price,
    state = 'Maharashtra'
  } = req.query

  if (!farmer_price) {
    return res.status(400).json({
      message: 'farmer_price required'
    })
  }

  try {
    // Get mandi rates
    let rates = []
    
    // First try API
    try {
      const live = await fetchLiveMandiData(commodity, 10)
      rates = live.filter(r => 
        r.state.toLowerCase() === state.toLowerCase()
      )
    } catch (apiErr) {
      console.log('[Compare] API fetch failed:', apiErr.message)
    }
    
    // If API failed or no results, try Python CSV fallback
    if (!rates.length) {
      try {
        console.log('[Compare] Trying Python CSV fallback for', commodity, state)
        const csv = await runPython([
          'csv', commodity, state
        ])
        rates = Array.isArray(csv) ? csv : []
        if (rates.length) {
          console.log('[Compare] ✅ CSV fallback returned', rates.length, 'records')
        }
      } catch (pyErr) {
        console.error('[Compare] Python fallback failed:', pyErr.message)
      }
    }

    if (!rates.length) {
      return res.json({
        commodity,
        farmer_price: parseFloat(farmer_price),
        mandi_modal: null,
        status: 'no_data',
        message: 'No mandi data available',
        color: '#7A7A7A'
      })
    }

    const fPrice = parseFloat(farmer_price)
    const modals = rates.map(r => r.modal_price)
    const avgModal = modals.reduce(
      (s, p) => s + p, 0
    ) / modals.length
    const diff = fPrice - avgModal
    const diffPct = (
      (diff / avgModal) * 100
    ).toFixed(1)

    let status, message, color, badge
    if (diff > avgModal * 0.15) {
      status = 'above_market'
      message = `Your price ₹${diff.toFixed(0)} above mandi average. Consider reducing slightly to attract more buyers.`
      color = '#FF5252'
      badge = '⚠️ ABOVE MARKET'
    } else if (diff < -(avgModal * 0.15)) {
      status = 'below_market'
      message = `Your price ₹${Math.abs(diff).toFixed(0)} below mandi rate. Great value — buyers will prefer you!`
      color = '#4CAF50'
      badge = '🎉 GREAT DEAL'
    } else {
      status = 'competitive'
      message = `Your price is competitive with mandi average of ₹${avgModal.toFixed(0)}/kg.`
      color = '#2D4F1E'
      badge = '✅ COMPETITIVE'
    }

    res.json({
      commodity,
      farmer_price: fPrice,
      mandi_modal: parseFloat(
        avgModal.toFixed(2)
      ),
      mandi_min: Math.min(
        ...rates.map(r => r.min_price)
      ),
      mandi_max: Math.max(
        ...rates.map(r => r.max_price)
      ),
      diff: parseFloat(diff.toFixed(2)),
      diff_percent: parseFloat(diffPct),
      status,
      message,
      color,
      badge,
      markets_checked: rates.length,
      latest_markets: rates.slice(-3)
    })

  } catch (error) {
    res.status(500).json({
      message: 'Comparison failed',
      error: error.message
    })
  }
})

// GET /api/mandi/history
// Returns historical price trend for charts
router.get('/history', async (req, res) => {
  const { 
    commodity = 'Tomato',
    state = 'Maharashtra'
  } = req.query

  try {
    const history = await runPython([
      'history', commodity, state
    ])

    res.json({
      success: true,
      commodity,
      history: Array.isArray(history)
        ? history : [],
      count: Array.isArray(history)
        ? history.length : 0
    })
  } catch (error) {
    res.status(500).json({
      message: 'History failed',
      error: error.message
    })
  }
})

// GET /api/mandi/all-commodities
// Returns latest rates for all commodities
router.get('/all-commodities',
  async (req, res) => {
  const {
    state = 'Maharashtra'
  } = req.query

  const commodities = [
    'Tomato', 'Onion', 'Potato',
    'Banana', 'Apple', 'Spinach',
    'Carrot', 'Capsicum', 'Cauliflower',
    'Mango', 'Grapes', 'Rice', 'Wheat'
  ]

  try {
    const results = []

    for (const commodity of commodities) {
      try {
        let rates = []
        try {
          const live = await fetchLiveMandiData(commodity, 3)
          rates = live.filter(r => 
            r.state.toLowerCase() === state.toLowerCase()
          )
        } catch {
          const csv = await runPython([
            'csv', commodity, state
          ])
          rates = Array.isArray(csv)
            ? csv.slice(-3) : []
        }

        if (rates.length) {
          const modal = rates.reduce(
            (s, r) => s + r.modal_price, 0
          ) / rates.length
          results.push({
            commodity,
            modal_price: parseFloat(
              modal.toFixed(2)
            ),
            min_price: Math.min(
              ...rates.map(r => r.min_price)
            ),
            max_price: Math.max(
              ...rates.map(r => r.max_price)
            ),
            date: rates[rates.length - 1]
              ?.arrival_date
          })
        }
      } catch {}
    }

    res.json({
      success: true,
      state,
      commodities: results,
      count: results.length,
      fetched_at: new Date().toISOString()
    })

  } catch (error) {
    res.status(500).json({
      message: 'Failed',
      error: error.message
    })
  }
})

// GET /api/mandi/today
// Returns today's market prices for multiple commodities
router.get('/today', async (req, res) => {
  try {
    const state = req.query.state || 'Maharashtra'
    
    // Try to get live state-wide averages first
    let livePrices = []
    try {
      const live = await fetchLiveMandiData(null, 50)
      
      // Filter by state locally
      const stateRecords = live.filter(r => 
        r.state.toLowerCase() === state.toLowerCase()
      )
      
      // Aggregate averages per commodity
      const totals = {}
      stateRecords.forEach(r => {
        const comm = r.commodity
        const modal = r.modal_price
        if (comm && !isNaN(modal)) {
          if (!totals[comm]) totals[comm] = { sum: 0, count: 0 }
          totals[comm].sum += modal
          totals[comm].count++
        }
      })
      
      livePrices = Object.keys(totals).map(comm => ({
        commodity: comm,
        price_qtl: Math.round(totals[comm].sum / totals[comm].count),
        price_kg: Math.round(totals[comm].sum / totals[comm].count / 100), // convert qtl to kg
        trend: 'stable' // Default for live snap
      }))
    } catch (apiErr) {
      console.error("[TODAY] API error:", apiErr.message)
    }

    // Still run Python for full list + historical context
    const pythonData = await runPython(['today'])
    
    // Merge live prices into python data (live overrides)
    const finalPrices = Array.isArray(pythonData) ? [...pythonData] : []
    
    livePrices.forEach(lp => {
      const idx = finalPrices.findIndex(fp => fp.commodity === lp.commodity)
      if (idx > -1) {
        finalPrices[idx] = { ...finalPrices[idx], price_kg: lp.price_kg, price_qtl: lp.price_qtl, source: 'live' }
      } else {
        finalPrices.push({ ...lp, source: 'live' })
      }
    })

    res.json({
      success: true,
      prices: finalPrices,
      date: new Date().toLocaleDateString('en-GB'),
      source: livePrices.length > 0 ? 'Agmarknet Live' : 'Historical CSV'
    })
  } catch (err) {
    console.error("[TODAY] Route error:", err)
    res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/mandi/trend?commodity=Tomato
// Returns 3-year trend and yearly analysis
router.get('/trend', async (req, res) => {
  const { commodity = 'Tomato' } = req.query
  try {
    const data = await runPython(
      ['trend', commodity]
    )
    res.json(data)
  } catch (err) {
    res.status(500).json({
      message: 'Trend failed',
      error: err.message
    })
  }
})

// GET /api/mandi/recommend?zone=Maharashtra
// Returns suitable crops for a specific zone
router.get('/recommend', async (req, res) => {
  const { zone = 'Maharashtra' } = req.query
  try {
    const data = await runPython(
      ['recommend', zone]
    )
    res.json({
      success: true,
      recommendations: Array.isArray(data)
        ? data : []
    })
  } catch (err) {
    res.status(500).json({
      message: 'Recommend failed'
    })
  }
})

// GET /api/mandi/status
router.get('/status', async (req, res) => {
  try {
    const data = await runPython(['status'])
    res.json({
      success: true,
      ...data
    })
  } catch (err) {
    res.status(500).json({
      message: 'Status check failed'
    })
  }
})

export default router
