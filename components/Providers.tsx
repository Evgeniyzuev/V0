'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { UserProvider, useUser } from '@/components/UserContext'
import WelcomeModal from '@/components/welcome-modal'
import { TonPriceProvider } from '@/contexts/TonPriceContext'

function WelcomeModalWrapper() {
  const { showWelcomeModal, closeWelcomeModal } = useUser()
  return <WelcomeModal isOpen={showWelcomeModal} onClose={closeWelcomeModal} />
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <TonPriceProvider>
          {children}
          <WelcomeModalWrapper />
        </TonPriceProvider>
      </UserProvider>
    </QueryClientProvider>
  )
} 