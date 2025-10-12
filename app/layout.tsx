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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <style>{`
          .mobile-textarea {
            font-size: 16px !important;
            -webkit-text-size-adjust: 100%;
            -webkit-user-select: text;
            user-select: text;
            transform-origin: 0 0;
          }
          .mobile-container {
            -webkit-text-size-adjust: 100%;
          }
          textarea:focus, input:focus {
            -webkit-user-select: text;
            user-select: text;
            outline: none;
            transform: scale(1) !important;
          }
          /* Prevent zoom on input focus for iOS */
          @media screen and (max-width: 767px) {
            textarea, input {
              font-size: 16px !important;
              transform-origin: 0 0;
            }
          }
        `}</style>
      </head>
      <body>
        <TonConnectUIProvider 
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
