// src/frontend/contexts/CartContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useReducer,
  useState,
} from "react";
import { toast } from "react-toastify";
import { auth } from "../config/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import debounce from "lodash.debounce";
import { useProducts } from "./ProductContext";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5002";

// 🛒 Initial Local State
const initialState = {
  cart: [],
  loading: false,
  error: null,
};

// ⚙️ Reducer
const reducer = (state, action) => {
  switch (action.type) {
    case "SET_CART":
      return { ...state, cart: action.payload };

    case "ADD_TO_CART": {
      const existing = state.cart.find((item) => item.id === action.payload.id);
      let updated;
      if (existing) {
        updated = state.cart.map((item) =>
          item.id === action.payload.id
            ? {
                ...item,
                // merge quantity and ensure image/name/price exist (prefer existing)
                quantity:
                  Number(item.quantity || 0) + Number(action.payload.quantity || 1),
                image: item.image || action.payload.image || "",
                name: item.name || action.payload.name || item.name,
                price: item.price || action.payload.price || item.price,
              }
            : item
        );
      } else {
        updated = [
          ...state.cart,
          { ...action.payload, quantity: Number(action.payload.quantity || 1) },
        ];
      }
      return { ...state, cart: updated };
    }

    case "REMOVE_FROM_CART":
      return {
        ...state,
        cart: state.cart.filter((item) => item.id !== action.payload),
      };

    case "UPDATE_QUANTITY":
      return {
        ...state,
        cart: state.cart.map((item) =>
          item.id === action.payload.id
            ? { ...item, quantity: Math.max(1, Number(action.payload.quantity)) }
            : item
        ),
      };

    case "CLEAR_CART":
      return { ...state, cart: [] };

    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_ERROR":
      console.error("Cart Error:", action.payload);
      return { ...state, error: action.payload };

    default:
      return state;
  }
};

// 🌾 Context setup
const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [uid, setUid] = useState(null);
  // helper keys for per-user cart storage
  const GUEST_KEY = "cart_local"; // keep for migrateLocalCartToServer
  const cartKeyFor = (u) => `cart_${u || "guest"}`;
  const lastSessionKeyFor = (u) => `last_session_cart_${u || "guest"}`;
  const lastToastRef = React.useRef({});
  const loadingTimerRef = React.useRef(null);

  const showToastOnce = (type, message, ttl = 800) => {
    try {
      const now = Date.now();
      const prev = lastToastRef.current[message] || 0;
      if (now - prev < ttl) return;
      lastToastRef.current[message] = now;
      if (type === "success") toast.success(message);
      else if (type === "info") toast.info(message);
      else if (type === "warn" || type === "warning") toast.warn(message);
      else if (type === "error") toast.error(message);
      else toast(message);
    } catch (e) {
      try { toast(message); } catch {}
    }
  };

  // Helper: coerce various quantity formats to a numeric value
  const parseNumericQty = (v) => {
    if (v == null) return 0;
    if (typeof v === "number") return v;
    try {
      const s = String(v);
      const m = s.match(/-?\d+(?:\.\d+)?/);
      return m ? parseFloat(m[0]) : 0;
    } catch (e) {
      return 0;
    }
  };

  const { products = [], updateProduct, setProducts } = useProducts() || {};

  // 🧮 Compute total
  const total = useMemo(
    () =>
      state.cart.reduce(
        (sum, item) =>
          sum + Number(item.price || 0) * Number(item.quantity || 0),
        0
      ),
    [state.cart]
  );

  /* -----------------------------------------
     ⭐ LOAD LOCAL CART ON STARTUP
  ----------------------------------------- */
  useEffect(() => {
    try {
      // Prefer per-user cart when available, otherwise fall back to guest cart
      const key = cartKeyFor(uid);
      const raw = localStorage.getItem(key) || localStorage.getItem(GUEST_KEY) || "[]";
      const saved = JSON.parse(raw || "[]");
      if (Array.isArray(saved) && saved.length > 0) {
        dispatch({ type: "SET_CART", payload: saved });
      }
    } catch (err) {
      console.warn("Failed to load saved cart:", err);
    }
  }, [uid]);

  /* -----------------------------------------
     ⭐ ALWAYS BACKUP CART (FAILSAFE)
     If logout happens while adding items, the cart restores perfectly.
  ----------------------------------------- */
  useEffect(() => {
    try {
      const key = cartKeyFor(uid);
      localStorage.setItem(key, JSON.stringify(state.cart));
      // strong backup copy per-user
      localStorage.setItem(lastSessionKeyFor(uid), JSON.stringify(state.cart));
    } catch (e) {
      console.warn("Could not persist cart locally:", e);
    }
  }, [state.cart, uid]);

  /* -----------------------------------------
     ⭐ RESTORE FROM BACKUP WHEN NEEDED
  ----------------------------------------- */
  const restoreBackupCart = useCallback(() => {
    try {
      const backup = JSON.parse(localStorage.getItem(lastSessionKeyFor(uid)) || "[]");
      if (Array.isArray(backup) && backup.length > 0) {
        dispatch({ type: "SET_CART", payload: backup });
      }
    } catch (err) {
      console.warn("Backup restore failed:", err);
    }
  }, [uid]);

  /* -----------------------------------------
     Auth State Listener
  ----------------------------------------- */
  useEffect(() => {
    let mounted = true;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;

      if (user) {
        setUid(user.uid);
        try {
          await migrateLocalCartToServer();
          const loaded = await loadServerCart();

          // ⭐ If server cart empty → restore backup
          if (!loaded || loaded.length === 0) {
            restoreBackupCart();
          }
        } catch (err) {
          console.warn("Cart migrate/load failed", err);
          restoreBackupCart(); // ⭐ Fallback
        }
      } else {
        setUid(null);
        // Guest mode → restore backup
        restoreBackupCart();
      }
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  /* -----------------------------------------
     Token Helper
  ----------------------------------------- */
  const getAuthHeader = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return null;
    try {
      const token = await user.getIdToken(true);
      return { Authorization: `Bearer ${token}` };
    } catch (err) {
      console.warn("getIdToken failed", err);
      return null;
    }
  }, []);

  /* -----------------------------------------
     Load Cart From Server
  ----------------------------------------- */
  const loadServerCart = useCallback(async () => {
    try {
      // mark loading and start a watchdog to avoid a permanently-stuck loading flag
      dispatch({ type: "SET_LOADING", payload: true });
      try { if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current); } catch (e) {}
      loadingTimerRef.current = setTimeout(() => {
        try { dispatch({ type: "SET_LOADING", payload: false }); } catch (e) {}
      }, 4000);
      const tokenHeader = await getAuthHeader();
      if (!tokenHeader) {
        try { if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current); } catch (e) {}
        dispatch({ type: "SET_LOADING", payload: false });
        return [];
      }

      const resp = await fetch(`${API_BASE}/api/cart`, { headers: tokenHeader });
      if (!resp.ok) {
        dispatch({ type: "SET_LOADING", payload: false });
        return [];
      }

      const data = await resp.json();
      const items = data?.cart?.items || [];
      dispatch({ type: "SET_CART", payload: items });
      return items;
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err.message });
      return [];
    } finally {
      try { if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current); } catch (e) {}
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [getAuthHeader]);

  /* -----------------------------------------
     Save Cart To Server
  ----------------------------------------- */
  const saveCartToServer = useCallback(
    async (items) => {
      try {
        const tokenHeader = await getAuthHeader();
        if (!tokenHeader) return;
        await fetch(`${API_BASE}/api/cart`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...tokenHeader },
          body: JSON.stringify({ items }),
        });
      } catch (err) {
        dispatch({ type: "SET_ERROR", payload: err.message });
      }
    },
    [getAuthHeader]
  );

  /* -----------------------------------------
     Debounced save
  ----------------------------------------- */
  const debouncedSave = useMemo(
    () =>
      debounce((items) => {
        saveCartToServer(items).catch((e) =>
          console.warn("debouncedSave failed", e)
        );
      }, 400),
    [saveCartToServer]
  );

  useEffect(() => {
    debouncedSave(state.cart);
    return () => debouncedSave.cancel();
  }, [state.cart, debouncedSave]);

  /* -----------------------------------------
     Merge local + server cart when logging in
  ----------------------------------------- */
  const migrateLocalCartToServer = useCallback(async () => {
    try {
      const local = JSON.parse(localStorage.getItem("cart_local") || "[]");
      if (!Array.isArray(local) || local.length === 0) return;

      const serverCart = await loadServerCart();
      const mergedMap = new Map();

      (serverCart || []).forEach((it) =>
        mergedMap.set(String(it.id), {
          ...it,
          quantity: Number(it.quantity || 0),
        })
      );

      local.forEach((it) => {
        const key = String(it.id);
        if (mergedMap.has(key)) {
          mergedMap.set(key, {
            ...mergedMap.get(key),
            quantity:
              Number(mergedMap.get(key).quantity || 0) +
              Number(it.quantity || 0),
          });
        } else {
          mergedMap.set(key, { ...it, quantity: Number(it.quantity || 0) });
        }
      });

      const merged = Array.from(mergedMap.values());
      await saveCartToServer(merged);
      dispatch({ type: "SET_CART", payload: merged });
      localStorage.removeItem("cart_local");
    } catch (err) {
      console.warn("migrateLocalCartToServer error:", err);
    }
  }, [loadServerCart, saveCartToServer]);

  /* -----------------------------------------
     ACTIONS
  ----------------------------------------- */
  const addToCart = useCallback(
    (product, qtyArg = null) => {
      try {
        if (!product) return;
        let pid = String(product.id || product._id || product.productId || "");
        // ensure a non-empty id so cart operations remain consistent
        if (!pid || pid === "") pid = `local_${Date.now()}`;
        const orderQty = Number(qtyArg ?? product._orderQty ?? product.orderQty ?? product.quantity ?? 1) || 1;

        // determine available stock (prefer canonical product list)
        const prod = (products || []).find((p) => String(p.id) === pid || String(p._id) === pid);
        const available = prod ? parseNumericQty(prod.quantity) : parseNumericQty(product.quantity);
        if (available < orderQty) {
          showToastOnce("warn", "Not enough stock available");
          return;
        }

        // decrement stock in ProductContext (or create fallback)
        if (prod) {
          updateProduct(prod.id, { quantity: Math.max(0, available - orderQty) });
        } else if (setProducts) {
          // create a minimal fallback product entry so UI displays updated stock
          const fallback = {
            id: pid || `local_${Date.now()}`,
            name: product.name || product.title || "Item",
            price: Number(product.price || 0),
            quantity: Math.max(0, available - orderQty),
            unit: product.unit || "unit",
            image: product.image || product.thumb || "",
          };
          setProducts((prev) => [fallback, ...(Array.isArray(prev) ? prev : [])]);
        }

        // Update cart contents
        const existing = state.cart.find((it) => String(it.id) === pid);
        const payload = {
          id: pid,
          name: product.name || product.title || "",
          price: Number(product.price || 0),
          quantity: orderQty,
          image:
            product.image || product.thumb || product.picture || product.imageUrl || (Array.isArray(product.images) ? product.images[0] : "") || "",
          category: product.category || product.cat || "",
        };
        if (existing) {
          // merge quantities
          dispatch({ type: "ADD_TO_CART", payload });
          showToastOnce("info", "🛒 Quantity updated");
        } else {
          dispatch({ type: "ADD_TO_CART", payload });
          showToastOnce("success", "✅ Item added");
        }
      } catch (e) {
        console.warn("addToCart failed", e);
      }
    },
    [state.cart, products, updateProduct, setProducts]
  );

  const removeFromCart = useCallback(
    (id) => {
      try {
        const pid = String(id);
        const cur = state.cart.find((it) => String(it.id) === pid);
        const qty = cur ? Number(cur.quantity || 0) : 0;
        if (qty > 0) {
          const prod = (products || []).find((p) => String(p.id) === pid || String(p._id) === pid);
          if (prod) {
            updateProduct(prod.id, { quantity: parseNumericQty(prod.quantity) + qty });
          } else if (setProducts) {
            // restore into local products list
            setProducts((prev) => {
              const found = (prev || []).find((p) => String(p.id) === pid);
              if (found) return (prev || []).map((p) => (String(p.id) === pid ? { ...p, quantity: parseNumericQty(p.quantity) + qty } : p));
              const minimal = { id: pid, name: cur?.name || "Item", price: cur?.price || 0, quantity: qty };
              return [minimal, ...(Array.isArray(prev) ? prev : [])];
            });
          }
        }
        dispatch({ type: "REMOVE_FROM_CART", payload: id });
      } catch (e) {
        console.warn("removeFromCart failed", e);
      }
    },
    [state.cart, products, updateProduct, setProducts]
  );

  const updateQuantity = useCallback(
    (id, qty) => {
      try {
        const pid = String(id);
        const newQty = Number(qty || 1);
        const cur = state.cart.find((it) => String(it.id) === pid);
        const oldQty = cur ? Number(cur.quantity || 0) : 0;
        const delta = newQty - oldQty;
        if (delta === 0) return;
        const prod = (products || []).find((p) => String(p.id) === pid || String(p._id) === pid);
        if (delta > 0) {
          // reserve more
          const available = prod ? parseNumericQty(prod.quantity) : 0;
          if (available < delta) {
            showToastOnce("warn", "Not enough stock available");
            return;
          }
          if (prod) updateProduct(prod.id, { quantity: Math.max(0, parseNumericQty(prod.quantity) - delta) });
          else if (setProducts) {
            setProducts((prev) => {
              const found = (prev || []).find((p) => String(p.id) === pid);
              if (found) return (prev || []).map((p) => (String(p.id) === pid ? { ...p, quantity: Math.max(0, parseNumericQty(p.quantity) - delta) } : p));
              const minimal = { id: pid, name: cur?.name || "Item", price: cur?.price || 0, quantity: Math.max(0, -delta) };
              return [minimal, ...(Array.isArray(prev) ? prev : [])];
            });
          }
        } else {
          // release
          const release = -delta;
          if (prod) updateProduct(prod.id, { quantity: parseNumericQty(prod.quantity) + release });
          else if (setProducts) {
            setProducts((prev) => {
              const found = (prev || []).find((p) => String(p.id) === pid);
              if (found) return (prev || []).map((p) => (String(p.id) === pid ? { ...p, quantity: parseNumericQty(p.quantity) + release } : p));
              const minimal = { id: pid, name: cur?.name || "Item", price: cur?.price || 0, quantity: release };
              return [minimal, ...(Array.isArray(prev) ? prev : [])];
            });
          }
        }
        dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity: newQty } });
        showToastOnce("info", "🛒 Quantity updated");
      } catch (e) {
        console.warn("updateQuantity failed", e);
      }
    },
    [state.cart, products, updateProduct, setProducts]
  );

  const clearCart = useCallback(() => {
    try {
      // restore stock for all items in cart
      (state.cart || []).forEach((it) => {
        const pid = String(it.id);
        const qty = Number(it.quantity || 0);
        if (!qty) return;
        const prod = (products || []).find((p) => String(p.id) === pid || String(p._id) === pid);
        if (prod) updateProduct(prod.id, { quantity: parseNumericQty(prod.quantity) + qty });
        else if (setProducts) {
          setProducts((prev) => {
            const found = (prev || []).find((p) => String(p.id) === pid);
            if (found) return (prev || []).map((p) => (String(p.id) === pid ? { ...p, quantity: parseNumericQty(p.quantity) + qty } : p));
            const minimal = { id: pid, name: it?.name || "Item", price: it?.price || 0, quantity: qty };
            return [minimal, ...(Array.isArray(prev) ? prev : [])];
          });
        }
      });
    } catch (e) {
      console.warn("clearCart stock restore failed", e);
    }
    dispatch({ type: "CLEAR_CART" });
    showToastOnce("info", "🧹 Cart cleared");
    (async () => {
      try {
        const tokenHeader = await getAuthHeader();
        if (!tokenHeader) return;
        await fetch(`${API_BASE}/api/cart`, {
          method: "DELETE",
          headers: { ...tokenHeader },
        });
      } catch (err) {
        console.warn("clearCart server delete failed", err);
      } finally {
        try {
          localStorage.removeItem(cartKeyFor(uid));
          localStorage.removeItem(lastSessionKeyFor(uid));
        } catch (e) {}
      }
    })();
  }, [getAuthHeader]);

  /* -----------------------------------------
     Full Clear After Checkout
  ----------------------------------------- */
  const clearAllCart = useCallback(
    async (orderId = null) => {
      try {
        dispatch({ type: "CLEAR_CART" });

        const keys = [
          GUEST_KEY,
          cartKeyFor(uid),
          lastSessionKeyFor(uid),
          "cart",
          "cartItems",
          "checkoutCart",
          "checkoutData",
          "savedCart",
          "lastOrderId",
        ];
        keys.forEach((k) => {
          try { localStorage.removeItem(k); } catch (e) {}
        });

        const tokenHeader = await getAuthHeader();
        if (tokenHeader) {
          await fetch(`${API_BASE}/api/cart/clear`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...tokenHeader },
            body: JSON.stringify({ orderId }),
          });
        }
      } catch (err) {
        console.error("clearAllCart failed", err);
      }
    },
    [getAuthHeader]
  );

  /* -----------------------------------------
     Save Order History
  ----------------------------------------- */
  const ORDERS_API = import.meta.env.VITE_API_ORDERS_URL || "http://localhost:5001";

  const saveOrderHistory = useCallback(
    async (userEmailParam = null, itemsParam = null, meta = {}) => {
      const email = userEmailParam || localStorage.getItem("userEmail") || "guest";
      const items = itemsParam || state.cart;
      if (!items || items.length === 0)
        throw new Error("No items to save in order history");

      try {
        const tokenHeader = await getAuthHeader();
        if (tokenHeader && auth.currentUser) {
          const uid = auth.currentUser.uid;

          try {
            await saveCartToServer(items);
          } catch (e) {
            console.warn("saveOrderHistory: saveCartToServer failed", e);
          }

          const res = await fetch(
            `${API_BASE}/api/users/${encodeURIComponent(uid)}/order`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(tokenHeader || {}),
              },
              body: JSON.stringify({ paymentInfo: meta }),
            }
          );

          const data = await res.json().catch(() => null);
          if (res.ok)
            return {
              ok: true,
              id:
                (data && data.order && data.order.orderId) ||
                data?.orderId ||
                data?.id,
            };
          throw new Error(data?.error || `userserver order failed`);
        }
      } catch (err) {
        console.warn("Authenticated order attempt failed:", err);
      }

      // Public fallback
      try {
        const resp = await fetch(`${ORDERS_API}/api/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer: {
              name: localStorage.getItem("userName") || email,
              email,
              phone: localStorage.getItem("userPhone") || "",
            },
            items,
            subtotal: items.reduce(
              (s, it) =>
                s + (Number(it.price) || 0) * (Number(it.quantity) || 0),
              0
            ),
            total: items.reduce(
              (s, it) =>
                s + (Number(it.price) || 0) * (Number(it.quantity) || 0),
              0
            ),
            metadata: meta || {},
          }),
        });

        const body = await resp.json().catch(() => null);
        if (resp.ok)
          return {
            ok: true,
            id: body?.id || body?.order?.orderId || body?.orderId,
          };
        throw new Error(body?.error || `orders service error`);
      } catch (err) {
        console.warn("saveOrderHistory fallback failed, storing local", err);
        const key = `orders_${email}`;
        const existing = JSON.parse(localStorage.getItem(key) || "[]");
        const order = {
          id: `local_${Date.now()}`,
          buyerEmail: email,
          items,
          total: items.reduce(
            (s, it) =>
              s + (Number(it.price) || 0) * (Number(it.quantity) || 0),
            0
          ),
          createdAt: new Date().toISOString(),
          meta,
        };
        localStorage.setItem(key, JSON.stringify([order, ...existing]));
        return { ok: true, id: order.id };
      }
    },
    [getAuthHeader, state.cart, saveCartToServer]
  );

  /* -----------------------------------------
     PROVIDER VALUE
  ----------------------------------------- */
  const value = {
    cart: state.cart,
    total,
    loading: state.loading,
    error: state.error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    clearAllCart,
    saveOrderHistory,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartProvider;
