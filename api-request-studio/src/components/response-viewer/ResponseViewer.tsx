'use client'

import { useState } from 'react'
import { Copy, Download, Search, Table, FileText, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PrettyResponse } from './PrettyResponse'
import { RawResponse } from './RawResponse'
import { PreviewResponse } from './PreviewResponse'
import { TableResponse } from './TableResponse'
import { ResponseHeader } from './ResponseHeader'
import { cn } from '@/lib/utils'

interface ResponseViewerProps {
  response: {
    status: number
    statusText: string
    headers: Record<string, string>
    body: any
    timing: any
    responseTime: number
  }
}

export function ResponseViewer({ response }: ResponseViewerProps) {
  const [activeTab, setActiveTab] = useState<'pretty' | 'raw' | 'preview' | 'table'>('pretty')
  const [isExpanded, setIsExpanded] = useState(false)

  const contentType = response.headers['content-type'] || response.headers['Content-Type'] || ''
  const isJson = contentType.includes('application/json')
  const isHtml = contentType.includes('text/html')
  const isXml = contentType.includes('xml')
  const isImage = contentType.includes('image/')
  const isArray = Array.isArray(response.body)

  return (
    <div className={cn('flex flex-col border-t bg-background', isExpanded && 'fixed inset-0 z-50')}>
      {/* Response Header */}
      <ResponseHeader
        response={response}
        onToggleExpand={() => setIsExpanded(!isExpanded)}
        isExpanded={isExpanded}
      />

      {/* Response Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'pretty' | 'raw' | 'preview' | 'table')} className="h-full">
          <TabsList className="h-10 border-b bg-muted/50">
            <TabsTrigger value="pretty" disabled={!isJson && !isXml}>
              <FileText className="mr-2 h-4 w-4" />
              Pretty
            </TabsTrigger>
            <TabsTrigger value="raw">
              <FileText className="mr-2 h-4 w-4" />
              Raw
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={!isHtml && !isImage && !isXml}>
              <Table className="mr-2 h-4 w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="table" disabled={!isArray}>
              <Table className="mr-2 h-4 w-4" />
              Table
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pretty" className="h-[calc(100%-40px)] p-0">
            <PrettyResponse data={response.body} />
          </TabsContent>

          <TabsContent value="raw" className="h-[calc(100%-40px)] p-0">
            <RawResponse data={response.body} />
          </TabsContent>

          <TabsContent value="preview" className="h-[calc(100%-40px)] p-0">
            <PreviewResponse data={response.body} contentType={contentType} />
          </TabsContent>

          <TabsContent value="table" className="h-[calc(100%-40px)] p-0">
            <TableResponse data={response.body} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}