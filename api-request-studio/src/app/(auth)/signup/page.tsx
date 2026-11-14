import { Suspense } from 'react'
import { SignUpContent } from './SignUpContent'

export default function SignUpPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <SignUpContent searchParams={searchParams} />
    </Suspense>
  )
}