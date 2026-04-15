import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PayLater - Split Expenses with Friends",
  description: "Track shared expenses per trip/event and split bills easily with PayLater.",
  keywords: ["expense tracker", "split bills", "group expenses", "trip expenses"],
  authors: [{ name: "PayLater Team" }],
  icons: {
    icon: "/paylater.png",
    shortcut: "/paylater.png",
    apple: "/paylater.png",
  },
  manifest: "/manifest.json",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563EB",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <ErrorBoundary>
            <header className="flex justify-end p-4 gap-4 bg-white/50 backdrop-blur-md border-b">
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">Sign In</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Sign Up</button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <UserButton afterSignOutUrl="/" />
              </Show>
            </header>
            <main>
              {children}
            </main>
          </ErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  )
}
