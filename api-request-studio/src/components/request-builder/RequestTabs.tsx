'use client'

import { ParamsTab } from './tabs/ParamsTab'
import { AuthTab } from './tabs/AuthTab'
import { HeadersTab } from './tabs/HeadersTab'
import { BodyTab } from './tabs/BodyTab'
import { ScriptsTab } from './tabs/ScriptsTab'
import type { Request } from '@/types/collection'

interface RequestTabsProps {
  activeTab: 'params' | 'auth' | 'headers' | 'body' | 'scripts'
  request: Request
  onUpdate: (updates: Partial<Request>) => void
}

export function RequestTabs({ activeTab, request, onUpdate }: RequestTabsProps) {
  switch (activeTab) {
    case 'params':
      return <ParamsTab queryParams={request.queryParams || []} onUpdate={(params) => onUpdate({ queryParams: params })} />
    case 'auth':
      return <AuthTab auth={request.auth} onUpdate={(auth) => onUpdate({ auth })} />
    case 'headers':
      return <HeadersTab headers={request.headers || []} onUpdate={(headers) => onUpdate({ headers })} />
    case 'body':
      return <BodyTab body={request.body} bodyType={request.bodyType} onUpdate={(body, bodyType) => onUpdate({ body, bodyType })} />
    case 'scripts':
      return <ScriptsTab />
    default:
      return null
  }
}