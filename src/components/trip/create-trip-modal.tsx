"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, MapPin, Calendar } from "lucide-react"
import { useLockBodyScroll } from "@/hooks/use-lock-body-scroll"

interface CreateTripModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateTrip: (tripData: {
    name: string
    description?: string
    startDate?: string
    endDate?: string
  }) => void
}

export function CreateTripModal({ isOpen, onClose, onCreateTrip }: CreateTripModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tripDate: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setIsLoading(true)
    try {
      await onCreateTrip({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        startDate: formData.tripDate || undefined,
      })

      // Reset form
      setFormData({ name: "", description: "", tripDate: "" })
      onClose()
    } catch (error) {
      console.error("Error creating trip:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Prevent body scroll when modal is open
    useLockBodyScroll(isOpen)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-2xl rounded-3xl sm:rounded-4xl shadow-3xl border border-white/30 w-full max-w-sm sm:max-w-md transform transition-all duration-500 scale-100 max-h-[80vh] flex flex-col relative overflow-hidden">
        {/* Decorative background gradient */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-green-50/30 via-transparent to-emerald-50/30 rounded-3xl sm:rounded-4xl" />
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-green-200/20 to-emerald-200/20 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-gradient-to-br from-emerald-200/20 to-teal-200/20 rounded-full blur-2xl" />
        
        {/* Empty header space - 16px on mobile, 32px on desktop */}
        <div className="h-4 sm:h-8 flex-shrink-0"></div>
        
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto modal-scroll px-4 sm:px-8 min-h-0 relative z-10">
          {/* Enhanced Header */}
          <div className="flex items-center justify-between pb-4 sm:pb-6 border-b border-gray-200/50">
            <div className="flex items-center min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0 shadow-lg">
                <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Create New Trip</h2>
                <p className="text-xs sm:text-sm text-gray-500 font-medium">Start your next adventure</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 border border-gray-300 h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 rounded-full"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>

          {/* Enhanced Form */}
          <form onSubmit={handleSubmit} className="pt-2 sm:pt-3 space-y-5 sm:space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-800 mb-3">
              Trip Name *
            </label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="e.g., Summer Vacation 2024"
              className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-800 mb-3">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Optional description of your trip..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none text-sm sm:text-base transition-all duration-200"
              rows={3}
            />
          </div>

          <div>
            <label htmlFor="tripDate" className="block text-sm font-semibold text-gray-800 mb-3">
              Trip Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="tripDate"
                type="date"
                value={formData.tripDate}
                onChange={(e) => handleInputChange("tripDate", e.target.value)}
                placeholder="mm/dd/yyyy"
                className="w-full h-12 pl-12 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base bg-white transition-all duration-200 placeholder-gray-400 text-center"
              />
            </div>
          </div>

          {/* Enhanced Actions */}
          <div className="flex flex-col sm:flex-row gap-4 py-8">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 order-2 sm:order-1 h-12 font-semibold"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 order-1 sm:order-2 h-12 font-semibold shadow-lg hover:shadow-xl"
              disabled={isLoading || !formData.name.trim()}
              isLoading={isLoading}
            >
              <MapPin className="mr-2 h-4 w-4" />
              Create Trip
            </Button>
          </div>
          </form>
        </div>
      </div>
    </div>
  )
}
