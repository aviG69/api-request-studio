'use client'

import { useState } from 'react'
import { useRequest, useUpdateRequest, useExecuteRequest } from '@/hooks/use-collections'
import { RequestTabs } from './RequestTabs'
import { ResponseViewer } from '@/components/response-viewer/ResponseViewer'
import { Send, Loader2, Save, Copy, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { Request, HttpMethod, BodyType } from '@/types/collection'

interface RequestBuilderProps {
  requestId: string
}

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']
const BODY_TYPES: BodyType[] = ['NONE', 'JSON', 'FORM_DATA', 'URLENCODED', 'RAW', 'BINARY', 'GRAPHQL']

const methodColors: Record<HttpMethod, string> = {
  GET: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  POST: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  PUT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  PATCH: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  HEAD: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  OPTIONS: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
}

export function RequestBuilder({ requestId }: RequestBuilderProps) {
  const { data: request, isLoading } = useRequest(requestId)
  const updateRequest = useUpdateRequest()
  const executeRequest = useExecuteRequest()

  const [method, setMethod] = useState<HttpMethod>(request?.method || 'GET')
  const [url, setUrl] = useState(request?.url || '')
  const [activeTab, setActiveTab] = useState<'params' | 'auth' | 'headers' | 'body' | 'scripts'>('params')
  const [isExecuting, setIsExecuting] = useState(false)
  const [response, setResponse] = useState<any>(null)

  const handleSend = async () => {
    if (!url.trim()) return

    setIsExecuting(true)
    try {
      const result = await executeRequest.mutateAsync({
        method,
        url,
        headers: request?.headers || [],
        queryParams: request?.queryParams || [],
        body: request?.body,
        bodyType: request?.bodyType || 'NONE',
        auth: request?.auth,
        settings: request?.settings,
      })
      setResponse(result)
    } catch (error) {
      console.error('Request failed:', error)
    } finally {
      setIsExecuting(false)
    }
  }

  const handleSave = async () => {
    if (!request) return
    await updateRequest.mutateAsync({
      id: requestId,
      data: { method, url },
    })
  }

  const handleUpdateRequest = (updates: Partial<Request>) => {
    updateRequest.mutate({ id: requestId, data: updates })
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!request) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Request not found</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Request Bar */}
      <div className="flex items-center gap-2 border-b bg-card p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'h-10 w-24 justify-center font-medium',
                methodColors[method]
              )}
            >
              {method}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {HTTP_METHODS.map((m) => (
              <DropdownMenuItem
                key={m}
                onSelect={() => setMethod(m)}
                className={cn(method === m && 'bg-accent')}
              >
                {m}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="relative flex-1">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL (e.g., https://api.example.com/users)"
            className="h-10 text-sm font-mono pl-10"
            disabled={isExecuting}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSave}
            disabled={isExecuting}
          >
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>

          <Button
            onClick={handleSend}
            disabled={isExecuting || !url.trim()}
            className="h-10 px-6"
            style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            {isExecuting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send
              </>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => { /* TODO: duplicate */ }}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => { /* TODO: code gen */ }}>
                Code Generation
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'params' | 'auth' | 'headers' | 'body' | 'scripts')} className="border-b">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="params">Params</TabsTrigger>
          <TabsTrigger value="auth">Auth</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="scripts">Scripts</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        <RequestTabs
          activeTab={activeTab}
          request={request}
          onUpdate={handleUpdateRequest}
        />
      </div>

      {/* Response Viewer */}
      {response && (
        <div className="border-t h-[400px]">
          <ResponseViewer response={response} />
        </div>
      )}
    </div>
  )
}