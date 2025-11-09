
import React from 'react';

export const BigButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ onClick, disabled = false, children, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full max-w-sm mx-auto text-white font-extrabold text-2xl uppercase tracking-wider py-4 rounded-2xl border-b-8 shadow-md transition-all duration-150 ease-in-out hover:-translate-y-1 active:translate-y-0 active:shadow-none disabled:bg-gray-300 disabled:border-gray-500 disabled:text-gray-600 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${className}`}
  >
    {children}
  </button>
);
