// src/pages/AddProduct.jsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Layout from "../components/Layout";
import { motion, useReducedMotion } from "framer-motion";
import { PlusCircle, Package, Image as ImgIcon, Layers } from "lucide-react";
import { useProducts } from "../contexts/ProductContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";
const PLACEHOLDER =
  "https://via.placeholder.com/420x300.png?text=Product+Image";

const AddProduct = () => {
  const { products = [], addProduct } = useProducts();
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    subcategory: "",
    price: "",
    quantity: "",
    unit: "kg",
    image: "",
  });

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
    });
    setErrors({});
    setImageLoadError(false);
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
      const newProduct = {
        id: Date.now().toString(),
        name: formData.name.trim(),
        category: formData.category?.trim() || "Uncategorized",
        subcategory: formData.subcategory?.trim() || "",
        price: Number(parseFloat(formData.price).toFixed(2)),
        quantity: Number(formData.quantity),
        unit: formData.unit,
        image: formData.image?.trim() || "",
        createdAt: new Date().toISOString(),
      };

      const backendSaved = await saveToBackend(newProduct);
      addProduct(newProduct);
      if (!backendSaved) toast.info("Saved locally — will sync later.");

      if (options.view) return (window.location.href = "/marketplace");
      if (!options.keep) resetForm();
      document.querySelector('input[name="name"]')?.focus();
    } catch (err) {
      console.error("Add product failed:", err);
      toast.error("⚠️ Failed to add product.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

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
            {/* Product Name */}
            <div>
              <label htmlFor="name" className="text-sm font-medium text-gray-700">
                Product Name *
              </label>
              <input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onKeyDown={handleKeyPress}
                type="text"
                placeholder="e.g. Fresh Tomatoes"
                className={`mt-1 w-full px-3 py-2 rounded-md border ${
                  errors.name
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-200 focus:ring-green-200"
                } focus:outline-none focus:ring-2`}
              />
              {errors.name && (
                <p className="text-red-600 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Category + Subcategory */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="category" className="text-sm font-medium text-gray-700">
                  Category
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <Layers className="text-green-500" aria-hidden="true" />
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    onKeyDown={handleKeyPress}
                    className="w-full px-3 py-2 rounded-md border border-gray-200 focus:ring-2 focus:ring-green-200 outline-none"
                  >
                    <option value="">— Select or type —</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="subcategory" className="text-sm font-medium text-gray-700">
                  Subcategory
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <Package className="text-green-500" aria-hidden="true" />
                  <input
                    id="subcategory"
                    name="subcategory"
                    value={formData.subcategory}
                    onChange={handleChange}
                    onKeyDown={handleKeyPress}
                    placeholder="e.g. Leafy Greens"
                    className="w-full px-3 py-2 rounded-md border border-gray-200 focus:ring-2 focus:ring-green-200 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Price / Quantity / Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: "Price (₹) *", name: "price", type: "number", step: "0.01" },
                { label: "Quantity *", name: "quantity", type: "number", step: "1" },
              ].map((f) => (
                <div key={f.name}>
                  <label htmlFor={f.name} className="text-sm font-medium text-gray-700">
                    {f.label}
                  </label>
                  <input
                    id={f.name}
                    name={f.name}
                    value={formData[f.name]}
                    onChange={handleChange}
                    onKeyDown={handleKeyPress}
                    type={f.type}
                    min="0"
                    step={f.step}
                    className={`mt-1 w-full px-3 py-2 rounded-md border ${
                      errors[f.name]
                        ? "border-red-300 focus:ring-red-200"
                        : "border-gray-200 focus:ring-green-200"
                    } focus:outline-none focus:ring-2`}
                  />
                  {errors[f.name] && (
                    <p className="text-red-600 text-sm mt-1">{errors[f.name]}</p>
                  )}
                </div>
              ))}

              <div>
                <label htmlFor="unit" className="text-sm font-medium text-gray-700">
                  Unit
                </label>
                <select
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  onKeyDown={handleKeyPress}
                  className="mt-1 w-full px-3 py-2 rounded-md border border-gray-200 focus:ring-2 focus:ring-green-200 outline-none"
                >
                  {["kg", "grams", "litre", "ml", "dozen", "piece", "bundle"].map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Image */}
            <div>
              <label htmlFor="image" className="text-sm font-medium text-gray-700">
                Image URL
              </label>
              <div className="mt-1 flex items-center gap-2 border rounded-md px-3 py-2">
                <ImgIcon className="text-green-500" aria-hidden="true" />
                <input
                  id="image"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  onKeyDown={handleKeyPress}
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  className="w-full outline-none"
                />
              </div>
              {imageLoadError && (
                <p className="text-yellow-700 text-sm mt-1">
                  ⚠️ Invalid image URL — placeholder shown.
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap gap-3 items-center pt-2">
              <button
                type="submit"
                ref={submitBtnRef}
                disabled={submitting}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-white shadow focus-visible:ring-2 ${
                  submitting
                    ? "bg-green-400 cursor-wait"
                    : "bg-green-600 hover:bg-green-700 focus-visible:ring-green-300"
                }`}
              >
                {submitting ? "Adding..." : "Add Product"}
              </button>

              <button
                type="button"
                onClick={(e) => handleSubmit(e, { keep: true })}
                disabled={submitting}
                className={`px-4 py-2 rounded-md font-medium border focus-visible:ring-2 ${
                  submitting
                    ? "text-gray-400 border-gray-200"
                    : "border-green-200 text-green-700 hover:bg-green-50 focus-visible:ring-green-200"
                }`}
              >
                Add & Keep Adding
              </button>

              <button
                type="button"
                onClick={(e) => handleSubmit(e, { view: true })}
                disabled={submitting}
                className={`ml-auto px-4 py-2 rounded-md font-semibold focus-visible:ring-2 ${
                  submitting
                    ? "bg-gray-200 text-gray-500"
                    : "bg-white border border-green-200 text-green-700 hover:shadow-sm focus-visible:ring-green-200"
                }`}
              >
                Add & View Marketplace
              </button>
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
                <button
                  disabled={submitting}
                  onClick={() => toast.info("Preview saved locally.")}
                  className="px-3 py-2 rounded-md bg-green-50 text-green-700 border border-green-100 text-sm font-medium focus-visible:ring-2 focus-visible:ring-green-200"
                >
                  Save Preview
                </button>
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
