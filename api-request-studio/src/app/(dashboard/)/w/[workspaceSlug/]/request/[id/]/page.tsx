'use client'

import { useParams } from 'next/navigation'
import { RequestBuilder } from '@/components/request-builder/RequestBuilder'

export default function RequestPage() {
  const params = useParams()
  const requestId = params.id as string

  return (
    <div className="h-full">
      <RequestBuilder requestId={requestId} />
    </div>
  )
}