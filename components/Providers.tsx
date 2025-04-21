'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { UserProvider, useUser } from '@/components/UserContext'
import WelcomeModal from '@/components/welcome-modal'
import { TonConnectUIProvider } from '@tonconnect/ui-react'

// Manifest URL for your application
const manifestUrl = '/tonconnect-manifest.json'

function WelcomeModalWrapper() {
  const { showWelcomeModal, closeWelcomeModal } = useUser()
  return <WelcomeModal isOpen={showWelcomeModal} onClose={closeWelcomeModal} />
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          {children}
          <WelcomeModalWrapper />
        </UserProvider>
      </QueryClientProvider>
    </TonConnectUIProvider>
  )
} 