// src/pages/AddProduct.jsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Layout from "@/frontend/components/Layout";
import { motion, useReducedMotion } from "framer-motion";
import { PlusCircle, Package, Image as ImgIcon, Layers } from "lucide-react";
import { useProducts } from "@/frontend/contexts/ProductContext";
import { useToast } from "@/frontend/contexts/ToastContext";
import Input from "@/frontend/components/ui/Input";
import Button from "@/frontend/components/ui/Button";
import Card from "@/frontend/components/ui/Card";

const API_BASE = "/api";
const PLACEHOLDER =
  "https://via.placeholder.com/420x300.png?text=Product+Image";

import { addProductToFirestore } from '../services/firestoreService';

const AddProduct = () => {
  const { products = [], addProduct } = useProducts();
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    subcategory: "",
    price: "",
    quantity: "",
    unit: "kg",
    image: "",
    grade: "local",
  });

  const [priceAdvice, setPriceAdvice] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);

  const GRADES = [
    { value: 'local', label: '🥬 Local Grade', desc: 'Standard quality' },
    { value: 'b_grade', label: '🌿 B Grade', desc: 'Good quality' },
    { value: 'a_grade', label: '⭐ A Grade', desc: 'High quality' },
    { value: 'farm_fresh', label: '🌱 Farm Fresh', desc: 'Freshly harvested' },
    { value: 'premium', label: '💎 Premium', desc: 'Best quality' },
    { value: 'organic', label: '🌿 Organic', desc: 'No pesticides' },
    { value: 'export_quality', label: '✈️ Export Quality', desc: 'International standard' },
  ];


  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const submitBtnRef = useRef(null);
  const reduceMotion = useReducedMotion();

  // ✅ derive category options efficiently
  const categories = useMemo(
    () =>
      [...new Set(products.map((p) => p.category?.trim() || "").filter(Boolean))],
    [products]
  );

  useEffect(() => setImageLoadError(false), [formData.image]);

  const validate = useCallback(() => {
    const e = {};
    if (!formData.name.trim()) e.name = "Product name is required";
    if (!formData.price || Number(formData.price) <= 0)
      e.price = "Enter a valid positive price";
    if (!formData.quantity || Number(formData.quantity) <= 0)
      e.quantity = "Enter a valid quantity";
    return e;
  }, [formData]);

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      subcategory: "",
      price: "",
      quantity: "",
      unit: "kg",
      image: "",
      grade: "local",
    });
    setErrors({});
    setImageLoadError(false);
    setPriceAdvice(null);
  };


  const saveToBackend = async (product) => {
    try {
      const res = await fetch(`${API_BASE}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`✅ “${product.name}” added successfully!`);
        return true;
      } else {
        console.warn("⚠️ Server rejected:", data.error);
        toast.error("⚠️ Server error — saved locally.");
        return false;
      }
    } catch (err) {
      console.error("Server unreachable:", err);
      toast.warn("⚠️ Offline — product saved locally.");
      return false;
    }
  };

  const handleSubmit = async (e, options = { view: false, keep: false }) => {
    e.preventDefault();
    if (submitting) return;

    const eobj = validate();
    setErrors(eobj);
    if (Object.keys(eobj).length > 0) {
      toast.error("Please correct highlighted fields.");
      document.querySelector(`[name="${Object.keys(eobj)[0]}"]`)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const user = JSON.parse(localStorage.getItem('ks_user') || 'null');
      const fId = user?.uid || user?.id || user?._id || 'demo';
      const fName = user?.name || user?.displayName || 'Farmer';

      const newProduct = {
        farmerId: fId,
        farmerName: fName,
        name: formData.name.trim(),
        description: formData.subcategory ? `${formData.category} - ${formData.subcategory}` : "",
        price: Number(parseFloat(formData.price).toFixed(2)),
        quantity: Number(formData.quantity),
        unit: formData.unit,
        category: formData.category || "Vegetables",
        image: formData.image?.trim() || "",
        isPublished: true,
      };

      const savedProduct = await addProductToFirestore(newProduct);

      toast.success(`✅ “${savedProduct.name}” added successfully!`);
      addProduct(savedProduct);

      if (options.view) return (window.location.href = "/marketplace");
      if (!options.keep) resetForm();
      document.querySelector('input[name="name"]')?.focus();
    } catch (err) {
      console.error("Add product failed:", err);
      toast.error(err.message || "⚠️ Failed to add product.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  // Debounced price check
  const checkPrice = async (price, commodity, grade) => {
    if (!price || !commodity || price < 1) {
      setPriceAdvice(null);
      return;
    }
    setPriceLoading(true);
    try {
      const res = await fetch(
        `/api/products/price-check?commodity=${encodeURIComponent(commodity)}&price=${price}&grade=${grade}`
      );
      const data = await res.json();
      if (data.success) {
        setPriceAdvice(data);
      }
    } catch (err) {
      console.error("Price check failed:", err);
      setPriceAdvice(null);
    } finally {
      setPriceLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.price && formData.name) {
        checkPrice(formData.price, formData.name, formData.grade || 'local');
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [formData.price, formData.name, formData.grade]);


  const handleImageError = () => setImageLoadError(true);

  // ✨ Keyboard usability: Enter → focus next input
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const form = e.target.form;
      const idx = Array.prototype.indexOf.call(form, e.target);
      form.elements[idx + 1]?.focus();
    }
  };

  return (
    <Layout>
      {/* ToastContainer moved to App root to avoid duplicate toasts */}
      <motion.div
        initial={reduceMotion ? {} : { opacity: 0, y: 16 }}
        animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-10"
      >
        {/* FORM */}
        <div className="bg-white rounded-2xl shadow-md p-6 border border-green-50">
          <div className="flex items-center gap-3 mb-4">
            <PlusCircle className="w-8 h-8 text-green-600" aria-hidden="true" />
            <div>
              <h2 className="text-2xl font-bold text-green-700">Add New Product</h2>
              <p className="text-sm text-gray-500">
                List produce quickly and manage inventory.
              </p>
            </div>
          </div>

          <form onSubmit={(e) => handleSubmit(e)} className="space-y-4" aria-live="polite">
            <Input
              label="Product Name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Fresh Tomatoes"
              error={errors.name}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Category</label>
                <div className="relative">
                  <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 w-4 h-4" />
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-[#EDD9B0] bg-[#FDFAF4] focus:ring-2 focus:ring-[#2D4F1E] outline-none appearance-none"
                  >
                    <option value="">— Select or type —</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Input
                label="Subcategory"
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                placeholder="e.g. Leafy Greens"
                icon={Package}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <Input
                  label="Price (₹)"
                  required
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleChange}
                  error={errors.price}
                />
                
                {priceLoading && (
                  <div style={{ marginTop: 2, fontFamily: 'DM Sans', fontSize: 10, color: '#7A7A7A' }}>
                    Checking mandi rate...
                  </div>
                )}
              </div>

              <Input
                label="Quantity"
                required
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleChange}
                error={errors.quantity}
              />

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Unit</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-xl border border-[#EDD9B0] bg-[#FDFAF4] focus:ring-2 focus:ring-[#2D4F1E] outline-none"
                >
                  {["kg", "grams", "litre", "ml", "dozen", "piece", "bundle"].map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price Advisor Box */}
            {priceAdvice && !priceLoading && (
              <div style={{
                marginTop: 4,
                padding: '10px 14px',
                borderRadius: 12,
                background: priceAdvice.advice?.status === 'optimal' 
                  ? 'rgba(76,175,80,0.08)' 
                  : priceAdvice.advice?.status === 'too_low' 
                    ? 'rgba(255,82,82,0.08)' 
                    : 'rgba(226,125,96,0.08)',
                border: `1.5px solid ${priceAdvice.advice?.color || '#EDD9B0'}40`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}>
                {priceAdvice.mandi_rate && (
                  <div style={{ display: 'flex', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontFamily: 'DM Sans', fontSize: 9, color: '#7A7A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mandi Rate</div>
                      <div style={{ fontFamily: 'DM Sans', fontWeight: 800, fontSize: 14, color: '#2D4F1E' }}>₹{priceAdvice.mandi_rate}/kg</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: 'DM Sans', fontSize: 9, color: '#7A7A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ideal Range</div>
                      <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 13, color: '#4A4A4A' }}>
                        ₹{priceAdvice.grade_ranges?.[formData.grade || 'local']?.min}–₹{priceAdvice.grade_ranges?.[formData.grade || 'local']?.max}/kg
                      </div>
                    </div>
                  </div>
                )}
                
                <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#4A4A4A', margin: 0, lineHeight: 1.4, fontWeight: 500 }}>
                  {priceAdvice.advice?.advice}
                </p>

                {priceAdvice.advice?.status !== 'optimal' && (
                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, price: String(priceAdvice.advice?.suggestedPrice) }))}
                    style={{
                      marginTop: 8,
                      padding: '4px 12px',
                      background: '#2D4F1E',
                      border: 'none',
                      borderRadius: 8,
                      color: 'white',
                      fontFamily: 'DM Sans',
                      fontWeight: 700,
                      fontSize: 11,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(45,79,30,0.2)'
                    }}
                  >
                    Use Suggested Price (₹{priceAdvice.advice?.suggestedPrice}/kg)
                  </button>
                )}
              </div>
            )}

            {/* Grade Selector */}
            <div style={{ marginTop: 16 }}>
              <label style={{
                fontFamily: 'DM Sans',
                fontWeight: 700,
                fontSize: 11,
                color: '#4A4A4A',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                display: 'block',
                marginBottom: 8
              }}>
                Product Grade *
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 8
              }}>
                {GRADES.map(g => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, grade: g.value }))}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 12,
                      border: `1.5px solid ${formData.grade === g.value ? '#2D4F1E' : '#EDD9B0'}`,
                      background: formData.grade === g.value ? 'rgba(45,79,30,0.08)' : '#FDFAF4',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{
                      fontFamily: 'DM Sans',
                      fontWeight: 700,
                      fontSize: 12,
                      color: formData.grade === g.value ? '#2D4F1E' : '#4A4A4A'
                    }}>
                      {g.label}
                    </div>
                    <div style={{ fontFamily: 'DM Sans', fontSize: 10, color: '#7A7A7A', marginTop: 2 }}>
                      {g.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>


            <Input
              label="Image URL"
              name="image"
              type="url"
              value={formData.image}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              icon={ImgIcon}
              hint={imageLoadError ? "Invalid URL — placeholder shown" : ""}
            />

            {/* Buttons */}
            <div className="flex flex-wrap gap-3 items-center pt-2">
              <Button
                type="submit"
                loading={submitting}
                size="md"
                variant="success"
              >
                Add Product
              </Button>

              <Button
                variant="secondary"
                onClick={(e) => handleSubmit(e, { keep: true })}
                disabled={submitting}
              >
                Add & Keep Adding
              </Button>

              <Button
                variant="ghost"
                onClick={(e) => handleSubmit(e, { view: true })}
                disabled={submitting}
                style={{ marginLeft: 'auto', border: '1px solid #EDD9B0' }}
              >
                Add & View Marketplace
              </Button>
            </div>
          </form>
        </div>

        {/* PREVIEW */}
        <motion.div
          initial={reduceMotion ? {} : { opacity: 0, y: 8 }}
          animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl shadow-md p-4 border border-gray-100 flex flex-col justify-between"
        >
          <div className="flex flex-wrap lg:flex-nowrap items-start gap-4">
            <div className="w-full sm:w-1/2">
              <div className="w-full h-44 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center border border-gray-100">
                <img
                  src={!imageLoadError && formData.image ? formData.image : PLACEHOLDER}
                  alt={formData.name || "Preview image"}
                  onError={handleImageError}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>

            <div className="flex-1 min-w-[200px]">
              <h3 className="text-lg font-semibold text-gray-800">
                {formData.name || "Product name"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {formData.category || "Category"}{" "}
                {formData.subcategory ? `→ ${formData.subcategory}` : ""}
              </p>

              <div className="mt-4 flex items-center gap-3">
                <div className="text-2xl font-bold text-green-700">
                  ₹{formData.price ? Number(formData.price).toFixed(2) : "0.00"}
                </div>
                <div className="text-sm text-gray-600">
                  {formData.quantity || 0} {formData.unit}
                </div>
              </div>

              <p className="mt-4 text-sm text-gray-600">
                Preview how your product appears in the marketplace.
              </p>

              <div className="mt-6">
                <Button
                  variant="ghost"
                  disabled={submitting}
                  onClick={() => toast.info("Preview saved locally.")}
                  size="sm"
                  style={{ border: '1px solid #EDD9B0' }}
                >
                  Save Preview
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6 text-xs text-gray-400 text-center">
            Tip: Use a clear image (800×600) for best visibility.
          </div>
        </motion.div>
      </motion.div>
    </Layout>
  );
};

export default AddProduct;
