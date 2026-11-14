'use client'

import { ReactNode } from 'react'
import { AuthProvider } from './AuthProvider'
import { ThemeProvider } from './ThemeProvider'
import { QueryProvider } from './QueryProvider'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryProvider>{children}</QueryProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}