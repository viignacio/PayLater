"use client"

import { Button } from "@/components/ui/button"
import { Sparkles, MapPin, ArrowRight } from "lucide-react"
import { SignInButton, SignUpButton, useClerk, Show } from "@clerk/nextjs"
import { AppHeader } from "@/components/layout/app-header"
import { AnimatedBackground } from "@/components/layout/animated-background"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"

export default function HomePage() {
  const searchParams = useSearchParams()
  const { openSignIn } = useClerk()

  useEffect(() => {
    if (searchParams.get("sign-in") === "true") {
      const redirectUrl = searchParams.get("redirect") || "/dashboard"
      openSignIn({
        forceRedirectUrl: redirectUrl,
      })
    }
  }, [searchParams, openSignIn])

  return (
    <>
      <AppHeader
        actions={
          <>
            <Show when="signed-out">
              <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/80 backdrop-blur-sm border border-white/20 hover:bg-white hover:shadow-lg transition-all duration-200"
                >
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                <Button
                  variant="default"
                  size="sm"
                  className="shadow-lg hover:shadow-indigo-500/25 transition-all duration-200"
                >
                  Sign Up
                </Button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard">
                <Button
                  variant="default"
                  size="sm"
                  className="shadow-lg hover:shadow-indigo-500/25 transition-all duration-200"
                >
                  Go to Dashboard
                </Button>
              </Link>
            </Show>
          </>
        }
        mobileActions={
          <>
            <Show when="signed-out">
              <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-white/80 backdrop-blur-sm border border-white/20 hover:bg-white hover:shadow-lg transition-all duration-200"
                >
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                <Button
                  variant="default"
                  className="w-full justify-start shadow-lg hover:shadow-indigo-500/25 transition-all duration-200"
                >
                  Sign Up
                </Button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard" className="w-full">
                <Button
                  variant="default"
                  className="w-full justify-start shadow-lg hover:shadow-indigo-500/25 transition-all duration-200"
                >
                  Go to Dashboard
                </Button>
              </Link>
            </Show>
          </>
        }
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-purple-50/40 relative overflow-hidden">
        <AnimatedBackground />
        
        <div className="relative z-10">
          <main className="max-w-7xl mx-auto py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl mb-8 shadow-lg animate-bounce-gentle">
                <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-indigo-600" />
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent mb-8 animate-fade-in leading-tight">
                Travel Together. 
                <br />
                Split Better.
              </h1>
              <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto mb-12 animate-fade-in-delay leading-relaxed">
                The most beautiful way to track shared expenses and settle up with friends. 
                Keep the memories, lose the math.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-delay">
                <Show when="signed-out">
                  <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                    <Button size="lg" className="h-14 px-8 text-lg font-semibold group">
                      Get Started for Free
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </SignUpButton>
                  <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                    <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold bg-white/50 backdrop-blur-md">
                      Sign In
                    </Button>
                  </SignInButton>
                </Show>
                <Show when="signed-in">
                  <Link href="/dashboard">
                    <Button size="lg" className="h-14 px-8 text-lg font-semibold group">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </Show>
              </div>
            </div>

            {/* Feature preview */}
            <div className="mt-24 sm:mt-32 max-w-5xl mx-auto">
              <div className="glass-premium rounded-[2.5rem] p-8 sm:p-12 shadow-glow relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-purple-50/50" />
                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                  <div className="flex-1 text-center lg:text-left">
                    <div className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-50 rounded-full text-indigo-600 text-sm font-semibold mb-6">
                      <MapPin className="h-4 w-4" />
                      <span>Built for Adventures</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                      Designed for modern groups
                    </h2>
                    <ul className="space-y-4 text-left inline-block">
                      {[
                        "Create trips in seconds",
                        "Add members with simple QR codes",
                        "Track expenses in any currency",
                        "Beautiful Settlement visualizations"
                      ].map((feature, i) => (
                        <li key={i} className="flex items-center text-gray-600">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex-1 w-full max-w-md bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-xl transform transition-transform duration-500 group-hover:scale-[1.02] group-hover:-rotate-1">
                    <div className="space-y-4">
                      <div className="h-8 bg-white/60 rounded-xl w-3/4 animate-pulse" />
                      <div className="h-32 bg-indigo-100/40 rounded-2xl w-full flex items-center justify-center">
                        <MapPin className="h-12 w-12 text-indigo-400 opacity-50" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-white/60 rounded-lg w-full" />
                        <div className="h-4 bg-white/60 rounded-lg w-5/6" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
