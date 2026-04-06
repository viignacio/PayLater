"use client"

import { cn } from "@/lib/utils"
import { forwardRef, useState } from "react"
import { Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react"

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  helperText?: string
  icon?: React.ReactNode
  rightIcon?: React.ReactNode
  success?: boolean
  variant?: "default" | "filled" | "outlined"
  size?: "sm" | "default" | "lg"
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    error, 
    helperText, 
    icon, 
    rightIcon,
    success,
    variant = "default",
    size = "default",
    type = "text",
    className,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    
    const isPassword = type === "password"
    const inputType = isPassword && showPassword ? "text" : type
    
    const sizeClasses = {
      sm: "h-10 px-3 text-sm",
      default: "h-12 px-4 text-base",
      lg: "h-14 px-5 text-lg"
    }
    
    const iconSizeClasses = {
      sm: "h-4 w-4",
      default: "h-5 w-5",
      lg: "h-6 w-6"
    }
    
    const variants = {
      default: "bg-white/70 backdrop-blur-xl saturate-[180%] border border-white/30 focus:border-primary-500/50 focus:bg-white/90 shadow-soft",
      filled: "bg-neutral-50/80 backdrop-blur-md border border-neutral-200 focus:border-primary-500 focus:bg-white",
      outlined: "bg-transparent border-2 border-neutral-200 focus:border-primary-500 shadow-sm"
    }
    
    const hasError = !!error
    const hasSuccess = success && !hasError
    
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-neutral-700">
            {label}
            {props.required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative group">
          {icon && (
            <div className={cn(
              "absolute inset-y-0 left-0 flex items-center pointer-events-none transition-colors duration-200",
              size === "sm" ? "pl-3" : size === "lg" ? "pl-5" : "pl-4"
            )}>
              <div className={cn(
                "transition-colors duration-200",
                hasError ? "text-error-500" : hasSuccess ? "text-success-500" : isFocused ? "text-primary-500" : "text-neutral-400",
                iconSizeClasses[size]
              )}>
                {icon}
              </div>
            </div>
          )}
          
          <input
            ref={ref}
            type={inputType}
            className={cn(
              "w-full border rounded-2xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all duration-300",
              sizeClasses[size],
              variants[variant],
              icon && (size === "sm" ? "pl-10" : size === "lg" ? "pl-14" : "pl-12"),
              !icon && (size === "sm" ? "pl-3" : size === "lg" ? "pl-5" : "pl-4"),
              (rightIcon || isPassword) && (size === "sm" ? "pr-10" : size === "lg" ? "pr-14" : "pr-12"),
              !rightIcon && !isPassword && (size === "sm" ? "pr-3" : size === "lg" ? "pr-5" : "pr-4"),
              hasError && "border-error-500 focus:border-error-500 focus:ring-error-500/20",
              hasSuccess && "border-success-500 focus:border-success-500 focus:ring-success-500/20",
              "disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed",
              className
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          
          {/* Right side icons */}
          <div className={cn(
            "absolute inset-y-0 right-0 flex items-center",
            size === "sm" ? "pr-3" : size === "lg" ? "pr-5" : "pr-4"
          )}>
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-neutral-400 hover:text-neutral-600 transition-colors duration-200 focus:outline-none focus:text-primary-500"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className={iconSizeClasses[size]} />
                ) : (
                  <Eye className={iconSizeClasses[size]} />
                )}
              </button>
            )}
            
            {rightIcon && !isPassword && (
              <div className={cn(
                "transition-colors duration-200",
                hasError ? "text-error-500" : hasSuccess ? "text-success-500" : isFocused ? "text-primary-500" : "text-neutral-400",
                iconSizeClasses[size]
              )}>
                {rightIcon}
              </div>
            )}
            
            {/* Status icons */}
            {hasError && !rightIcon && !isPassword && (
              <AlertCircle className={cn("text-error-500", iconSizeClasses[size])} />
            )}
            
            {hasSuccess && !rightIcon && !isPassword && (
              <CheckCircle className={cn("text-success-500", iconSizeClasses[size])} />
            )}
          </div>
        </div>
        
        {(error || helperText) && (
          <div className="flex items-start space-x-1">
            {hasError && <AlertCircle className="h-4 w-4 text-error-500 mt-0.5 flex-shrink-0" />}
            {hasSuccess && <CheckCircle className="h-4 w-4 text-success-500 mt-0.5 flex-shrink-0" />}
            <p
              className={cn(
                "text-sm transition-all duration-200",
                hasError ? "text-error-600" : hasSuccess ? "text-success-600" : "text-neutral-500"
              )}
            >
              {error || helperText}
            </p>
          </div>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"
