import React from "react";
import { Check } from "lucide-react";

/**
 * FilterSidebar component for the KrishiSaathi Marketplace
 * Props correspond to state managed in Marketplace.jsx
 */
const FilterSidebar = ({
    categories = [],
    selectedCategory = "All",
    onCategoryChange,
    priceRange = [0, 500],
    maxPrice = 500,
    onPriceRangeChange,
    inStockOnly = false,
    onStockFilterChange,
    onClear,
    className = "",
}) => {
    return (
        <div className={`mp-sidebar ${className}`}>
            {/* Header */}
            <div className="mp-sidebar-header">
                <h3 className="mp-sidebar-title">Filters</h3>
                <button
                    className="mp-sidebar-clear"
                    onClick={onClear}
                    aria-label="Clear all filters"
                >
                    Clear all
                </button>
            </div>

            {/* Categories Selection */}
            <div className="mp-filter-section">
                <span className="mp-filter-label">Categories</span>
                <div className="mp-category-pills">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            className={`mp-category-pill ${selectedCategory === cat ? "active" : ""}`}
                            onClick={() => onCategoryChange(cat)}
                            aria-pressed={selectedCategory === cat}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Price Range Slider */}
            <div className="mp-filter-section">
                <span className="mp-filter-label">Max Price Range</span>
                <div className="mp-range-wrap">
                    <input
                        type="range"
                        className="mp-range-slider"
                        min={0}
                        max={maxPrice}
                        value={priceRange[1]}
                        onChange={(e) => onPriceRangeChange([priceRange[0], Number(e.target.value)])}
                        aria-label="Maximum price slider"
                    />
                    <div className="mp-range-display">
                        ₹{priceRange[0]} — ₹{priceRange[1]}
                    </div>
                </div>
            </div>

            {/* Stock Availability Filter */}
            <div className="mp-filter-section">
                <span className="mp-filter-label">Availability</span>
                <button
                    className="mp-checkbox-row"
                    onClick={() => onStockFilterChange(!inStockOnly)}
                    style={{ background: 'none', border: 'none', padding: 0, width: '100%', textAlign: 'left' }}
                    aria-checked={inStockOnly}
                    role="switch"
                >
                    <span className={`mp-checkbox ${inStockOnly ? "checked" : ""}`}>
                        {inStockOnly && <Check size={14} strokeWidth={3} />}
                    </span>
                    <span>In Stock only</span>
                </button>
            </div>
        </div>
    );
};

export default FilterSidebar;
