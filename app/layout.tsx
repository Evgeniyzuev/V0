'use client';

// import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'
import { Toaster } from "@/components/ui/sonner"
import { TonConnectUIProvider } from '@tonconnect/ui-react'

// Metadata export removed as this is now a client component
// export const metadata: Metadata = {
//   title: 'v0 App',
//   description: 'Created with v0',
//   generator: 'v0.dev',
// }

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <TonConnectUIProvider manifestUrl="/tonconnect-manifest.json">
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </TonConnectUIProvider>
      </body>
    </html>
  )
}
