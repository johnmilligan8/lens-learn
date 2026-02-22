"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { Drawer } from "vaul"
import { cn } from "@/lib/utils"

// Hook to detect mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(() => window.innerWidth < 768);
  React.useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return isMobile;
}

// Context to share open state and value between Select parts
const SelectMobileContext = React.createContext(null);

// We need to intercept the Radix Select to extract items for the drawer
const Select = ({ children, value, defaultValue, onValueChange, open, onOpenChange, ...props }) => {
  const isMobile = useIsMobile();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [currentValue, setCurrentValue] = React.useState(value ?? defaultValue ?? '');

  // Sync controlled value
  React.useEffect(() => {
    if (value !== undefined) setCurrentValue(value);
  }, [value]);

  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;

  const handleValueChange = (v) => {
    setCurrentValue(v);
    onValueChange?.(v);
    if (isMobile) setIsOpen(false);
  };

  if (!isMobile) {
    return (
      <SelectPrimitive.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        open={open}
        onOpenChange={onOpenChange}
        {...props}
      >
        {children}
      </SelectPrimitive.Root>
    );
  }

  return (
    <SelectMobileContext.Provider value={{ isOpen, setIsOpen, currentValue, handleValueChange }}>
      <SelectPrimitive.Root
        value={currentValue}
        onValueChange={handleValueChange}
        open={false}
        onOpenChange={() => {}}
        {...props}
      >
        {children}
      </SelectPrimitive.Root>
    </SelectMobileContext.Provider>
  );
};

const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
  const mobileCtx = React.useContext(SelectMobileContext);

  if (mobileCtx) {
    return (
      <button
        ref={ref}
        type="button"
        onClick={() => mobileCtx.setIsOpen(true)}
        className={cn(
          "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
    );
  }

  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});
SelectTrigger.displayName = "SelectTrigger";

const SelectScrollUpButton = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}>
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}>
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

// Extract items from children recursively for the drawer
function extractItems(children, onSelect, currentValue) {
  return React.Children.map(children, (child) => {
    if (!child) return null;
    // SelectItem
    if (child.props && child.props.__selectItemValue !== undefined) {
      return child;
    }
    // Try to detect SelectItem by displayName
    if (child.type?.displayName === 'SelectItem' || child.type === SelectItem) {
      const val = child.props.value;
      const isSelected = val === currentValue;
      return (
        <button
          key={val}
          className={cn(
            "flex w-full items-center justify-between px-4 py-3 text-sm rounded-lg transition-colors",
            isSelected
              ? "bg-accent text-accent-foreground font-medium"
              : "text-popover-foreground hover:bg-accent/50"
          )}
          onClick={() => onSelect(val)}
        >
          <span>{child.props.children}</span>
          {isSelected && <Check className="h-4 w-4" />}
        </button>
      );
    }
    // SelectLabel / SelectSeparator pass-through as text
    if (child.type === SelectLabel || child.type?.displayName === 'SelectLabel') {
      return <p className="px-4 pt-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{child.props.children}</p>;
    }
    if (child.type === SelectSeparator || child.type?.displayName === 'SelectSeparator') {
      return <div className="my-1 h-px bg-border mx-4" />;
    }
    // SelectGroup - recurse
    if (child.props?.children) {
      return extractItems(child.props.children, onSelect, currentValue);
    }
    return null;
  });
}

const SelectContent = React.forwardRef(({ className, children, position = "popper", ...props }, ref) => {
  const mobileCtx = React.useContext(SelectMobileContext);

  if (mobileCtx) {
    return (
      <Drawer.Root open={mobileCtx.isOpen} onOpenChange={mobileCtx.setIsOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-popover border border-border shadow-xl outline-none"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="mx-auto mt-3 mb-2 h-1 w-10 rounded-full bg-muted-foreground/30" />
            <div className="overflow-y-auto max-h-[70vh] px-2 pb-4">
              {extractItems(children, mobileCtx.handleValueChange, mobileCtx.currentValue)}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn("p-1", position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]")}>
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});
SelectContent.displayName = "SelectContent";

const SelectLabel = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props} />
));
SelectLabel.displayName = "SelectLabel";

const SelectItem = React.forwardRef(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}>
    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = "SelectItem";

const SelectSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props} />
));
SelectSeparator.displayName = "SelectSeparator";

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}