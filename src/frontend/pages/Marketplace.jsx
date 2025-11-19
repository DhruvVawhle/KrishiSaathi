// src/frontend/pages/Marketplace.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useProducts } from "../contexts/ProductContext";
import { useCart } from "../contexts/CartContext";
import Layout from "../components/Layout";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

/**
 * Marketplace — UI/UX enhanced version
 * - Sticky filter bar with search icon & chips
 * - Improved product cards (hover, badge, clearer price & stock)
 * - Mobile filter FAB
 * - Enhanced quick view modal
 * - Confirm add modal shows thumbnail + summary
 * - Empty state illustration & CTA
 *
 * Logic (addToCart, updateProduct, owner edit) preserved.
 */

const formatCurrency = (v) =>
  Number(v || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

const Marketplace = () => {
  const { products = [], updateProduct } = useProducts();
  const { addToCart } = useCart();

  // Sample defaults (kept from original)
  const farmerDefaults = [
    { id: "farm-tomato-1", name: "Tomato (1 kg)", description: "Fresh vine-ripened tomatoes from local farms.", category: "Vegetables", price: 40, quantity: 200, unit: "kg", image: "https://www.oahufresh.com/wp-content/uploads/2016/01/Roma_or_Bangalore_Tomatoes_Indian_hybrid.jpg" },
    { id: "farm-potato-1", name: "Potato (1 kg)", description: "New-season potatoes, earthy and fresh.", category: "Vegetables", price: 25, quantity: 300, unit: "kg", image: "https://www.foodandwine.com/thmb/-Yxlx-cou8lNguYnp5HcNH2rX1Q=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/Potatoes-May-No-Longer-Be-Considered-a-Vegetable-FT-BLOG1223-83fa6005a5bf4210aac4b1cc6fd35774.jpg" },
    { id: "farm-onion-1", name: "Onion (1 kg)", description: "Red onions ideal for curries and salads.", category: "Vegetables", price: 35, quantity: 220, unit: "kg", image: "https://jooinn.com/images/onion-15.jpg" },
    { id: "farm-apple-1", name: "Apple (1 kg)", description: "Fresh apples from nearby orchards.", category: "Fruits", price: 180, quantity: 80, unit: "kg", image: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=800&q=60" },
    { id: "farm-banana-1", name: "Banana (1 dozen)", description: "Sweet bananas, great for snacks.", category: "Fruits", price: 60, quantity: 120, unit: "dozen", image: "https://m.media-amazon.com/images/I/41Y2eoT3OTL.jpg" },
    { id: "farm-spinach-1", name: "Spinach (250 g)", description: "Fresh leafy greens, rich in iron.", category: "Leafy", price: 20, quantity: 180, unit: "bunch", image: "https://tse1.mm.bing.net/th/id/OIP.UjYirlKTHtygYKg7lzHOVwHaE8?cb=ucfimgc2&rs=1&pid=ImgDetMain&o=7&rm=3" },
    { id: "farm-coriander-1", name: "Coriander (bunch)", description: "Fresh dhaniya for garnishing and cooking.", category: "Leafy", price: 15, quantity: 200, unit: "bunch", image: "https://deliciouslyindian.net/wp-content/uploads/2020/07/coriander.jpg" }
  ];

  const groceryDefaults = [
    { id: "gs-rice-1", name: "Rice (5 kg)", description: "Aata-quality long-grain rice, perfect for everyday meals.", category: "Grocery", price: 399, quantity: 50, unit: "kg", image: "https://wallpapers.com/images/hd/ripe-sprig-of-rice-osp4z6onrtk3r098.jpg" },
    { id: "gs-wheat-1", name: "Wheat (10 kg)", description: "Freshly milled whole wheat .", category: "Grocery", price: 299, quantity: 60, unit: "kg", image: "https://images.pexels.com/photos/54084/wheat-grain-agriculture-seed-54084.jpeg?cs=srgb&dl=grains-wheat-close-up-54084.jpg&fm=jpg" },
    { id: "gs-sugar-1", name: "Sugar (5 kg)", description: "Refined sugar, good for daily use.", category: "Grocery", price: 45, quantity: 120, unit: "kg", image: "https://tse2.mm.bing.net/th/id/OIP.3SJWUfYtxaeSMAp31dBxHwHaE6?cb=ucfimgc2&w=800&h=531&rs=1&pid=ImgDetMain&o=7&rm=3" },
    { id: "gs-dal-1", name: "Toor Dal (1 kg)", description: "Protein-rich split pigeon peas.", category: "Grocery", price: 120, quantity: 80, unit: "kg", image: "https://nomadparadise.com/wp-content/uploads/2023/01/indian-dals-01-1024x683.jpg.webp" },
    { id: "gs-oil-1", name: "Sunflower Oil (1 L)", description: "Pure sunflower oil for everyday cooking.", category: "Grocery", price: 160, quantity: 90, unit: "ltr", image: "https://tse3.mm.bing.net/th/id/OIP.aMsaceJ0AAfkr_5JB85dFwHaEK?cb=ucfimgc2&rs=1&pid=ImgDetMain&o=7&rm=3" },
    { id: "gs-tea-1", name: "Tea (250 g)", description: "Strong Assam tea leaves.", category: "Grocery", price: 95, quantity: 100, unit: "pack", image: "https://img.freepik.com/premium-photo/tea-leaves-fresh-garden_94678-157.jpg" },
    { id: "gs-spice-1", name: "Turmeric Powder (100 g)", description: "High-quality haldi powder.", category: "Grocery", price: 40, quantity: 200, unit: "pack", image: "https://static.vecteezy.com/system/resources/previews/022/880/962/non_2x/a-pile-of-ground-turmeric-powder-or-curcumin-powder-isolated-on-white-background-turmeric-or-curcumin-powder-isolated-photo.jpg" },
    { id: "gs-dairy-1", name: "Milk (1 L)", description: "Fresh farm milk (pasteurised).", category: "Dairy", price: 55, quantity: 200, unit: "ltr", image: "https://i.nefisyemektarifleri.com/2023/08/25/sut-besin-degerleri-zayiflatir-mi-sut-detoksu-nasil-yapilir-2.jpg" },
    { id: "gs-eggs-1", name: "Eggs (12 pc)", description: "Fresh eggs from local farms.", category: "Dairy", price: 70, quantity: 150, unit: "dozen", image: "https://tse2.mm.bing.net/th/id/OIP.KNOvumJhsN2SIoNgI6yU6AHaE8?cb=ucfimgc2&rs=1&pid=ImgDetMain&o=7&rm=3" },
    { id: "gs-snack-1", name: "Salt", description: "Adds Taste to The Food.", category: "Grocery", price: 35, quantity: 180, unit: "pack", image: "https://cdn.pixabay.com/photo/2021/10/21/10/31/salt-6728600_1280.jpg" }
  ];

  const [quantities, setQuantities] = useState({});
  const [userEmail, setUserEmail] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("default");
  const [category, setCategory] = useState("All");
  const [editing, setEditing] = useState({});
  const [quickView, setQuickView] = useState(null);
  const [confirmAdd, setConfirmAdd] = useState(null);
  const pendingAdds = useRef(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    setUserEmail(localStorage.getItem("userEmail") || "");
  }, []);

  const userRole = localStorage.getItem("userRole") || "";
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const mergedProducts = useMemo(() => {
    const safeEmail = (userEmail || "anon").replace(/[^a-z0-9]/gi, "_");
    const farmerUserItems = (userRole === "farmer" && userEmail)
      ? farmerDefaults.map((p) => ({ ...p, id: `farm-${safeEmail}-${p.id}`, ownerEmail: userEmail }))
      : [];

    const combined = [
      ...farmerUserItems,
      ...farmerDefaults,
      ...groceryDefaults,
      ...(Array.isArray(products) ? products : []),
    ];

    const map = new Map();
    combined.forEach((p) => map.set(p.id, p));
    return Array.from(map.values());
  }, [products, userEmail, userRole]);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(mergedProducts.map((p) => p.category || "Uncategorized")))],
    [mergedProducts]
  );

  const handleQtyChange = (productId, value) => {
    const numVal = Number(value);
    if (!Number.isFinite(numVal) || numVal < 1) {
      setQuantities((prev) => ({ ...prev, [productId]: 1 }));
      return;
    }
    setQuantities((prev) => ({ ...prev, [productId]: Math.max(1, Math.floor(numVal)) }));
  };

  const parseNumericQty = (v) => {
    if (v == null) return 0;
    if (typeof v === "number") return v;
    try {
      const s = String(v || "").trim();
      const m = s.match(/-?\d+(?:\.\d+)?/);
      return m ? parseFloat(m[0]) : 0;
    } catch (e) {
      return 0;
    }
  };

  const attemptAddToCart = (product) => {
    const selectedQty = quantities[product.id] || 1;

    if (!isLoggedIn) {
      toast.warn("Please login first. Redirecting to login...", { autoClose: 1600 });
      setTimeout(() => navigate(`/login?redirect=${encodeURIComponent("/checkout")}`), 1800);
      return;
    }

    const available = parseNumericQty(product.quantity);
    if (available < selectedQty || selectedQty <= 0) {
      toast.error("Not enough stock available.");
      return;
    }

    setConfirmAdd({ product, qty: selectedQty });
  };

  const doAddToCart = (product, qty) => {
    if (pendingAdds.current.has(product.id)) {
      setConfirmAdd(null);
      return;
    }
    pendingAdds.current.add(product.id);
    setTimeout(() => pendingAdds.current.delete(product.id), 1500);

    try {
      addToCart(product, qty);
      window.dispatchEvent(new CustomEvent("open-cart"));
      setTimeout(() => window.dispatchEvent(new CustomEvent("close-cart")), 1800);
      setConfirmAdd(null);
      toast.success("Added to cart");
    } catch (err) {
      console.error(err);
      toast.error("Could not add to cart — try again.");
      setConfirmAdd(null);
    }
  };

  const startEdit = (p) =>
    setEditing((s) => ({ ...s, [p.id]: { editing: true, price: p.price ?? 0, quantity: p.quantity ?? 0, saving: false } }));

  const cancelEdit = (id) =>
    setEditing((s) => {
      const copy = { ...s };
      delete copy[id];
      return copy;
    });

  const handleEditField = (id, field, value) => {
    setEditing((s) => ({
      ...s,
      [id]: {
        ...s[id],
        [field]: field === "price" ? value : Math.max(0, Number(value || 0)),
      },
    }));
  };

  const saveEdit = async (id) => {
    const entry = editing[id];
    if (!entry) return;
    const newPrice = Number(entry.price);
    const newQty = Number(entry.quantity);
    if (!Number.isFinite(newPrice) || newPrice < 0) {
      toast.error("Enter a valid price (≥ 0).");
      return;
    }
    if (!Number.isFinite(newQty) || newQty < 0) {
      toast.error("Enter a valid quantity (≥ 0).");
      return;
    }

    setEditing((s) => ({ ...s, [id]: { ...s[id], saving: true } }));
    try {
      await updateProduct(id, { price: newPrice, quantity: clamp(newQty, 0, 9999999) });
      toast.success("Product updated");
      setEditing((s) => {
        const copy = { ...s };
        delete copy[id];
        return copy;
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update product. Try again.");
      setEditing((s) => ({ ...s, [id]: { ...s[id], saving: false } }));
    }
  };

  const incrementStock = async (p) => {
    const prev = Number(p.quantity || 0);
    try {
      const idStr = String(p.id || "");
      if (!idStr.startsWith("gs-") && !idStr.startsWith("farm-")) {
        await updateProduct(p.id, { quantity: prev + 1 });
        toast.info("Added +1 to stock", { autoClose: 2500 });
      } else {
        toast.info("Local item: stock change is local-only", { autoClose: 2500 });
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not increment stock");
    }
  };

  const filteredProducts = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    const out = mergedProducts
      .filter((p) => (category === "All" ? true : (p.category || "Uncategorized") === category))
      .filter((p) => p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q));

    if (sortOrder === "low-high") return out.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    if (sortOrder === "high-low") return out.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    return out;
  }, [mergedProducts, debouncedSearch, sortOrder, category]);

  const openQuickView = (p) => setQuickView(p);
  const closeQuickView = () => setQuickView(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.__KS_PRODUCTS = Array.isArray(mergedProducts) ? mergedProducts : [];
      window.dispatchEvent(new CustomEvent("ks:products", { detail: window.__KS_PRODUCTS }));
    } catch (e) {
      console.warn("Could not broadcast products", e);
    }

    const applyFromUrl = () => {
      try {
        const params = new URLSearchParams(window.location.search || "");
        const q = params.get("q") || "";
        setSearch(q);
      } catch (e) {}
    };

    applyFromUrl();

    const onHeaderSearch = (e) => {
      const q = e?.detail ?? "";
      setSearch(String(q || ""));
      try {
        const url = new URL(window.location.href);
        if (q) url.searchParams.set("q", q);
        else url.searchParams.delete("q");
        window.history.replaceState({}, "", url.toString());
      } catch (err) {}
    };

    window.addEventListener("ks:search", onHeaderSearch);
    window.addEventListener("popstate", applyFromUrl);

    return () => {
      window.removeEventListener("ks:search", onHeaderSearch);
      window.removeEventListener("popstate", applyFromUrl);
    };
  }, [mergedProducts]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-green-700 flex items-center gap-3">
              <span className="text-2xl">🌾</span> Marketplace
            </h2>
            <p className="text-sm text-gray-600 mt-1">Fresh produce from local farmers — buy direct.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-green-50 px-4 py-2 rounded-full shadow-sm text-green-700 font-semibold">
              👤 {userEmail || "Guest"}
            </div>
          </div>
        </div>

        {/* Sticky Filter Bar */}
        <div className="sticky top-4 z-30">
          <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-md flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Left: search + chips */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                <input
                  type="search"
                  aria-label="Search products"
                  placeholder="Search products, descriptions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent text-sm"
                />
              </div>

              <div className="hidden md:flex items-center gap-2">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 text-sm"
                  aria-label="Sort products"
                >
                  <option value="default">Sort</option>
                  <option value="low-high">Price: Low → High</option>
                  <option value="high-low">Price: High → Low</option>
                </select>
              </div>
            </div>

            {/* Right: chips + actions */}
            <div className="flex items-center gap-3">
              {/* category chips (scrollable on small screens) */}
              <div className="hidden md:flex gap-2 items-center">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-4 py-1 rounded-full text-sm transition ${category === cat ? "bg-green-600 text-white shadow-md" : "bg-white border border-gray-200 text-gray-700"}`}
                    aria-pressed={category === cat}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Reset/Back */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSearch("");
                    setCategory("All");
                    setSortOrder("default");
                  }}
                  className="text-sm px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-100"
                >
                  Reset
                </button>

                <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="text-sm px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700">
                  Back to top
                </button>
              </div>
            </div>

            {/* Category chips for small screens (scrollable) */}
            <div className="md:hidden overflow-x-auto mt-3 -mx-4 px-4">
              <div className="flex gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1 rounded-full text-sm transition ${category === cat ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-700"}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid or Empty State */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <img src="https://via.placeholder.com/220x160?text=No+Results" alt="No results" className="mx-auto mb-6 opacity-70" />
            <p className="text-gray-500 mb-4">No products found. Try adjusting filters or search.</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => { setSearch(""); setCategory("All"); setSortOrder("default"); }} className="px-4 py-2 bg-green-600 text-white rounded-lg">Reset filters</button>
              <button onClick={() => navigate("/")} className="px-4 py-2 border rounded-lg">Go Home</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((p) => {
              const selectedQty = quantities[p.id] || 1;
              const totalPrice = (Number(p.price) || 0) * selectedQty;
              const ownerEmail = p.ownerEmail || p.sellerEmail || "";
              const isOwner = Boolean(ownerEmail && userEmail && ownerEmail === userEmail);
              const editState = editing[p.id] || {};
              const outOfStock = Number(p.quantity || 0) <= 0;

              return (
                <motion.article
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="bg-white rounded-2xl shadow-[0_6px_20px_rgba(2,6,23,0.06)] border border-gray-100 overflow-hidden flex flex-col"
                >
                  <div className="relative">
                    <img
                      src={p.image || "https://via.placeholder.com/600x400?text=No+Image"}
                      alt={p.name}
                      className="w-full h-52 object-cover"
                      onError={(e) => (e.target.src = "https://via.placeholder.com/600x400?text=No+Image")}
                    />

                    <div className="absolute left-3 top-3 flex flex-col gap-2">
                      {isOwner && (
                        <span className="bg-white/95 px-3 py-1 text-xs rounded-full font-semibold shadow text-green-700">
                          Your product
                        </span>
                      )}

                      <span className={`px-3 py-1 text-xs rounded-full font-semibold shadow ${outOfStock ? "bg-red-600 text-white" : p.quantity <= 5 ? "bg-yellow-100 text-yellow-800" : "bg-green-50 text-green-700"}`}>
                        {outOfStock ? "Out of stock" : `${p.quantity} ${p.unit ?? "unit(s)"}`}
                      </span>
                    </div>

                    <div className="absolute right-3 top-3">
                      <button onClick={() => openQuickView(p)} aria-label={`Quick view ${p.name}`} className="bg-white/95 px-3 py-1 rounded-lg text-sm shadow hover:bg-white">
                        Quick view
                      </button>
                    </div>
                  </div>

                  <div className="p-4 flex flex-col grow justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{p.name}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description || ""}</p>

                      <div className="mt-3 flex items-end gap-3">
                        <div className="text-green-700 font-bold text-xl">{formatCurrency(p.price)}</div>
                        <div className="text-sm text-gray-500">/ {p.unit || "unit"}</div>
                      </div>

                      {isOwner && editState.editing ? (
                        <div className="mt-3 grid grid-cols-2 gap-2 items-center">
                          <label className="text-xs text-gray-500">Price</label>
                          <input type="number" min="0" step="0.5" value={editState.price} onChange={(e) => handleEditField(p.id, "price", e.target.value)} className="border border-gray-200 rounded px-2 py-1 text-sm" />
                          <label className="text-xs text-gray-500">Quantity</label>
                          <input type="number" min="0" value={editState.quantity} onChange={(e) => handleEditField(p.id, "quantity", e.target.value)} className="border border-gray-200 rounded px-2 py-1 text-sm" />
                        </div>
                      ) : (
                        <div className="mt-3 text-sm text-gray-600">
                          <span>Stock:</span>{" "}
                          <span className={p.quantity > 5 ? "text-green-700" : p.quantity > 0 ? "text-yellow-700" : "text-red-600"}>
                            {p.quantity} {p.unit}
                          </span>
                        </div>
                      )}

                      {!isOwner && (
                        <div className="mt-4 flex items-center gap-3">
                          <label className="text-sm">Qty</label>
                          <select value={selectedQty} onChange={(e) => handleQtyChange(p.id, e.target.value)} className="border border-gray-200 rounded-md px-2 py-1 text-sm" aria-label={`Quantity for ${p.name}`}>
                            {Array.from({ length: Math.min(10, Math.max(1, Number(p.quantity || 0))) }, (_, i) => i + 1).map((n) => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>

                          <div className="text-sm text-gray-700 ml-auto">
                            Total: <span className="font-semibold text-green-700">{formatCurrency(totalPrice)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex gap-2 items-center">
                      {isOwner ? (
                        editing[p.id]?.editing ? (
                          <>
                            <button onClick={() => saveEdit(p.id)} disabled={editing[p.id]?.saving} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium">
                              {editing[p.id]?.saving ? "Saving..." : "Save"}
                            </button>
                            <button onClick={() => cancelEdit(p.id)} className="flex-1 border border-gray-200 py-2 rounded-lg">Cancel</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(p)} className="flex-1 border border-green-600 text-green-700 py-2 rounded-lg">Edit</button>
                            <button onClick={() => incrementStock(p)} className="px-3 bg-green-100 text-green-700 rounded-lg">+1</button>
                          </>
                        )
                      ) : (
                        <button onClick={() => attemptAddToCart(p)} className={`w-full py-2 rounded-lg font-semibold transition ${outOfStock ? "bg-red-500 text-white" : "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white"}`} aria-label={`Add ${p.name} to cart`}>
                          🛒 Add to cart
                        </button>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}

        {/* Quick View Modal */}
        <AnimatePresence>
          {quickView && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeQuickView} aria-hidden />
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="relative bg-white rounded-2xl max-w-3xl w-full shadow-lg overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 flex items-center justify-center">
                    <img src={quickView.image || "https://via.placeholder.com/800x600"} alt={quickView.name} className="w-full h-80 object-cover" />
                  </div>

                  <div className="p-6 flex flex-col">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-2xl font-bold">{quickView.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{quickView.category}</p>
                      </div>
                      <button onClick={closeQuickView} className="text-gray-500 ml-4">Close</button>
                    </div>

                    <p className="mt-4 text-gray-700 flex-1">{quickView.description || "No additional details."}</p>

                    <div className="mt-4 flex items-center gap-4">
                      <div className="text-2xl font-extrabold text-green-700">{formatCurrency(quickView.price)}</div>
                      <div className="text-sm text-gray-500">/ {quickView.unit || "unit"}</div>
                      <div className="ml-auto text-sm text-gray-600">Stock: {quickView.quantity}</div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <button onClick={() => { attemptAddToCart(quickView); closeQuickView(); }} className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white py-2 rounded-lg">Add to cart</button>
                      <button onClick={closeQuickView} className="flex-1 border border-gray-200 py-2 rounded-lg">Close</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirm Add Modal */}
        <AnimatePresence>
          {confirmAdd && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-60 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmAdd(null)} aria-hidden />
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="relative bg-white rounded-2xl max-w-md w-full shadow-lg overflow-hidden p-6">
                <h3 className="text-lg font-semibold">Add to cart</h3>
                <div className="mt-3 flex items-center gap-3">
                  <img src={confirmAdd.product.image} alt={confirmAdd.product.name} className="w-16 h-16 object-cover rounded-md border" />
                  <div>
                    <div className="font-semibold">{confirmAdd.product.name}</div>
                    <div className="text-sm text-gray-500">Qty: <strong>{confirmAdd.qty}</strong></div>
                    <div className="text-sm text-gray-700 mt-1">Total: <strong>{formatCurrency((Number(confirmAdd.product.price)||0) * confirmAdd.qty)}</strong></div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button onClick={() => doAddToCart(confirmAdd.product, confirmAdd.qty)} className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white py-2 rounded-lg">Yes, add</button>
                  <button onClick={() => setConfirmAdd(null)} className="flex-1 border border-gray-200 py-2 rounded-lg">Cancel</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Filter FAB */}
        <div className="md:hidden fixed bottom-6 right-4 z-40">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Open filters" className="bg-green-600 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center">
            🔎
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Marketplace;
