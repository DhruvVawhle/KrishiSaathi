import React from "react";

export default function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-2xl shadow-lg max-w-lg w-full p-6 z-10">
        {children}
      </div>
    </div>
  );
}
