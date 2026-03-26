import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';

export default function DropdownMenu({ items, triggerIcon }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="size-8 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors flex items-center justify-center outline-none"
      >
        {triggerIcon || <MoreHorizontal size={18} strokeWidth={2.5} />}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 origin-top-right overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-slate-200 focus:outline-none z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="py-1">
            {items.map((item, index) => (
              <button
                key={index}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  item.onClick();
                }}
                className={`w-full text-left flex items-center gap-2.5 px-4 py-2 text-sm font-medium transition-colors ${
                  item.danger
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {item.icon && <span className={`opacity-80 flex items-center justify-center ${item.danger ? 'text-red-500' : 'text-slate-400'}`}>{item.icon}</span>}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
