import React from "react";

const variants = {
  red: "bg-red-500 text-white",
  green: "bg-green-600 text-white",
  subtle: "bg-white/90 text-gray-800",
};

export default function Badge({ children, variant = "red", className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${variants[variant] || variants.red} ${className}`}
    >
      {children}
    </span>
  );
}
