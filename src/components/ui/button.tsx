import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "success" | "warning"
  size?: "default" | "sm" | "lg" | "icon" | "xs"
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = "default", 
    size = "default", 
    isLoading = false, 
    leftIcon,
    rightIcon,
    children, 
    disabled,
    ...props 
  }, ref) => {
    const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-2xl font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 relative overflow-hidden group"
    
    const variants = {
      default: "bg-primary-600/95 backdrop-blur-md border border-white/20 text-white shadow-soft hover:shadow-glow hover:bg-primary-600 transform hover:-translate-y-0.5",
      destructive: "bg-error-500/95 backdrop-blur-md border border-white/20 text-white shadow-soft hover:bg-error-600 hover:shadow-xl hover:-translate-y-0.5",
      outline: "border border-primary-400/40 bg-transparent backdrop-blur-sm text-primary-600 hover:bg-primary-500/10 hover:border-primary-400/80 hover:shadow-medium hover:-translate-y-0.5",
      secondary: "bg-white/80 backdrop-blur-xl border border-white/40 text-neutral-800 hover:bg-white/90 hover:shadow-medium hover:-translate-y-0.5",
      ghost: "text-neutral-600 hover:bg-white/10 hover:text-neutral-900 transition-all duration-200",
      link: "text-primary-600 underline-offset-4 hover:underline hover:text-primary-700 transition-all duration-200",
      success: "bg-success-500/95 backdrop-blur-md border border-white/20 text-white shadow-soft hover:bg-success-600 hover:shadow-xl hover:-translate-y-0.5",
      warning: "bg-warning-500/95 backdrop-blur-md border border-white/20 text-white shadow-soft hover:bg-warning-600 hover:shadow-xl hover:-translate-y-0.5"
    }
    
    const sizes = {
      xs: "h-8 px-3 text-xs min-h-[32px]",
      sm: "h-10 px-4 text-sm min-h-[40px]",
      default: "h-12 px-6 text-base min-h-[48px]",
      lg: "h-14 px-8 text-lg min-h-[56px]",
      icon: "h-10 w-10 min-h-[40px] min-w-[40px]"
    }
    
    const isDisabled = disabled || isLoading
    
    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          isDisabled ? "hover:scale-100 hover:shadow-lg hover:-translate-y-0" : "",
          className
        )}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {/* Shimmer effect overlay */}
        {!isDisabled && !isLoading ? (
          <div className="absolute inset-0 -top-1 -left-1 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer transition-opacity duration-300" />
        ) : null}
        
        {/* Loading overlay */}
        {isLoading ? (
          <div className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : null}
        
        {/* Content */}
        <span className={cn("relative z-10 flex items-center", isLoading ? "opacity-0" : "")}>
          {leftIcon && !isLoading ? (
            <span className="mr-2 transition-transform duration-200 group-hover:scale-110">{leftIcon}</span>
          ) : null}
          
          {children}
          
          {rightIcon && !isLoading ? (
            <span className="ml-2 transition-transform duration-200 group-hover:scale-110">{rightIcon}</span>
          ) : null}
        </span>
      </button>
    )
  }
)

Button.displayName = "Button"

export { Button }
