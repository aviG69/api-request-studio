'use client'

import { AuthErrorContent } from './AuthErrorContent'

export async function AuthErrorContentWrapper({ promise }: { promise: Promise<string> }) {
  const error = await promise
  return <AuthErrorContent error={error} />
}