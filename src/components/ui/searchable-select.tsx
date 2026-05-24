"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Search } from "lucide-react";

type Option = {
  value: string;
  label: string;
  description?: string;
};

type SearchableSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  emptyMessage?: string;
};

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onValueChange,
  options,
  placeholder = "Pilih...",
  searchPlaceholder = "Cari...",
  className,
  emptyMessage = "Tidak ada data"
}) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = selectedOption?.label || "";

  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return options;
    const searchLower = search.toLowerCase();
    return options.filter(opt => 
      opt.label.toLowerCase().includes(searchLower) || 
      opt.value.toLowerCase().includes(searchLower)
    );
  }, [options, search]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  React.useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open]);

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <button
        suppressHydrationWarning
        type="button"
        className={cn(
          "flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50",
        )}
        onClick={() => setOpen(!open)}
      >
        <span className="truncate text-gray-700">
          {displayValue || placeholder}
        </span>
        <ChevronDown className={cn("h-4 w-4 transition-transform ml-2 flex-shrink-0", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                suppressHydrationWarning
                ref={searchInputRef}
                type="text"
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          <ul className="max-h-60 overflow-auto py-1">
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500 text-center">
                {emptyMessage}
              </li>
            ) : (
              filteredOptions.map((option) => (
                <li
                  key={option.value}
                  className={cn(
                    "cursor-pointer select-none px-3 py-2 text-sm hover:bg-primary/10 focus:bg-primary/10",
                    value === option.value && "bg-primary/5 font-medium"
                  )}
                  onClick={() => handleSelect(option.value)}
                  role="option"
                  aria-selected={value === option.value}
                  title={option.description}
                >
                  <div>{option.label}</div>
                  {option.description && (
                    <div className="text-xs text-gray-500 mt-0.5 truncate">
                      {option.description}
                    </div>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
