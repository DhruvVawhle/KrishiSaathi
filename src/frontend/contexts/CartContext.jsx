import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef
} from "react";
import { notifications } from '@mantine/notifications';
import * as hybridService from '../services/hybridService';
import { useUser } from './UserContext';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { user } = useUser();
  const [items, setItems] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const unsubscribeCartRef = useRef(null);

  const showToast = (product, quantity) => {
    notifications.show({
      title: '✅ Added to cart',
      message: `${quantity} x ${product.name} added successfully`,
      color: 'green',
      autoClose: 3000,
      styles: {
        root: {
          fontFamily: 'DM Sans',
          borderLeft: '4px solid #2D4F1E'
        },
        title: {
          fontWeight: 700,
          color: '#2D4F1E'
        }
      }
    });
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
    } catch { /* intentional */ }

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

  const addToCart = async (product, quantity = 1) => {
    if (!user?.uid) {
      notifications.show({
        title: '❌ Error',
        message: 'Please login to add items to cart',
        color: 'red',
        autoClose: 5000,
        styles: {
          root: {
            fontFamily: 'DM Sans',
            borderLeft: '4px solid #FF5252'
          }
        }
      });
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
          ? { ...i, quantity: (i.quantity || 0) + quantity }
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
        quantity,
        farmerId: product.farmerId || 'demo'
      }]
    }

    setItems(structuredClone(newItems))
    await hybridService.syncCart(user.uid, newItems)
    showToast(product, quantity);
    
    // Auto-open sidebar
    window.dispatchEvent(new CustomEvent("open-cart"));
  }

  const removeFromCart = async (id) => {
    if (!user?.uid) return;
    const newItems = items.filter(
      i => (i.id || i._id) !== id
    )
    setItems(structuredClone(newItems))
    await hybridService.syncCart(user.uid, newItems)
    notifications.show({
      title: '🗑️ Item removed',
      message: 'Item removed from cart',
      color: 'orange',
      autoClose: 3000,
      styles: {
        root: {
          fontFamily: 'DM Sans',
          borderLeft: '4px solid #E27D60'
        }
      }
    });
  }

  const updateQuantity = async (id, quantity) => {
    if (!user?.uid) return;
    if (quantity <= 0) {
      return removeFromCart(id)
    }
    const newItems = items.map(i =>
      (i.id || i._id) === id
        ? { ...i, quantity }
        : i
    )
    setItems(structuredClone(newItems))
    await hybridService.syncCart(user.uid, newItems)
  }

  const clearCart = async ({ silent = false } = {}) => {
    if (!user?.uid) return;
    setItems([])
    await hybridService.syncCart(user.uid, [])
    localStorage.removeItem(`cart_${user.uid}`);
    
    if (!silent) {
      notifications.show({
        title: '🧹 Cart cleared',
        message: 'All items removed from cart',
        color: 'gray',
        autoClose: 3000,
        styles: {
          root: {
            fontFamily: 'DM Sans',
            borderLeft: '4px solid #7A7A7A'
          }
        }
      });
    }
  }

  const total = useMemo(() => 
    items.reduce((sum, item) => sum + (item.price * (item.quantity || 0)), 0),
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
