
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { useBranding } from "@/contexts/BrandingContext";

// Classic buttonVariants for compatibility (used by other components)
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98]",
        outline: "border border-input bg-background hover:bg-secondary hover:text-secondary-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-secondary hover:text-secondary-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        brand: "bg-brand text-brand-foreground hover:bg-brand/90 active:scale-[0.98]",
        success: "bg-success text-success-foreground hover:bg-success/90 active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const buttonBase = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "brand" | "success";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

const sizeClasses = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-md px-3",
  lg: "h-11 rounded-md px-8",
  icon: "h-10 w-10",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, style, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const { branding } = useBranding();

    // Dynamic style for each variant
    let dynamicStyle: React.CSSProperties = {};
    let dynamicClass = "";
    switch (variant) {
      case "default":
        dynamicStyle = {
          background: branding.btn_primary_bg_color,
          color: branding.btn_primary_text_color,
        };
        dynamicClass = "hover:opacity-90 active:scale-[0.98]";
        break;
      case "outline":
        dynamicStyle = {
          background: branding.btn_secondary_bg_color,
          color: branding.btn_secondary_text_color,
          borderColor: branding.btn_secondary_border_color,
        };
        dynamicClass = "border hover:bg-secondary hover:text-secondary-foreground";
        break;
      case "secondary":
        dynamicStyle = {
          background: branding.btn_secondary_bg_color,
          color: branding.btn_secondary_text_color,
        };
        dynamicClass = "hover:opacity-90";
        break;
      case "ghost":
        dynamicStyle = {
          background: "transparent",
          color: branding.btn_primary_bg_color,
        };
        dynamicClass = "hover:bg-secondary hover:text-secondary-foreground";
        break;
      case "link":
        dynamicStyle = {
          background: "none",
          color: branding.link_color,
        };
        dynamicClass = "underline-offset-4 hover:underline";
        break;
      case "destructive":
        dynamicStyle = {
          background: branding.danger_color,
          color: branding.btn_primary_text_color,
        };
        dynamicClass = "hover:opacity-90 active:scale-[0.98]";
        break;
      case "brand":
        dynamicStyle = {
          background: branding.primary_color,
          color: branding.btn_primary_text_color,
        };
        dynamicClass = "hover:opacity-90 active:scale-[0.98]";
        break;
      case "success":
        dynamicStyle = {
          background: branding.success_color,
          color: branding.btn_primary_text_color,
        };
        dynamicClass = "hover:opacity-90 active:scale-[0.98]";
        break;
      default:
        break;
    }

    // Disabled state
    if (props.disabled) {
      dynamicStyle.background = branding.btn_disabled_bg_color;
      dynamicStyle.color = branding.btn_disabled_text_color;
      dynamicClass += " opacity-60 cursor-not-allowed";
    }

    // Hover state for default/outline/secondary
    // (for inline style, you may need to use onMouseEnter/onMouseLeave for more advanced effects)

    return (
      <Comp
        className={cn(buttonBase, sizeClasses[size], dynamicClass, className)}
        style={{ ...dynamicStyle, ...style }}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
