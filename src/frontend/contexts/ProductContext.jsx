import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { allProducts } from "@/data/products";
import { getProductsRealtime } from '../services/firestoreService';

const ProductContext = createContext();
export const useProducts = () => useContext(ProductContext);

// LocalStorage keys
const PRODUCTS_KEY = "krishi_products_v3";
const SALES_KEY = "krishi_sales_v2";
const API_BASE = "/api/users";

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
  const [products, setProducts] = useState([]);
  const [dbProducts, setDbProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = getProductsRealtime((items) => {
      setDbProducts(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Combined products: DB products + static products (deduplicated by name)
  const combinedProducts = React.useMemo(() => {
    const combined = [...dbProducts];
    const seenNames = new Set(dbProducts.map(p => p.name.toLowerCase()));

    allProducts.forEach(p => {
      if (!seenNames.has(p.name.toLowerCase())) {
        combined.push(p);
      }
    });

    return combined;
  }, [dbProducts]);

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
      const API_BASE = "/api/payment";
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
      const res = await fetch("/api/products/sync", {
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
        products: dbProducts, // Legacy 'products' now maps to DB products
        dbProducts,
        combinedProducts,
        loading,
        loadProductsFromDB: () => {}, // dummy for backward compat if any component still calls it
        addProduct,
        updateProduct,
        removeProduct,
        salesLogs,
        recordSale,
        clearSales,
        updateStockAfterCheckout,
        clearProducts,
        syncProductsToServer,
        setProducts: setDbProducts,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};
