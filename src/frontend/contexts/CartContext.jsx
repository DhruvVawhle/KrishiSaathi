import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef
} from "react";
import { toast } from "react-toastify";
import * as hybridService from '../services/hybridService';
import { useUser } from './UserContext';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { user } = useUser();
  const [items, setItems] = useState([]);
  const unsubscribeCartRef = useRef(null);

  const showToast = (product, qty) => {
    toast.success(`${qty} x ${product.name} added to cart!`);
  }

  // Realtime cart sync with User Isolation
  useEffect(() => {
    if (!user?.uid) {
      setItems([]);
      return;
    }

    // Namespaced backup restore
    try {
      const localCart = localStorage.getItem(`cart_${user.uid}`);
      if (localCart && items.length === 0) {
        setItems(JSON.parse(localCart));
      }
    } catch (e) {}

    // 🔥 SAFETY CHECK
    if (!hybridService.getCartRealtime) {
      console.warn("hybridService.getCartRealtime not available yet");
      return;
    }

    const unsubscribe = hybridService.getCartRealtime(user.uid, (cartItems) => {
      setItems(cartItems || []);
      // 🔥 NAMESPACED LOCAL STORAGE
      localStorage.setItem(`cart_${user.uid}`, JSON.stringify(cartItems || []));
    });

    return () => unsubscribe && unsubscribe();
  }, [user?.uid]);

  const addToCart = async (product, qty = 1) => {
    if (!user?.uid) {
      toast.error("Please login to add items to cart");
      return;
    }

    const existing = items.find(
      i => (i.id || i._id) ===
           (product.id || product._id)
    )

    let newItems
    if (existing) {
      newItems = items.map(i =>
        (i.id || i._id) ===
        (product.id || product._id)
          ? { ...i, qty: i.qty + qty }
          : i
      )
    } else {
      newItems = [...items, {
        id: product.id || product._id,
        name: product.name,
        price: product.price,
        unit: product.unit || 'kg',
        image: product.image || '',
        category: product.category || '',
        qty,
        farmerId: product.farmerId || 'demo'
      }]
    }

    setItems(newItems)
    await hybridService.syncCart(user.uid, newItems)
    showToast(product, qty);
    
    // Auto-open sidebar
    window.dispatchEvent(new CustomEvent("open-cart"));
  }

  const removeFromCart = async (id) => {
    if (!user?.uid) return;
    const newItems = items.filter(
      i => (i.id || i._id) !== id
    )
    setItems(newItems)
    await hybridService.syncCart(user.uid, newItems)
  }

  const updateQuantity = async (id, qty) => {
    if (!user?.uid) return;
    if (qty <= 0) {
      return removeFromCart(id)
    }
    const newItems = items.map(i =>
      (i.id || i._id) === id
        ? { ...i, qty }
        : i
    )
    setItems(newItems)
    await hybridService.syncCart(user.uid, newItems)
  }

  const clearCart = async () => {
    if (!user?.uid) return;
    setItems([])
    await hybridService.syncCart(user.uid, [])
    localStorage.removeItem(`cart_${user.uid}`);
  }

  const total = useMemo(() => 
    items.reduce((sum, item) => sum + (item.price * item.qty), 0),
  [items]);

  const value = {
    cart: items,
    items,
    total,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    clearAllCart: clearCart,
    saveOrderHistory: async () => ({ ok: true, id: 'fs_' + Date.now() })
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartProvider;
