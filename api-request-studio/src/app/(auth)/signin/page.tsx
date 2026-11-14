import { Suspense } from 'react'
import { SignInContent } from './SignInContent'

export default function SignInPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <SignInContent searchParams={searchParams} />
    </Suspense>
  )
}