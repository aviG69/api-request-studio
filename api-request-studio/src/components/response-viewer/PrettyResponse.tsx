'use client'

import { useState, useRef, useEffect } from 'react'
import { Copy, Search, ChevronRight, ChevronDown, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Editor } from '@monaco-editor/react'

interface PrettyResponseProps {
  data: any
}

export function PrettyResponse({ data }: PrettyResponseProps) {
  const [jsonString, setJsonString] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const editorRef = useRef<any>(null)

  useEffect(() => {
    try {
      const formatted = JSON.stringify(data, null, 2)
      setJsonString(formatted)
    } catch {
      setJsonString('Unable to format response as JSON')
    }
  }, [data])

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString)
  }

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'response.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSearch = () => {
    if (editorRef.current && searchQuery) {
      const editor = editorRef.current.getCodeEditor()
      if (editor) {
        const matches = []
        const model = editor.getModel()
        if (model) {
          let match = model.findNextMatch(searchQuery, model.getPositionAt(0), true, true, null, true)
          while (match) {
            matches.push(match.range)
            match = model.findNextMatch(searchQuery, match.range.getEndPosition(), true, true, null, true)
          }
        }
      }
    }
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
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search... (Ctrl+F)"
            className="h-8"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button variant="ghost" size="icon" onClick={handleSearch} className="h-8 w-8">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Editor
          onMount={(editor, monaco) => { editorRef.current = editor; }}
          height="100%"
          defaultLanguage="json"
          value={jsonString}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            wordWrap: 'on',
            automaticLayout: true,
            folding: true,
            renderLineHighlight: 'line',
          }}
        />
      </div>
    </div>
  )
}