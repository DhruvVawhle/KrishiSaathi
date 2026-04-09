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

  // Combined products: Local products + DB products + static products (deduplicated by name)
  const combinedProducts = React.useMemo(() => {
    // Start with Firestore/DB products
    const combined = [...dbProducts];
    
    // Add local products (offline/newly added) that aren't in DB yet
    // Defensive check: Only add if p and p.id/_id exists
    const dbIds = new Set(dbProducts.map(p => (p && (p.id || p._id)) ? String(p.id || p._id) : null).filter(Boolean));
    
    products.forEach(p => {
      if (p && (p.id || p._id)) {
        const idStr = String(p.id || p._id);
        if (!dbIds.has(idStr)) {
          combined.push(p);
        }
      }
    });

    // Add static products that aren't in either
    // Defensive check: Ensure p.name is a string before calling toLowerCase
    const seenNames = new Set(combined.map(p => 
      (p && typeof p.name === "string") ? p.name.toLowerCase() : ""
    ).filter(Boolean));
    
    allProducts.forEach(p => {
      if (p && typeof p.name === "string") {
        const nameLower = p.name.toLowerCase();
        if (!seenNames.has(nameLower)) {
          combined.push(p);
        }
      }
    });

    return combined;
  }, [dbProducts, products]);

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
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='240'%3E%3Crect fill='%23E8E8E8' width='320' height='240'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='16' fill='%23999' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E",
      farmerId: product.farmerId || "demo",
    };

    // Update dbProducts instead of local products to maintain consistency with the Provider's 'products'
    setDbProducts((prev) => [newProduct, ...prev]);
    return newProduct;
  }, []);

  /* ---------------------- UPDATE PRODUCT ---------------------- */
  const updateProduct = useCallback((id, updates) => {
    setDbProducts((prev) =>
      prev.map((p) => {
        if (String(p.id || p._id) === String(id)) {
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
    setDbProducts((prev) => prev.filter((p) => String(p.id || p._id) !== String(id)));
  }, []);

  /* ---------------------- RECORD SALE ---------------------- */
  const recordSale = useCallback(
    (productId, qty = 1) => {
      const sellQty = Number(qty);
      if (sellQty <= 0) return null;

      // Find the product in the current dbProducts state (which is exposed as 'products')
      const targetProduct = dbProducts.find(p => String(p.id || p._id) === String(productId));
      
      if (!targetProduct || targetProduct.quantity < sellQty) {
        console.warn(`Cannot record sale: Product ${productId} not found or insufficient quantity.`);
        return null;
      }

      // Create sale record outside the state updater to avoid side effects in Strict Mode
      const saleRecord = {
        id: Date.now(),
        productId,
        name: targetProduct.name,
        qty: sellQty,
        total: Number(targetProduct.price) * sellQty,
        date: new Date().toISOString(),
        unit: targetProduct.unit,
      };

      // Set state in separate calls. Updaters are now pure.
      setDbProducts((prev) => 
        prev.map(p => 
          String(p.id || p._id) === String(productId) 
            ? { ...p, quantity: p.quantity - sellQty } 
            : p
        )
      );
      
      setSalesLogs((prevLogs) => [saleRecord, ...prevLogs]);

      return saleRecord;
    },
    [dbProducts, setDbProducts, setSalesLogs]
  );

  /* ---------------------- CLEAR SALES ---------------------- */
  const clearSales = useCallback(() => {
    setSalesLogs([]);
  }, []);

  /* ---------------------- BULK UPDATE AFTER CHECKOUT ---------------------- */
  const updateStockAfterCheckout = useCallback((cartItems) => {
    // Reduce product quantities in dbProducts to maintain consistency
    setDbProducts((prev) =>
      prev.map((p) => {
        const cartItem = cartItems.find((c) => String(c.id || c._id) === String(p.id || p._id));
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
    setDbProducts([]);
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

export default ProductContext;
