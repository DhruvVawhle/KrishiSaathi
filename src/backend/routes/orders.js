import express from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import User from "../models/User.js";


const router = express.Router();

  router.post('/', async (req, res) => {
    try {
      const { items, buyerId } = req.body

      if (!items || !Array.isArray(items)
          || items.length === 0) {
        return res.status(400).json({
          message: 'items array required',
          received: typeof items
        })
      }

      const validItems = items.map(i => ({
        productId: i.productId
          || i.id || i._id || '',
        name: i.name || 'Product',
        price: Number(i.price) || 0,
        qty: Number(i.qty
          || i.quantity) || 1,
        image: i.image || '',
        farmerId: i.farmerId || 'demo',
        category: i.category || '',
        unit: i.unit || 'kg'
      }))

      const order = new Order({
        orderId: req.body.orderId
          || 'ORD' + Date.now(),
        buyerId: buyerId || 'demo',
        buyerName: req.body.buyerName || '',
        buyerEmail: req.body.buyerEmail || '',
        customer: req.body.customer || {
          name: req.body.buyerName || '',
          email: req.body.buyerEmail || '',
          phone: req.body.buyerPhone || '',
          address: req.body.deliveryAddress?.fullAddress || ''
        },
        items: validItems,
        total: Number(req.body.total) || 0,
        subtotal: Number(
          req.body.subtotal
        ) || 0,
        deliveryFee: Number(
          req.body.deliveryFee
        ) || 40,
        discount: Number(
          req.body.discount
        ) || 0,
        deliveryAddress:
          req.body.deliveryAddress || {},
        paymentMethod:
          req.body.paymentMethod || 'cod',
        status: 'confirmed',
        createdAt: new Date()
      })

      const saved = await order.save()
      console.log(
        '✅ Order saved to MongoDB:',
        saved.orderId
      )

      res.status(201).json({
        success: true,
        orderId: saved.orderId,
        order: saved,
        message: 'Order placed!'
      })

    } catch (err) {
      console.error(
        '❌ Order save error:',
        err.message
      )
      res.status(500).json({
        message: 'Failed to place order',
        error: err.message,
        validationErrors: err.errors
          ? Object.keys(err.errors)
            .map(k => ({
              field: k,
              message: err.errors[k].message
            }))
          : []
      })
    }
  })


router.get("/", async (req, res) => {
  try {
    const email = req.query.email;
    const query = email ? { "customer.email": email } : {};
    const list = await Order.find(query).sort({ createdAt: -1 }).lean();
    return res.json(list);
  } catch (err) {
    console.error("orders fetch error:", err);
    return res.status(500).json({ error: "Could not fetch orders" });
  }
});// ────────────────────────────────────────────────────────
// ✅ FARMER DASHBOARD ENDPOINTS
// Move ABOVE /:id to prevent route collision!
// ────────────────────────────────────────────────────────

// GET /api/orders/farmer/:farmerId
// Dedicated endpoint for farmer dashboard trends and recent orders
router.get('/farmer/:farmerId', async (req, res) => {
  console.log(`[ORDERS] Fetching analytics for farmer: ${req.params.farmerId}`);
  try {
    const { farmerId } = req.params;
    const { period = '7d' } = req.query;

    const startDate = new Date();
    if (period === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (period === '1m') startDate.setMonth(startDate.getMonth() - 1);

    // 0. Find the user to get their email/name fallbacks
    // In case items use their email or name as farmerId instead of Firebase UID
    const user = await User.findOne({ uid: farmerId });
    const searchIds = [farmerId];
    if (user) {
      if (user.email) searchIds.push(user.email);
      if (user.name) searchIds.push(user.name);
      // Also common test IDs like "demo" or "farmer1" if name matches
      if (user.name === 'demo' || user.email.includes('demo')) searchIds.push('demo');
      if (user.name === 'farmer1' || user.email.includes('farmer1')) searchIds.push('farmer1');
    }

    // 1. Get real orders for this farmer in the period
    const orders = await Order.find({
      'items.farmerId': { $in: searchIds },
      createdAt: { $gte: startDate },
      status: { $ne: 'cancelled' }
    }).sort({ createdAt: -1 }).lean();

    // 2. Build Daily Sales Trend
    const dailyMap = {};
    const daysCount = period === '7d' ? 7 : 30;
    for (let i = 0; i < daysCount; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      dailyMap[key] = { date: key, revenue: 0, orders: 0, items: 0 };
    }

    const categoryMap = {};
    let totalRevenue = 0;
    let totalItemsSold = 0;

    orders.forEach(order => {
      const dateKey = new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      
      const farmerItems = order.items.filter(item => searchIds.includes(String(item.farmerId)));
      
      if (farmerItems.length > 0) {
        if (dailyMap[dateKey]) dailyMap[dateKey].orders += 1;

        farmerItems.forEach(item => {
          const itemRev = (item.price || 0) * (item.qty || item.quantity || 1);
          totalRevenue += itemRev;
          totalItemsSold += (item.qty || item.quantity || 1);

          if (dailyMap[dateKey]) {
            dailyMap[dateKey].revenue += itemRev;
            dailyMap[dateKey].items += (item.qty || item.quantity || 1);
          }

          const cat = item.category || 'Others';
          if (!categoryMap[cat]) categoryMap[cat] = { name: cat, value: 0 };
          categoryMap[cat].value += itemRev;
        });
      }
    });

    // 3. Prepare Recent Orders (formatted for dashboard)
    const recentOrders = orders.slice(0, 5).map(ord => {
      const myItems = ord.items.filter(i => searchIds.includes(String(i.farmerId)));
      return {
        id: ord.orderId,
        item: myItems.length === 1 ? myItems[0].name : `${myItems[0].name} +${myItems.length - 1}`,
        quantity: myItems.reduce((s, i) => s + (i.qty || i.quantity || 1), 0),
        total: myItems.reduce((s, i) => s + (i.price * (i.qty || i.quantity || 1)), 0),
        status: ord.status.charAt(0).toUpperCase() + ord.status.slice(1)
      };
    });

    res.json({
      success: true,
      has_real_data: orders.length > 0,
      sales_trend: Object.values(dailyMap).reverse(),
      category_spread: Object.entries(categoryMap).map(([name, data]) => ({ name, value: data.value })),
      recent_orders: recentOrders,
      summary: {
        total_revenue: totalRevenue,
        total_orders: orders.length,
        total_items: totalItemsSold
      }
    });

  } catch (err) {
    console.error('Farmer orders API error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/orders/farmer/analytics/:farmerId
// Returns real sales data for charts
router.get('/farmer/analytics/:farmerId', async (req, res) => {
  try {
    const { farmerId } = req.params;
    const { period = '7d' } = req.query;

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    if (period === '7d') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === '1m') {
      startDate.setMonth(now.getMonth() - 1);
    }

    // Find all orders containing this farmer's products
    const orders = await Order.find({
      createdAt: { $gte: startDate },
      status: { $ne: 'cancelled' },
      'items.farmerId': farmerId
    }).lean();

    // Build daily sales data
    const dailyMap = {};
    const categoryMap = {};
    let totalRevenue = 0;
    let totalItems = 0;

    const daysCount = period === '7d' ? 7 : 30;
    for (let i = 0; i < daysCount; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short'
      });
      dailyMap[key] = {
        date: key,
        revenue: 0,
        orders: 0,
        items: 0
      };
    }

    // Fill with real order data
    orders.forEach(order => {
      const dateKey = new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short'
      });

      // Only count this farmer's items
      const farmerItems = (order.items || []).filter(item =>
        String(item.farmerId) === String(farmerId) || (item.farmerId === undefined && farmerId === 'demo')
      );

      farmerItems.forEach(item => {
        const itemRevenue = (item.price || 0) * (item.quantity || item.qty || 1);

        // Daily revenue
        if (dailyMap[dateKey]) {
          dailyMap[dateKey].revenue += itemRevenue;
          dailyMap[dateKey].items += (item.quantity || item.qty || 1);
        }

        // Category spread
        const cat = item.category || 'Others';
        if (!categoryMap[cat]) {
          categoryMap[cat] = {
            name: cat,
            value: 0,
            count: 0
          };
        }
        categoryMap[cat].value += itemRevenue;
        categoryMap[cat].count += (item.quantity || item.qty || 1);

        totalRevenue += itemRevenue;
        totalItems += (item.quantity || item.qty || 1);
      });

      // Count orders per day
      if (dailyMap[dateKey] && farmerItems.length > 0) {
        dailyMap[dateKey].orders += 1;
      }
    });

    // Sort days oldest to latest
    const salesTrend = Object.values(dailyMap).sort((a, b) => {
      // Re-sort correctly if needed, but reverse of creation order (which was newest first) 
      // should work as per logic above. Let's just reverse to match "oldest to latest"
    });
    
    // Actually, the loop for (i=0; i<days; i--) creates keys from today backward.
    // So to get oldest to latest, we reverse the Object.values.
    const finalSalesTrend = Object.values(dailyMap).reverse();

// Category data for donut
    const categorySpread = Object.values(categoryMap).sort((a, b) => b.value - a.value);

    // Mandi Comparison Overlay
    let mandiComparison = null;
    try {
      const topCategory = categorySpread[0];
      if (topCategory) {
        // Find a representative commodity name for the category
        // In a real app, this would be more complex.
        const mandiRes = await fetch(
          `http://localhost:3000/api/mandi/rates?commodity=${topCategory.name}&state=Maharashtra&limit=5`
        );
        const mandiData = await mandiRes.json();
        if (mandiData.summary) {
          mandiComparison = {
            commodity: topCategory.name,
            modal_price: mandiData.summary.avg_modal,
            source: mandiData.source
          };
        }
      }
    } catch (err) {
      console.log('Mandi overlay skipped:', err.message);
    }

    res.json({
      success: true,
      farmerId,
      period,
      summary: {
        total_revenue: parseFloat(totalRevenue.toFixed(2)),
        total_orders: orders.length,
        total_items: totalItems,
        avg_order_value: orders.length
          ? parseFloat((totalRevenue / orders.length).toFixed(2))
          : 0
      },
      sales_trend: finalSalesTrend,
      category_spread: categorySpread,
      mandi_comparison: mandiComparison,
      has_real_data: orders.length > 0
    });

  } catch (error) {
    console.error('Farmer analytics error:', error);
    res.status(500).json({
      message: 'Analytics failed',
      error: error.message
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id }).lean();
    if (!order) return res.status(404).json({ error: "Order not found" });
    return res.json(order);
  } catch (err) {
    console.error("orders get error:", err);
    return res.status(500).json({ error: "Could not fetch order" });
  }
});

router.get("/user/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    // Search by buyerId OR customer.email if it looks like an email
    const query = userId.includes("@") ? { "customer.email": userId } : { buyerId: userId };
    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();
    return res.json({ ok: true, orders });
  } catch (err) {
    console.error("orders fetch by user error:", err);
    return res.status(500).json({ error: "Could not fetch user orders" });
  }
});

// Ensure indexes on startup
Order.createIndexes().catch(err => console.error("Order indexes error:", err));

export default router;
