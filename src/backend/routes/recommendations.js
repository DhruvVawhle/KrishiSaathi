// src/backend/routes/recommendations.js
import express from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order.js';

const router = express.Router();

// GET /api/recommendations/:uid
router.get('/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    console.log('🎯 Recommendations for:', uid);

    // Check user's order history
    const orders = await Order.find(
      { buyerId: uid },
      { items: 1, createdAt: 1 }
    )
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

    // NEW USER — no orders
    if (!orders.length) {
      return res.json({
        type: 'popular',
        label: 'Popular This Week 🔥',
        reason: 'new_user',
        // Return all products sorted
        // Frontend will sort by soldCount
        products: []
      });
    }

    // RETURNING USER — has orders
    // Get categories they bought
    const boughtCategories = [
      ...new Set(
        orders.flatMap(o =>
          (o.items || []).map(i =>
            i.category
          )
        ).filter(Boolean)
      )
    ];

    // Get recently bought product IDs
    const recentProductIds = orders
      .slice(0, 3)
      .flatMap(o =>
        (o.items || []).map(i =>
          i.productId?.toString()
        )
      )
      .filter(Boolean);

    res.json({
      type: 'personalized',
      label: 'Picked For You 🌾',
      reason: 'based_on_orders',
      categories: boughtCategories,
      excludeIds: recentProductIds,
      totalOrders: orders.length
    });

  } catch (error) {
    console.error('Recommendations error:', error);
    // Fallback to popular
    res.json({
      type: 'popular',
      label: 'Popular This Week 🔥',
      reason: 'error_fallback',
      products: []
    });
  }
});

export default router;
