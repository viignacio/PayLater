"use client"

import React, { useState, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useClickOutside } from "@/hooks/use-click-outside"

interface AppHeaderProps {
  actions?: React.ReactNode
  mobileActions?: React.ReactNode
}

export const AppHeader: React.FC<AppHeaderProps> = ({ actions, mobileActions }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  useClickOutside(mobileMenuRef, () => setIsMobileMenuOpen(false))

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/20 shadow-medium" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          <div className="flex items-center min-w-0 flex-1">
            <div className="relative group mr-3 sm:mr-4">
              <Image src="/paylater.png" alt="PayLater Logo" width={32} height={32} priority className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent truncate">
                PayLater
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 font-medium hidden sm:block">
                Split expenses with friends
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Mobile Menu Button */}
            {mobileActions && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden h-8 w-8 sm:h-10 sm:w-10 text-gray-700 hover:text-gray-900 hover:bg-gray-200/50"
              >
                {isMobileMenuOpen ? (
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </Button>
            )}
            
            {/* Desktop Menu Items */}
            <div className="hidden md:flex items-center space-x-3">
              {actions}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && mobileActions && (
        <div ref={mobileMenuRef} className="md:hidden fixed top-16 sm:top-20 left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-white/20 shadow-lg z-40">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4">
            <div className="flex flex-col space-y-3" onClick={() => setIsMobileMenuOpen(false)}>
              {mobileActions}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
