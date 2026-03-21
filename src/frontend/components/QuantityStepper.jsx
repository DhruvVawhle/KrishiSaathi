import React from "react";

/**
 * Reusable Quantity Stepper Component
 * Designed as a cohesive pill shape [ - ] [ n ] [ + ]
 */
const QuantityStepper = ({ value, onChange, min = 1, max = 10 }) => {
    const handleDecrement = (e) => {
        e.stopPropagation();
        if (value > min) {
            onChange(value - 1);
        }
    };

    const handleIncrement = (e) => {
        e.stopPropagation();
        if (value < max) {
            onChange(value + 1);
        }
    };

    const handleInputChange = (e) => {
        e.stopPropagation();
        const raw = e.target.value;
        if (raw === "") {
            onChange("");
            return;
        }

        const val = parseInt(raw, 10);
        if (!isNaN(val)) {
            // Let the parent strictly clamp or allow typing before blur
            onChange(val);
        }
    };

    const handleBlur = () => {
        let val = parseInt(value, 10);
        if (isNaN(val) || val < min) val = min;
        if (val > max) val = max;
        onChange(val);
    };

    // Derived flags for disabled states
    const numericValue = parseInt(value, 10) || min;
    const canDecrement = numericValue > min;
    const canIncrement = numericValue < max;

    return (
        <div
            className="qty-stepper"
            onClick={(e) => e.stopPropagation()} // Prevent card clicks
        >
            <button
                className="qty-stepper-btn"
                onClick={handleDecrement}
                disabled={!canDecrement}
                aria-label="Decrease quantity"
                type="button"
            >
                −
            </button>
            <input
                type="number"
                className="qty-stepper-input"
                value={value}
                onChange={handleInputChange}
                onBlur={handleBlur}
                min={min}
                max={max}
                aria-label="Quantity"
            />
            <button
                className="qty-stepper-btn"
                onClick={handleIncrement}
                disabled={!canIncrement}
                aria-label="Increase quantity"
                type="button"
            >
                +
            </button>
        </div>
    );
};

export default QuantityStepper;
