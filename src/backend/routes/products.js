import express from 'express'
import Product from '../models/Product.js'
import {
  analyzeProduct,
  getPricingAdvice,
  getMandiRate
} from '../services/priceIntelligence.js'


const router = express.Router()

// GET /api/products
// Get all published products (for Marketplace)
router.get('/', async (req, res) => {
  try {
    const {
      category,
      farmerId,
      search,
      sort = 'rank',
      grade,
      priceMin,
      priceMax,
      limit = 100
    } = req.query

    const filter = { isPublished: true }
    
    if (category && category !== 'all' && category !== 'All') {
      filter.category = category
    }
    if (farmerId) {
      filter.farmerId = farmerId
    }
    if (search) {
      filter.name = {
        $regex: search,
        $options: 'i'
      }
    }
    if (grade) filter.grade = grade
    if (priceMin || priceMax) {
      filter.price = {}
      if (priceMin) filter.price.$gte = parseFloat(priceMin)
      if (priceMax) filter.price.$lte = parseFloat(priceMax)
    }

    // Sort options
    let sortObj = {}
    switch (sort) {
      case 'rank':
        sortObj = { rankScore: -1 }
        break
      case 'price_low':
        sortObj = { price: 1 }
        break
      case 'price_high':
        sortObj = { price: -1 }
        break
      case 'newest':
        sortObj = { createdAt: -1 }
        break
      case 'rating':
        sortObj = { farmerRating: -1 }
        break
      default:
        sortObj = { rankScore: -1 }
    }

    const products = await Product.find(filter)
      .sort(sortObj)
      .limit(parseInt(limit))
      .lean()

    res.json({
      success: true,
      products,
      count: products.length,
      sort
    })
  } catch (error) {
    console.error('Get products error:', error)
    res.status(500).json({
      message: 'Failed to fetch products',
      error: error.message
    })
  }
})


// GET /api/products/farmer/:farmerId
// Get ALL products for a specific farmer
// (including unpublished)
router.get('/farmer/:farmerId',
  async (req, res) => {
  try {
    const { farmerId } = req.params

    const products = await Product.find(
      { farmerId }
    )
    .sort({ createdAt: -1 })
    .lean()

    res.json({
      success: true,
      products,
      count: products.length
    })

  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch farmer products',
      error: error.message
    })
  }
})

// GET /api/products/:id
// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(
      req.params.id
    ).lean()

    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      })
    }

    res.json({ success: true, product })

  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch product'
    })
  }
})

// POST /api/products
// Add new product (farmer only)
  router.post('/', async (req, res) => {
    try {
      const {
        farmerId,
        farmerName,
        name,
        description,
        price,
        unit,
        quantity,
        category,
        image,
        grade,
        isPublished
      } = req.body

      if (!farmerId) return res.status(400)
        .json({ message: 'farmerId required' })
      if (!name) return res.status(400)
        .json({ message: 'name required' })
      if (!price) return res.status(400)
        .json({ message: 'price required' })
      if (!category) return res.status(400)
        .json({ message: 'category required' })

      const product = new Product({
        farmerId,
        farmerName: farmerName || 'Farmer',
        name: name.trim(),
        description: description || '',
        price: parseFloat(price),
        unit: unit || 'kg',
        priceUnit: unit || 'kg',
        quantity: parseInt(quantity || 0),
        category,
        image: image || '',
        grade: grade || 'local',
        isPublished: isPublished !== false,
        createdAt: new Date()
      })

      const saved = await product.save()
      console.log(
        '✅ Product saved to MongoDB:',
        saved.name
      )

      res.status(201).json({
        success: true,
        product: saved,
        message: `${saved.name} listed!`
      })

    } catch (err) {
      console.error(
        '❌ Product save error:',
        err.message
      )
      res.status(500).json({
        message: 'Failed to save product',
        error: err.message
      })
    }
  })

// GET /api/products/price-check
// Farmer checks if their price is good
router.get('/price-check', async (req, res) => {
  try {
    const {
      commodity,
      price,
      grade = 'local'
    } = req.query

    if (!commodity || !price) {
      return res.status(400).json({
        message: 'commodity and price required'
      })
    }

    const mandiRate = await getMandiRate(commodity)
    const advice = getPricingAdvice(
      parseFloat(price),
      mandiRate,
      grade
    )

    res.json({
      success: true,
      commodity,
      your_price: parseFloat(price),
      grade,
      mandi_rate: mandiRate,
      advice,
      grade_ranges: {
        local: {
          min: mandiRate ? Math.round(mandiRate * 0.80) : null,
          max: mandiRate ? Math.round(mandiRate * 1.10) : null,
          label: 'Local Grade'
        },
        a_grade: {
          min: mandiRate ? Math.round(mandiRate * 1.00) : null,
          max: mandiRate ? Math.round(mandiRate * 1.30) : null,
          label: 'A Grade'
        },
        organic: {
          min: mandiRate ? Math.round(mandiRate * 1.40) : null,
          max: mandiRate ? Math.round(mandiRate * 2.00) : null,
          label: 'Organic'
        },
        premium: {
          min: mandiRate ? Math.round(mandiRate * 1.20) : null,
          max: mandiRate ? Math.round(mandiRate * 1.60) : null,
          label: 'Premium'
        }
      }
    })
  } catch (err) {
    console.error('❌ Price check error:', {
      message: err.message,
      stack: err.stack,
      query: req.query
    })
    res.status(500).json({
      message: 'Price check failed',
      error: err.message
    })
  }
})

// GET /api/products/compare/:commodity
// Show all farmers selling same product
router.get('/compare/:commodity', async (req, res) => {
  try {
    const { commodity } = req.params
    const { grade, limit = 20 } = req.query

    const filter = {
      isPublished: true,
      $or: [
        { name: { $regex: commodity, $options: 'i' } },
        { category: { $regex: commodity, $options: 'i' } }
      ]
    }
    if (grade) filter.grade = grade

    const products = await Product.find(filter)
      .sort({ rankScore: -1 })
      .limit(parseInt(limit))
      .lean()

    // Get mandi rate
    const mandiRate = await getMandiRate(commodity)

    // Enrich each product
    const enriched = products.map(p => ({
      ...p,
      priceVsMandi: mandiRate
        ? Math.round(((p.price - mandiRate) / mandiRate) * 100)
        : null,
      priceCategory: !mandiRate
        ? 'unknown'
        : p.price <= mandiRate * 0.85
          ? 'below_mandi'
          : p.price <= mandiRate * 1.05
            ? 'at_mandi'
            : p.price <= mandiRate * 1.30
              ? 'above_mandi'
              : 'premium'
    }))

    // Group by price category
    const grouped = {
      below_mandi: enriched.filter(p => p.priceCategory === 'below_mandi'),
      at_mandi: enriched.filter(p => p.priceCategory === 'at_mandi'),
      above_mandi: enriched.filter(p => p.priceCategory === 'above_mandi'),
      premium: enriched.filter(p => p.priceCategory === 'premium')
    }

    res.json({
      success: true,
      commodity,
      mandi_rate: mandiRate,
      total_farmers: products.length,
      products: enriched,
      grouped,
      price_range: {
        min: products.length ? Math.min(...products.map(p => p.price)) : 0,
        max: products.length ? Math.max(...products.map(p => p.price)) : 0,
        avg: products.length 
          ? Math.round(products.reduce((s, p) => s + p.price, 0) / products.length * 100) / 100
          : 0
      }
    })

  } catch (err) {
    console.error('Compare failed:', err)
    res.status(500).json({
      message: 'Compare failed'
    })
  }
})


// PUT /api/products/:id
// Update product
router.put('/:id', async (req, res) => {
  try {
    const updates = { ...req.body }
    delete updates.farmerId // can't change owner
    updates.updatedAt = new Date()

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).lean()

    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      })
    }

    res.json({
      success: true,
      product,
      message: 'Product updated'
    })

  } catch (error) {
    res.status(500).json({
      message: 'Failed to update product'
    })
  }
})

// PATCH /api/products/:id/publish
// Toggle publish status
router.patch('/:id/publish',
  async (req, res) => {
  try {
    const product = await Product.findById(
      req.params.id
    )
    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      })
    }

    product.isPublished = !product.isPublished
    product.updatedAt = new Date()
    await product.save()

    res.json({
      success: true,
      isPublished: product.isPublished,
      message: product.isPublished
        ? 'Product published'
        : 'Product unpublished'
    })

  } catch (error) {
    res.status(500).json({
      message: 'Failed to toggle publish'
    })
  }
})

// DELETE /api/products/:id
// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(
      req.params.id
    )
    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      })
    }

    res.json({
      success: true,
      message: 'Product deleted'
    })

  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete product'
    })
  }
})

export default router
