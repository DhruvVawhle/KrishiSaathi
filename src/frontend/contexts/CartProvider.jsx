import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  useCallback,
  useState,
} from "react";
import { toast } from "react-toastify";
import { auth } from "../config/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import debounce from "lodash.debounce";

// 🔗 Backend API base
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5002";

// 🛒 Initial state
const initialState = {
  cart: [],
  loading: false,
  error: null,
};

// ⚙️ Reducer
const reducer = (state, action) => {
  switch (action.type) {
    case "LOAD_CART_START":
      return { ...state, loading: true, error: null };
    case "LOAD_CART_SUCCESS":
      return { ...state, cart: action.payload, loading: false };
    case "LOAD_CART_ERROR":
      return { ...state, loading: false, error: action.payload };
    case "ADD_TO_CART": {
      const existing = state.cart.find((item) => item.id === action.payload.id);
      let updated;
      if (existing) {
        toast.info("🛒 Quantity updated");
        updated = state.cart.map((item) =>
          item.id === action.payload.id
            ? {
                ...item,
                quantity:
                  Number(item.quantity || 0) + Number(action.payload.quantity || 1),
              }
            : item
        );
      } else {
        toast.success("✅ Item added");
        updated = [
          ...state.cart,
          { ...action.payload, quantity: Number(action.payload.quantity || 1) },
        ];
      }
      return { ...state, cart: updated };
    }
    case "REMOVE_FROM_CART":
      toast.warn("❌ Removed");
      return { ...state, cart: state.cart.filter((item) => item.id !== action.payload) };
    case "UPDATE_QUANTITY":
      return {
        ...state,
        cart: state.cart.map((item) =>
          item.id === action.payload.id
            ? { ...item, quantity: Math.max(1, action.payload.quantity) }
            : item
        ),
      };
    case "CLEAR_CART":
      toast.info("🧹 Cart cleared");
      return { ...state, cart: [] };
    case "SET_ERROR":
      toast.error("⚠ Something went wrong");
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

// 🌾 Provider Component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    cart: JSON.parse(localStorage.getItem("cart") || "[]"),
  });
  const [uid, setUid] = useState(null);

  // 🧮 Total calculation
  const total = useMemo(
    () =>
      state.cart.reduce(
        (sum, item) =>
          sum + Number(item.price || 0) * Number(item.quantity || 0),
        0
      ),
    [state.cart]
  );

  /* ---------------- Local Load ---------------- */
  useEffect(() => {
    dispatch({ type: "LOAD_CART_START" });
    try {
      const stored = JSON.parse(localStorage.getItem("cart") || "[]");
      dispatch({ type: "LOAD_CART_SUCCESS", payload: stored });
    } catch (err) {
      dispatch({ type: "LOAD_CART_ERROR", payload: "Failed to load cart" });
    }
  }, []);

  /* ---------------- Local Save ---------------- */
  useEffect(() => {
    if (!state.loading)
      localStorage.setItem("cart", JSON.stringify(state.cart));
  }, [state.cart, state.loading]);

  /* ---------------- Auth & Firebase ---------------- */
  useEffect(() => {
    let active = true;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      if (user) {
        setUid(user.uid);
        try {
          await migrateLocalCartToServer();
          await loadServerCart();
        } catch (err) {
          console.warn("Cart sync error:", err);
        }
      } else {
        setUid(null);
      }
    });
    return () => {
      active = false;
      unsub();
    };
  }, []);

  /* ---------------- Get Auth Header ---------------- */
  const getAuthHeader = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return null;
    const token = await user.getIdToken(true);
    return { Authorization: `Bearer ${token}` };
  }, []);

  /* ---------------- Server Cart Load ---------------- */
  const loadServerCart = useCallback(async () => {
    try {
      const tokenHeader = await getAuthHeader();
      if (!tokenHeader) return;
      const res = await fetch(`${API_BASE}/api/cart`, { headers: tokenHeader });
      if (!res.ok) return;
      const data = await res.json();
      const items = data?.cart?.items || [];
      dispatch({ type: "LOAD_CART_SUCCESS", payload: items });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err.message });
    }
  }, [getAuthHeader]);

  /* ---------------- Save Cart to Server ---------------- */
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

  /* ---------------- Debounced Save ---------------- */
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

  /* ---------------- Merge Local with Server ---------------- */
  const migrateLocalCartToServer = useCallback(async () => {
    try {
      const local = JSON.parse(localStorage.getItem("cart") || "[]");
      if (!local.length) return;

      const tokenHeader = await getAuthHeader();
      if (!tokenHeader) return;

      const res = await fetch(`${API_BASE}/api/cart/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...tokenHeader },
        body: JSON.stringify({ items: local }),
      });
      if (res.ok) localStorage.removeItem("cart");
    } catch (err) {
      console.warn("migrateLocalCartToServer failed", err);
    }
  }, [getAuthHeader]);

  /* ---------------- Action Functions ---------------- */
  const addToCart = (product) =>
    dispatch({ type: "ADD_TO_CART", payload: product });

  const removeFromCart = (id) =>
    dispatch({ type: "REMOVE_FROM_CART", payload: id });

  const updateQuantity = (id, quantity) =>
    dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity } });

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR_CART" });
    (async () => {
      const tokenHeader = await getAuthHeader();
      if (tokenHeader)
        await fetch(`${API_BASE}/api/cart`, {
          method: "DELETE",
          headers: tokenHeader,
        });
      localStorage.removeItem("cart");
    })();
  }, [getAuthHeader]);

  /* ---------------- Full Clear after Checkout ---------------- */
  const clearAllCart = useCallback(async (orderId = null) => {
    try {
      dispatch({ type: "CLEAR_CART" });
      ["cart", "checkoutCart", "checkoutData", "savedCart"].forEach((k) =>
        localStorage.removeItem(k)
      );

      const tokenHeader = await getAuthHeader();
      if (tokenHeader)
        await fetch(`${API_BASE}/api/cart/clear`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...tokenHeader },
          body: JSON.stringify({ orderId }),
        });
    } catch (err) {
      console.warn("clearAllCart failed", err);
    }
  }, [getAuthHeader]);

  /* ---------------- Save Order History ---------------- */
  const saveOrderHistory = useCallback(
    async (email = "guest", items = state.cart, meta = {}) => {
      if (!items.length) throw new Error("No items to save");

      const payload = {
        buyerEmail: email,
        items,
        total,
        createdAt: new Date().toISOString(),
        meta,
      };

      try {
        const tokenHeader = await getAuthHeader();
        const res = await fetch(`${API_BASE}/api/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(tokenHeader || {}) },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Order save failed");
        return await res.json();
      } catch (err) {
        console.warn("saveOrderHistory fallback:", err);
        const key = `orders_${email}`;
        const existing = JSON.parse(localStorage.getItem(key) || "[]");
        const order = { id: `local_${Date.now()}`, ...payload };
        localStorage.setItem(key, JSON.stringify([order, ...existing]));
        return order;
      }
    },
    [getAuthHeader, state.cart, total]
  );

  /* ---------------- Context Value ---------------- */
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
