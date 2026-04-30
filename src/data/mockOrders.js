export const mockOrders = [
  {
    id: "KS-10001",
    productName: "Premium Urea Fertilizer (50kg)",
    productImage: "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&q=80&w=200",
    status: "confirmed",
    eta: "2026-05-05T10:00:00Z",
    isDelayed: false,
    timeline: [
      { 
        status: "placed", 
        title: "Order Placed", 
        description: "Your order has been successfully placed and is being processed.", 
        timestamp: "2026-04-28T09:00:00Z" 
      },
      { 
        status: "confirmed", 
        title: "Order Confirmed", 
        description: "The seller has confirmed your order and is preparing the package.", 
        timestamp: "2026-04-29T11:30:00Z" 
      }
    ]
  },
  {
    id: "KS-10002",
    productName: "Advanced Manual Seed Drill",
    productImage: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=200",
    status: "shipped",
    eta: "2026-05-03T18:00:00Z",
    isDelayed: true,
    timeline: [
      { 
        status: "placed", 
        title: "Order Placed", 
        description: "Your order has been successfully placed.", 
        timestamp: "2026-04-25T14:20:00Z" 
      },
      { 
        status: "confirmed", 
        title: "Order Confirmed", 
        description: "Seller confirmed the order.", 
        timestamp: "2026-04-26T10:00:00Z" 
      },
      { 
        status: "shipped", 
        title: "Package Shipped", 
        description: "Your package has been handed over to our courier partner BlueDart.", 
        timestamp: "2026-04-27T16:45:00Z", 
        carrier: "AgriLogistics", 
        trackingId: "AL778899554" 
      }
    ]
  },
  {
    id: "KS-10003",
    productName: "Organic Bio-Pesticide Kit",
    productImage: "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?auto=format&fit=crop&q=80&w=200",
    status: "delivered",
    eta: "2026-04-30T12:00:00Z",
    isDelayed: false,
    timeline: [
      { status: "placed", title: "Order Placed", description: "Successfully placed.", timestamp: "2026-04-20T08:00:00Z" },
      { status: "confirmed", title: "Confirmed", description: "Seller confirmed.", timestamp: "2026-04-20T14:00:00Z" },
      { status: "shipped", title: "Shipped", description: "On the way.", timestamp: "2026-04-22T09:00:00Z", carrier: "ExpressPost", trackingId: "EP990011" },
      { status: "out_for_delivery", title: "Out for Delivery", description: "Our delivery executive is on the way.", timestamp: "2026-04-30T08:30:00Z" },
      { status: "delivered", title: "Order Delivered", description: "Delivered at your doorstep. Thank you!", timestamp: "2026-04-30T11:45:00Z" }
    ]
  },
  {
    id: "KS-10004",
    productName: "Smart Drip Irrigation Set",
    productImage: "https://images.unsplash.com/photo-1592890678914-71086c67d6c2?auto=format&fit=crop&q=80&w=200",
    status: "out_for_delivery",
    eta: "2026-05-10T10:00:00Z",
    isDelayed: false,
    timeline: [
      { status: "placed", title: "Order Placed", description: "Successfully placed.", timestamp: "2026-04-29T10:00:00Z" },
      { status: "confirmed", title: "Confirmed", description: "Seller confirmed.", timestamp: "2026-04-29T12:00:00Z" },
      { status: "shipped", title: "Shipped", description: "On the way.", timestamp: "2026-04-30T05:00:00Z", carrier: "AgriExpress", trackingId: "AE443322" },
      { status: "out_for_delivery", title: "Out for Delivery", description: "Our agent is arriving today at your location Pune.", timestamp: "2026-04-30T09:00:00Z" }
    ]
  }
];
