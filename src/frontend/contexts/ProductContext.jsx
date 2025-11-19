import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const ProductContext = createContext();
export const useProducts = () => useContext(ProductContext);

// LocalStorage keys
const PRODUCTS_KEY = "krishi_products_v3";
const SALES_KEY = "krishi_sales_v2";

/**
 * ProductProvider
 * Handles:
 * - Farmer products (add, update, delete)
 * - Buyer purchases (recordSale)
 * - Local persistence
 * - Optional backend sync (placeholder hooks)
 */
export const ProductProvider = ({ children }) => {
  /* ---------------------- PRODUCTS ---------------------- */
  const [products, setProducts] = useState(() => {
    try {
      const raw = localStorage.getItem(PRODUCTS_KEY);
      if (raw) return JSON.parse(raw);

      // Default seed (first-time load)
      return [
        {
          id: 1,
          name: "Tomatoes",
          price: 60,
          quantity: 100,
          unit: "kg",
          category: "Vegetables",
          subcategory: "Root",
          image:
            "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=800&q=60",
          farmerId: "demo",
        },
        {
          id: 2,
          name: "Banana (1 dozen)",
          price: 50,
          quantity: 80,
          unit: "dozen",
          category: "Fruits",
          subcategory: "Tropical",
          image:
            "https://images.unsplash.com/photo-1574226516831-e1dff420e8f8?auto=format&fit=crop&w=800&q=60",
          farmerId: "demo",
        },
      ];
    } catch (e) {
      console.error("Error reading products from localStorage", e);
      return [];
    }
  });

  /* ---------------------- SALES LOGS ---------------------- */
  const [salesLogs, setSalesLogs] = useState(() => {
    try {
      const raw = localStorage.getItem(SALES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Error reading sales logs from localStorage", e);
      return [];
    }
  });

  /* ---------------------- SAVE TO LOCAL ---------------------- */
  useEffect(() => {
    try {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    } catch (e) {
      console.error("Failed to save products to localStorage", e);
    }
  }, [products]);

  /* ---------------------- NORMALIZE LEGACY OWNER FIELDS ---------------------- */
  useEffect(() => {
    try {
      // If any product has ownerEmail/owner but missing farmerId, copy it over
      let changed = false;
      const normalized = (products || []).map((p) => {
        if ((p.farmerId === undefined || p.farmerId === null || p.farmerId === "") && (p.ownerEmail || p.owner)) {
          changed = true;
          return { ...p, farmerId: p.farmerId || p.ownerEmail || p.owner };
        }
        return p;
      });
      if (changed) setProducts(normalized);
    } catch (e) {
      // non-fatal
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SALES_KEY, JSON.stringify(salesLogs));
    } catch (e) {
      console.error("Failed to save sales logs to localStorage", e);
    }
  }, [salesLogs]);

  /* ---------------------- ADD PRODUCT ---------------------- */
  const addProduct = useCallback((product) => {
    const validatedPrice = Number(product.price) >= 0 ? Number(product.price) : 0;
    const validatedQuantity = Number(product.quantity || 0) >= 0 ? Number(product.quantity) : 0;

    const newProduct = {
      ...product,
      id: Date.now(),
      price: validatedPrice,
      quantity: validatedQuantity,
      unit: product.unit || "unit",
      category: product.category || "Uncategorized",
      subcategory: product.subcategory || "General",
      image:
        product.image ||
        "https://via.placeholder.com/400x300?text=No+Image+Available",
      farmerId: product.farmerId || "demo",
    };

    setProducts((prev) => [newProduct, ...prev]);
    return newProduct;
  }, []);

  /* ---------------------- UPDATE PRODUCT ---------------------- */
  const updateProduct = useCallback((id, updates) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, ...updates };
          if (typeof updated.price !== "number" || updated.price < 0)
            updated.price = 0;
          if (typeof updated.quantity !== "number" || updated.quantity < 0)
            updated.quantity = 0;
          return updated;
        }
        return p;
      })
    );
  }, []);

  /* ---------------------- REMOVE PRODUCT ---------------------- */
  const removeProduct = useCallback((id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  /* ---------------------- RECORD SALE ---------------------- */
  const recordSale = useCallback(
    (productId, qty = 1) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return null;

      const sellQty = Number(qty);
      if (sellQty <= 0 || product.quantity < sellQty) return null;

      // Update stock
      updateProduct(productId, { quantity: product.quantity - sellQty });

      // Create sale record
      const sale = {
        id: Date.now(),
        productId,
        name: product.name,
        qty: sellQty,
        total: Number(product.price) * sellQty,
        date: new Date().toISOString(),
        unit: product.unit,
      };

      setSalesLogs((prev) => [sale, ...prev]);
      return sale;
    },
    [products, updateProduct]
  );

  /* ---------------------- CLEAR SALES ---------------------- */
  const clearSales = useCallback(() => {
    setSalesLogs([]);
  }, []);

  /* ---------------------- BULK UPDATE AFTER CHECKOUT ---------------------- */
  const updateStockAfterCheckout = useCallback((cartItems) => {
    // Reduce product quantities for each purchased item
    setProducts((prev) =>
      prev.map((p) => {
        const cartItem = cartItems.find((c) => String(c.id) === String(p.id));
        if (cartItem) {
          const remaining = Math.max(0, p.quantity - cartItem.quantity);
          return { ...p, quantity: remaining };
        }
        return p;
      })
    );
  }, []);

  /* ---------------------- CLEAR ALL PRODUCTS (Admin Only) ---------------------- */
  const clearProducts = useCallback(() => {
    setProducts([]);
  }, []);

  /* ---------------------- OPTIONAL BACKEND SYNC ---------------------- */
  const syncProductsToServer = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5002/api/products/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products }),
      });
      if (!res.ok) throw new Error("Server rejected product sync");
      console.log("✅ Products synced with server");
    } catch (err) {
      console.warn("Product sync failed:", err.message);
    }
  }, [products]);

  /* ---------------------- PROVIDER VALUE ---------------------- */
  return (
    <ProductContext.Provider
      value={{
        products,
        addProduct,
        updateProduct,
        removeProduct,
        salesLogs,
        recordSale,
        clearSales,
        updateStockAfterCheckout,
        clearProducts,
        syncProductsToServer,
        setProducts, // exposed for debug/manual import
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};
