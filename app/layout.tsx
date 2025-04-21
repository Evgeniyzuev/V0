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
        <TonConnectUIProvider 
          // manifestUrl="https://blush-keen-constrictor-906.mypinata.cloud/ipfs/QmSBEGs7dqLGi5SAWGYfQpmp7uW8bWjy2KpiBiWSviWHRZ"
          manifestUrl="https://v0-psi-one.vercel.app/tonconnect-manifest.json"
          actionsConfiguration={{
            returnStrategy: 'back',
            twaReturnUrl: 'https://t.me/V0_aiassist_bot/V0app'
          }}
        >
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </TonConnectUIProvider>
      </body>
    </html>
  )
}
