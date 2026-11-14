import { Suspense } from 'react'
import { notFound } from 'next/navigation'

interface AuthErrorPageProps {
  searchParams: Promise<{ error?: string }>
}

function AuthErrorContent({ error }: { error: string }) {
  const errorMessages: Record<string, string> = {
    Configuration: 'There is a problem with the server configuration.',
    AccessDenied: 'Access was denied. You may not have permission to sign in.',
    Verification: 'The verification link has expired or has already been used.',
    OAuthSignin: 'Error starting the OAuth sign-in process.',
    OAuthCallback: 'Error in the OAuth callback handler.',
    OAuthCreateAccount: 'Could not create OAuth account.',
    EmailCreateAccount: 'Could not create email account.',
    Callback: 'Error in the OAuth callback handler.',
    OAuthAccountNotLinked: 'This email is already associated with another account.',
    EmailSignin: 'Error sending the email sign-in link.',
    CredentialsSignin: 'Sign in failed. Check your credentials.',
    SessionRequired: 'Please sign in to access this page.',
    Default: 'An error occurred during authentication.',
  }

  const message = errorMessages[error] || errorMessages.Default

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm">
        <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-center text-2xl font-bold text-gray-900 mb-2">Authentication Error</h1>
        <p className="text-center text-gray-600 mb-6">{message}</p>
        <div className="space-y-3">
          <a
            href="/auth/signin"
            className="block w-full rounded-md bg-indigo-600 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </a>
          <a
            href="/"
            className="block w-full rounded-md border border-gray-300 px-4 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  )
}

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const params = await searchParams
  const error = params.error || 'Default'

  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <AuthErrorContent error={error} />
    </Suspense>
  )
}