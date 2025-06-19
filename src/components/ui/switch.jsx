import React from "react";

export function Switch({ checked, onCheckedChange, className = "", ...props }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 ${checked ? 'bg-purple-500' : 'bg-gray-300'} ${className}`}
      {...props}
    >
      <span
        className={`inline-block w-5 h-5 transform bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-1'}`}
      />
    </button>
  );
} 