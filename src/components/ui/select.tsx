

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

type SelectContextType = {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  displayLabel: string;
  setDisplayLabel: (label: string) => void;
};

const SelectContext = React.createContext<SelectContextType | undefined>(undefined);

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

const Select: React.FC<SelectProps> = ({ value, onValueChange, children, className }) => {
  const [open, setOpen] = React.useState(false);
  const [displayLabel, setDisplayLabel] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const contextValue = React.useMemo(() => ({
    value,
    onValueChange,
    open,
    setOpen,
    displayLabel,
    setDisplayLabel
  }), [value, onValueChange, open, displayLabel]);

  return (
    <SelectContext.Provider value={contextValue}>
      <div ref={containerRef} className={cn("relative w-full", className)}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => {
    const ctx = React.useContext(SelectContext);
    if (!ctx) throw new Error("SelectTrigger must be used within a Select");

    return (
      <button
        ref={ref}
        suppressHydrationWarning
        className={cn(
          "flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50",
          className
        )}
        type="button"
        onClick={() => ctx.setOpen(!ctx.open)}
        {...props}
      >
        {children}
        <ChevronDown className={cn("h-4 w-4 transition-transform ml-2 flex-shrink-0", ctx.open && "rotate-180")} />
      </button>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

interface SelectValueProps {
  placeholder?: string;
}

const SelectValue: React.FC<SelectValueProps> = ({ placeholder = "Pilih..." }) => {
  const ctx = React.useContext(SelectContext);
  if (!ctx) throw new Error("SelectValue must be used within a Select");
  
  return <span className="truncate text-gray-700">{ctx.displayLabel || placeholder}</span>;
};

const SelectContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const ctx = React.useContext(SelectContext);
  if (!ctx) throw new Error("SelectContent must be used within a Select");

  if (!ctx.open) return null;

  return (
    <ul
      className={cn(
        "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white py-1 text-sm shadow-lg focus:outline-none",
        className
      )}
    >
      {children}
    </ul>
  );
};

const SelectItem: React.FC<{ value: string; children: React.ReactNode; className?: string }> = ({ value, children, className }) => {
  const ctx = React.useContext(SelectContext);
  if (!ctx) throw new Error("SelectItem must be used within a Select");

  const handleSelect = () => {
    // Store display label before updating value
    const label = typeof children === "string" ? children : String(children);
    ctx.setDisplayLabel(label);
    ctx.onValueChange(value);
    ctx.setOpen(false);
  };

  // Store label when component renders if it's the current value
  React.useEffect(() => {
    if (ctx.value === value) {
      const label = typeof children === "string" ? children : String(children);
      ctx.setDisplayLabel(label);
    }
  }, [ctx, value, children]);

  return (
    <li
      className={cn(
        "cursor-pointer select-none px-3 py-2 hover:bg-primary/10 focus:bg-primary/10",
        ctx.value === value && "bg-primary/5 font-medium",
        className
      )}
      onClick={handleSelect}
      role="option"
      aria-selected={ctx.value === value}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleSelect();
        }
      }}
    >
      {children}
    </li>
  );
};

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
