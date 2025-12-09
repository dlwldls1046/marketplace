'use client'

import { Header } from './Header'
import { Providers } from '@/components/providers/Providers'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <Header />
      <main className="min-h-screen p-8">
        {children}
      </main>
    </Providers>
  )
}
