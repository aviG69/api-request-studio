'use client'

import { useState, useRef, useEffect } from 'react'
import { Copy, Download, Search, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Editor } from '@monaco-editor/react'

interface RawResponseProps {
  data: any
}

export function RawResponse({ data }: RawResponseProps) {
  const [rawString, setRawString] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const editorRef = useRef<any>(null)

  useEffect(() => {
    try {
      const str = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
      setRawString(str)
    } catch {
      setRawString(String(data))
    }
  }, [data])

  const handleCopy = () => {
    navigator.clipboard.writeText(rawString)
  }

  const handleDownload = () => {
    const blob = new Blob([rawString], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'response.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleSearch = () => {
    if (editorRef.current && searchQuery) {
      const editor = editorRef.current.getCodeEditor()
      if (editor) {
        const model = editor.getModel()
        if (model) {
          const match = model.findNextMatch(searchQuery, model.getPositionAt(0), true, true, null, true)
          if (match) {
            editor.setSelection(match.range)
            editor.revealRangeInCenter(match.range)
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
          defaultLanguage="plaintext"
          value={rawString}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            wordWrap: 'on',
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  )
}