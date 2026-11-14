import { Suspense } from 'react'
import { AuthErrorContentWrapper } from './AuthErrorContentWrapper'

export default function AuthErrorPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const promise = searchParams.then((params) => params.error || 'Default')

  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <AuthErrorContentWrapper promise={promise} />
    </Suspense>
  )
}