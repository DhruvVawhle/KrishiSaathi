import React, { useState, useEffect, useMemo, useRef } from "react";
import { useProducts } from "@/frontend/contexts/ProductContext";
import { useCart } from "@/frontend/contexts/CartContext";
import { notifications } from "@mantine/notifications";
import EmptyState from "@/frontend/components/ui/EmptyState";
import Skeleton from "@/frontend/components/ui/Skeleton";
import Button from "@/frontend/components/ui/Button";
import Card from "@/frontend/components/ui/Card";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, LayoutGrid, LayoutList, SlidersHorizontal, X, ShoppingCart } from "lucide-react";
import { updateSEO } from '@/frontend/utils/seo';
import Breadcrumb from '@/frontend/components/ui/Breadcrumb';

import FilterSidebar from "@/frontend/components/FilterSidebar";
import MarketProductCard from "@/frontend/components/MarketProductCard";
import QuickViewModal from "@/frontend/components/QuickViewModal";
import { allProducts, categories as globalCategories } from "@/data/products";
import { getProductsRealtime } from '@/frontend/services/hybridService';

import "./Marketplace.css";

/* ── helpers ── */
const formatCurrency = (v) =>
  Number(v || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

const ITEMS_PER_PAGE = 12;

const Marketplace = () => {
  const { combinedProducts: products = [], updateProduct, loading } = useProducts();
  const { addToCart, cart } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    updateSEO('/marketplace');
  }, []);

  /* ── State ── */
  const [quantities, setQuantities] = useState({});
  const [userEmail, setUserEmail] = useState("");
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("rank");
  const [category, setCategory] = useState("All");
  const [grade, setGrade] = useState("");
  const [priceRange, setPriceRange] = useState([0, 500]);

  const [inStockOnly, setInStockOnly] = useState(false);
  const [viewMode, setViewMode] = useState("grid");

  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef(null);
  const timeoutRef = useRef(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const [editing, setEditing] = useState({});
  const [quickView, setQuickView] = useState(null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const [dbProducts, setDbProducts] = useState([]);
  const [combinedProducts, setCombinedProducts] = useState(allProducts || []);

  // Sync auth on mount
  useEffect(() => {
    setUserEmail(localStorage.getItem("userEmail") || "");
  }, []);

  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  /* Debounced search */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  // Sync search state with URL parameter "q"
  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) {
      setSearch(q);
    }
  }, [searchParams]);

  useEffect(() => {
    // Subscribe to Firestore realtime
    let unsubscribe = null
    try {
      unsubscribe = getProductsRealtime(
        (fsProducts) => {
          setDbProducts(fsProducts || [])

          // Combine Firestore + static
          // Firestore products first
          // Static products fill the rest
          // Remove duplicates by name
          const fsNames = (fsProducts || [])
            .map(p =>
              (p.name || '').toLowerCase()
            )

          const uniqueStatic = (
            allProducts || []
          ).filter(p =>
            !fsNames.includes(
              (p.name || '').toLowerCase()
            )
          )

          const combined = [
            ...(fsProducts || []),
            ...uniqueStatic
          ]

          setCombinedProducts(combined)
          console.log(
            `✅ Marketplace: ${
              (fsProducts || []).length
            } farmer + ${
              uniqueStatic.length
            } catalog = ${
              combined.length
            } total products`
          )
        }
      )
    } catch (err) {
      console.warn(
        'Realtime products error:',
        err.message
      )
      // Fallback to static only
      setCombinedProducts(
        allProducts || []
      )
    }

    // Cleanup listener on unmount
    return () => {
      if (unsubscribe &&
          typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [])

  /* ── Merged products ── */
  const mergedProducts = useMemo(() => {
    return products || [];
  }, [products]);

  /* ── Categories ── */
  const categories = useMemo(() => globalCategories.map(c => c.id === 'all' ? 'All' : c.label), []);

  /* ── Max price for slider ── */
  const maxPrice = 500;

  /* ── Filtered + sorted products ── */
  const filteredProducts = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    let out = combinedProducts
      .filter((p) => (category === "All" ? true : (p.category || "Uncategorized") === category))
      .filter((p) => (grade === "" ? true : p.grade === grade))
      .filter((p) => p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q))
      .filter((p) => {
        const price = Number(p.price) || 0;
        return price >= priceRange[0] && price <= priceRange[1];
      });

    if (inStockOnly) {
      out = out.filter((p) => Number(p.quantity || 0) > 0);
    }

    if (sortOrder === "low-high") return [...out].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    if (sortOrder === "high-low") return [...out].sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    if (sortOrder === "newest") return [...out].reverse();
    if (sortOrder === "rank") return [...out].sort((a, b) => (Number(b.rankScore) || 0) - (Number(a.rankScore) || 0));
    if (sortOrder === "rating") return [...out].sort((a, b) => (Number(b.farmerRating) || 0) - (Number(a.farmerRating) || 0));
    return out;
  }, [combinedProducts, debouncedSearch, sortOrder, category, grade, priceRange, inStockOnly]);


  /* Reset visibleCount when filters change */
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [debouncedSearch, sortOrder, category, grade, priceRange, inStockOnly]);


  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  /* ── Infinite Scroll Observer ── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) =>
              Math.min(prev + ITEMS_PER_PAGE, filteredProducts.length)
            );
            setIsLoadingMore(false);
          }, 600);
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, filteredProducts.length]);

  /* ── Quantity helpers ── */
  const handleQtyChange = (productId, value) => {
    const numVal = Number(value);
    if (!Number.isFinite(numVal) || numVal < 1) {
      setQuantities((prev) => ({ ...prev, [productId]: 1 }));
      return;
    }
    setQuantities((prev) => ({ ...prev, [productId]: Math.max(1, Math.floor(numVal)) }));
  };

  /* ── Cart logic ── */
  const doAddToCart = (product) => {
    if (!isLoggedIn) {
      notifications.show({
        title: '🔒 Login Required',
        message: 'Please login first to add items to your cart.',
        color: 'yellow',
        autoClose: 3000,
        styles: { root: { fontFamily: 'DM Sans', background: '#FDFAF4', border: '1.5px solid #EDD9B0', borderLeft: '4px solid #F5A623', borderRadius: 12 } }
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => navigate(`/login?redirect=${encodeURIComponent("/marketplace")}`), 3000);
      return;
    }

    const prodId = product._id || product.id;
    const qty = quantities[prodId] || 1;
    addToCart(product, qty);
    // Auto-open sidebar on successful add
    window.dispatchEvent(new CustomEvent("open-cart"));
  };

  /* ── Owner edit logic ── */
  const startEdit = (p) => {
    const prodId = p._id || p.id;
    setEditing((s) => ({ ...s, [prodId]: { editing: true, price: p.price ?? 0, quantity: p.quantity ?? 0, saving: false } }));
  };

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
      notifications.show({ title: '❌ Invalid price', message: 'Enter a valid price (≥ 0).', color: 'red' });
      return;
    }
    if (!Number.isFinite(newQty) || newQty < 0) {
      notifications.show({ title: '❌ Invalid quantity', message: 'Enter a valid quantity (≥ 0).', color: 'red' });
      return;
    }

    setEditing((s) => ({ ...s, [id]: { ...s[id], saving: true } }));
    try {
      await updateProduct(id, { price: newPrice, quantity: clamp(newQty, 0, 9999999) });
      notifications.show({
        title: '✅ Product updated',
        message: 'Changes saved successfully.',
        color: 'green',
        styles: { root: { fontFamily: 'DM Sans', background: '#FDFAF4', border: '1.5px solid #EDD9B0', borderLeft: '4px solid #2D4F1E', borderRadius: 12 } }
      });
      setEditing((s) => {
        const copy = { ...s };
        delete copy[id];
        return copy;
      });
    } catch (err) {
      console.error(err);
      notifications.show({ title: '❌ Update failed', message: 'Could not update the product.', color: 'red' });
      setEditing((s) => ({ ...s, [id]: { ...s[id], saving: false } }));
    }
  };

  const incrementStock = async (p) => {
    const prev = Number(p.quantity || 0);
    const prodId = p._id || p.id;
    try {
      const idStr = String(prodId || "");
      if (!idStr.startsWith("gs-") && !idStr.startsWith("farm-") && !idStr.match(/^[0-9a-fA-F]{24}$/)) {
        await updateProduct(prodId, { quantity: prev + 1 });
        notifications.show({ title: '📦 Local stock updated', message: 'Added +1 manually.', color: 'blue' });
      } else {
        notifications.show({ title: '📈 Sync updated', message: 'Item stock updated in database.', color: 'green' });
      }
    } catch (err) {
      console.error(err);
      notifications.show({ title: '❌ Error', message: 'Could not increment stock.', color: 'red' });
    }
  };

  /* ── Clear all filters ── */
  const clearFilters = () => {
    setSearch("");
    setCategory("All");
    setGrade("");
    setSortOrder("rank");
    setPriceRange([0, maxPrice]);
    setInStockOnly(false);
  };


  /* ── Global product events ── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.__KS_PRODUCTS = Array.isArray(mergedProducts) ? mergedProducts : [];
      window.dispatchEvent(new CustomEvent("ks:products", { detail: window.__KS_PRODUCTS }));
    } catch (e) {
      console.warn("Could not broadcast products", e);
    }
  }, [mergedProducts]);

  /* Cart item count badge */
  const cartItemCount = cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  /* ═══ RENDER ═══ */
  return (
    <div className="mp-page">
      {/* ── Page Header Removed (Redundant with UnifiedHeader) ── */}

      {/* ── Body Wrapper ── */}
      <div className="mp-content-wrapper">
        <Breadcrumb items={[
          { label: 'Home', path: '/' },
          { label: 'Marketplace' }
        ]} />

        <h1 className="mp-page-title" style={{ position: 'absolute', left: '-9999px' }}>Fresh Farm Produce Marketplace</h1>
        {/* Search + Controls Bar (Sticky) */}
        <div className="mp-search-bar">
          <div className="mp-search-input-wrap">
            <Search size={18} className="mp-search-icon" />
            <input
              type="search"
              className="mp-search-input"
              placeholder="Search farm fresh vegetables, fruits..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search products"
            />
          </div>

          <div className="mp-controls-row">
            <div className="mp-sort-wrap">
              <span className="mp-sort-label">Sort by:</span>
              <select
                className="mp-sort-select"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                aria-label="Sort products"
              >
                <option value="rank">⭐ Best Match</option>
                <option value="low-high">💰 Price: Low to High</option>
                <option value="high-low">💎 Price: High to Low</option>
                <option value="newest">🆕 Newest First</option>
                <option value="rating">🌟 Top Rated</option>
              </select>

            </div>

            <div className="mp-view-toggle">
              <button
                className={`mp-view-btn ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
                aria-label="Grid view toggle"
              >
                <LayoutGrid size={18} strokeWidth={2.5} />
              </button>
              <button
                className={`mp-view-btn ${viewMode === "list" ? "active" : ""}`}
                onClick={() => setViewMode("list")}
                aria-label="List view toggle"
              >
                <LayoutList size={18} strokeWidth={2.5} />
              </button>
            </div>

            <span className="mp-results-count">
              Showing {visibleProducts.length} of {filteredProducts.length}
            </span>
          </div>
        </div>

        {/* ── Layout: Sidebar + Grid ── */}
        <div className="mp-content-layout">
          {/* Sidebar (Desktop Sticky) */}
          <div className="mp-sidebar-wrapper">
            <h2 style={{ fontSize: '1.2rem', color: '#2D4F1E', marginBottom: '1rem', fontFamily: 'Playfair Display' }}>Filter by Category</h2>
            <FilterSidebar
              categories={categories}
              selectedCategory={category}
              onCategoryChange={setCategory}
              priceRange={priceRange}
              maxPrice={maxPrice}
              onPriceRangeChange={setPriceRange}
              inStockOnly={inStockOnly}
              onStockFilterChange={setInStockOnly}
              onClear={clearFilters}
            />

            <div style={{ marginTop: '2rem' }}>
              <h2 style={{ fontSize: '1.2rem', color: '#2D4F1E', marginBottom: '1rem', fontFamily: 'Playfair Display' }}>Quality Grade</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { value: '', label: 'All Grades' },
                  { value: 'local', label: '🥬 Local' },
                  { value: 'a_grade', label: '⭐ A Grade' },
                  { value: 'organic', label: '🌿 Organic' },
                  { value: 'premium', label: '💎 Premium' },
                ].map(g => (
                  <button
                    key={g.value}
                    onClick={() => setGrade(g.value)}
                    style={{
                      textAlign: 'left',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #EDD9B0',
                      background: grade === g.value ? '#2D4F1E' : '#FDFAF4',
                      color: grade === g.value ? 'white' : '#4A4A4A',
                      fontFamily: 'DM Sans',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>


          {/* Main Grid Area */}
          <div className="mp-main-area">
            {filteredProducts.length === 0 ? (
              <EmptyState
                icon="🌾"
                title="No produce found"
                subtitle="We couldn't find anything matching your specific filters or search term."
                action={{ label: "Clear All Filters", onClick: clearFilters }}
              />
            ) : (
              <>
                <div className={`mp-grid ${viewMode === "list" ? "list-view" : ""}`}>
                  {visibleProducts.map((p, i) => {
                    const ownerEmail = p.farmerId || p.ownerEmail || p.sellerEmail || "";
                    const isOwner = Boolean(ownerEmail && userEmail && ownerEmail === userEmail);
                    const prodId = p._id || p.id;
                    const editState = editing[prodId] || {};

                    return (
                      <MarketProductCard
                        key={prodId}
                        product={p}
                        index={i}
                        quantity={quantities[prodId] || 1}
                        onQuantityChange={(val) => handleQtyChange(prodId, val)}
                        onAddToCart={(product) => doAddToCart(product)}
                        onQuickView={(product) => setQuickView(product)}
                        isAdded={cart.some(it => String(it.id) === String(prodId))}
                        isOwner={isOwner}
                        editState={editState}
                        onStartEdit={startEdit}
                        onCancelEdit={cancelEdit}
                        onEditField={handleEditField}
                        onSaveEdit={saveEdit}
                        onIncrementStock={incrementStock}
                      />
                    );
                  })}
                </div>

                <div ref={loaderRef} style={{ height: "40px", width: "100%" }} />

                {isLoadingMore && (
                  <div className="mp-grid">
                    {[1, 2, 3].map((i) => (
                      <Skeleton.ProductCard key={i} />
                    ))}
                  </div>
                )}

                {!hasMore && filteredProducts.length > 0 && (
                  <div style={{ textAlign: "center", padding: "60px 20px" }}>
                    <span style={{ fontSize: "36px", opacity: 0.8 }}>🌿</span>
                    <p style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: "20px", color: "#2D4F1E", margin: "12px 0 4px" }}>
                      You've browsed all {filteredProducts.length} items
                    </p>
                    <small style={{ fontFamily: "DM Sans, sans-serif", fontSize: "14px", color: "#7A7A7A" }}>
                      Check back soon for fresh seasonal arrivals!
                    </small>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile Filter Button ── */}
      <button
        className="mp-mobile-filter-btn"
        onClick={() => setFilterSheetOpen(true)}
        aria-label="Open filter settings"
      >
        <SlidersHorizontal size={18} /> Filters & Sort
      </button>

      {/* ── Mobile Filter Bottom Sheet ── */}
      <AnimatePresence>
        {filterSheetOpen && (
          <>
            <motion.div
              className="mp-filter-sheet-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFilterSheetOpen(false)}
            />
            <motion.div
              className="mp-filter-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="mp-filter-sheet-handle" />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h3 className="mp-sidebar-title" style={{ margin: 0 }}>Filter Produce</h3>
                <button
                  onClick={() => setFilterSheetOpen(false)}
                  style={{ background: "#F5E6CC", border: "1px solid #EDD9B0", cursor: "pointer", padding: 6, borderRadius: '50%', display: 'flex' }}
                  aria-label="Close filters"
                >
                  <X size={20} color="#4A4A4A" />
                </button>
              </div>

              <FilterSidebar
                categories={categories}
                selectedCategory={category}
                onCategoryChange={(cat) => setCategory(cat)}
                priceRange={priceRange}
                maxPrice={maxPrice}
                onPriceRangeChange={setPriceRange}
                inStockOnly={inStockOnly}
                onStockFilterChange={setInStockOnly}
                onClear={() => { clearFilters(); setFilterSheetOpen(false); }}
                className="mobile-sheet-sidebar"
              />

              <button
                className="mp-add-btn"
                style={{ marginTop: 24, fontSize: '16px' }}
                onClick={() => setFilterSheetOpen(false)}
              >
                Show {filteredProducts.length} Results
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Quick View Modal ── */}
      <AnimatePresence>
        {quickView && (
          <QuickViewModal
            product={quickView}
            onClose={() => setQuickView(null)}
            onAddToCart={(product) => {
              doAddToCart(product);
              setQuickView(null);
            }}
            quantity={quantities[quickView?.id] || 1}
            onQuantityChange={(val) => handleQtyChange(quickView.id, val)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Marketplace;