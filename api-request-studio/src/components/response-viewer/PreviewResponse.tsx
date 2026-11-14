'use client'

import { useState, useRef, useEffect } from 'react'
import { Copy, Download, Maximize2, Minimize2, Image, Code, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PreviewResponseProps {
  data: any
  contentType: string
}

export function PreviewResponse({ data, contentType }: PreviewResponseProps) {
  const [iframeKey, setIframeKey] = useState(0)

  const isHtml = contentType.includes('text/html')
  const isImage = contentType.includes('image/')
  const isXml = contentType.includes('xml')
  const isJson = contentType.includes('application/json')
  const isText = contentType.includes('text/') || isJson || isXml

  const handleDownload = () => {
    let content: string
    let type: string
    let filename: string

    if (isHtml || isXml) {
      content = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
      type = isHtml ? 'text/html' : 'application/xml'
      filename = isHtml ? 'response.html' : 'response.xml'
    } else if (isJson) {
      content = JSON.stringify(data, null, 2)
      type = 'application/json'
      filename = 'response.json'
    } else {
      content = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
      type = 'text/plain'
      filename = 'response.txt'
    }

    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopy = () => {
    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
    navigator.clipboard.writeText(content)
  }

  const renderPreview = () => {
    if (isImage) {
      const imageUrl = typeof data === 'string' ? data : URL.createObjectURL(new Blob([data]))
      return (
        <div className="flex items-center justify-center h-full p-4">
          <img
            src={imageUrl}
            alt="Response image"
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      )
    }

    if (isHtml) {
      const htmlContent = typeof data === 'string' ? data : ''
      return (
        <div className="h-full">
          <iframe
            key={iframeKey}
            srcDoc={htmlContent}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            title="HTML Preview"
          />
        </div>
      )
    }

    if (isXml) {
      const xmlContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
      return (
        <div className="h-full p-4 font-mono text-sm overflow-auto bg-background">
          <pre className="whitespace-pre-wrap">{xmlContent}</pre>
        </div>
      )
    }

    if (isJson) {
      return (
        <div className="h-full p-4 font-mono text-sm overflow-auto bg-background">
          <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
        </div>
      )
    }

    if (isText) {
      const textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
      return (
        <div className="h-full p-4 font-mono text-sm overflow-auto bg-background">
          <pre className="whitespace-pre-wrap">{textContent}</pre>
        </div>
      )
    }

    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Preview not available for this content type</p>
          <p className="text-xs mt-1">{contentType || 'Unknown'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleCopy} className="h-8 w-8">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDownload} className="h-8 w-8">
            <Download className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isHtml && <Code className="h-4 w-4" />}
          {isImage && <Image className="h-4 w-4" />}
          {isXml && <FileText className="h-4 w-4" />}
          {isJson && <Code className="h-4 w-4" />}
          <span className="font-mono">{contentType || 'Unknown'}</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {renderPreview()}
      </div>
    </div>
  )
}