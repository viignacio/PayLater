"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle, X } from "lucide-react"

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string | React.ReactNode
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = 'danger',
  isLoading = false
}: ConfirmationDialogProps) {
  if (!isOpen) return null

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: 'text-error-500',
          iconBg: 'bg-error-50',
          confirmVariant: 'destructive' as const,
          border: 'border-error-200'
        }
      case 'warning':
        return {
          icon: 'text-warning-500',
          iconBg: 'bg-warning-50',
          confirmVariant: 'warning' as const,
          border: 'border-warning-200'
        }
      case 'info':
        return {
          icon: 'text-primary-500',
          iconBg: 'bg-primary-50',
          confirmVariant: 'default' as const,
          border: 'border-primary-200'
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className={`bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border ${styles?.border} w-full max-w-sm sm:max-w-md transform transition-all duration-300 scale-100 max-h-[80vh] flex flex-col relative overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200/50">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 ${styles?.iconBg} rounded-xl flex items-center justify-center`}>
              <AlertTriangle className={`h-4 w-4 sm:h-5 sm:w-5 ${styles?.icon}`} />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 border border-gray-300 h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 rounded-full"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {typeof message === 'string' ? (
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              {message}
            </p>
          ) : (
            <div className="text-gray-600 text-sm sm:text-base leading-relaxed">
              {message}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 sm:p-6 border-t border-gray-200/50">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 order-2 sm:order-1"
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={styles?.confirmVariant || 'default'}
            onClick={onConfirm}
            className="flex-1 order-1 sm:order-2"
            isLoading={isLoading}
            disabled={isLoading}
          >
            {confirmText === 'Confirm' && isLoading ? "Processing..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
