"use client"

import React from "react"

export const AnimatedBackground: React.FC = () => {
  return (
    <>
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-indigo-300/25 to-purple-300/25 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-300/25 to-pink-300/25 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-gradient-to-r from-indigo-200/15 to-purple-200/15 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '4s' }} />
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-gradient-to-br from-emerald-200/20 to-teal-200/20 rounded-full blur-2xl animate-bounce-gentle" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-32 right-1/4 w-48 h-48 bg-gradient-to-br from-amber-200/20 to-orange-200/20 rounded-full blur-2xl animate-bounce-gentle" style={{ animationDelay: '3s' }} />
      </div>

      {/* Enhanced floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-32 h-32 border border-indigo-300/40 rounded-full animate-spin shadow-lg" style={{ animationDuration: '20s' }} />
        <div className="absolute bottom-20 left-20 w-24 h-24 border border-purple-300/40 rounded-full animate-spin shadow-lg" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
        <div className="absolute top-1/2 left-1/2 w-16 h-16 border border-pink-300/40 rounded-full animate-spin shadow-lg" style={{ animationDuration: '25s' }} />
        <div className="absolute top-1/3 right-1/3 w-20 h-20 border border-emerald-300/30 rounded-full animate-float shadow-md" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/3 left-1/3 w-12 h-12 border border-amber-300/30 rounded-full animate-bounce-gentle shadow-md" style={{ animationDuration: '6s' }} />
      </div>
    </>
  )
}
