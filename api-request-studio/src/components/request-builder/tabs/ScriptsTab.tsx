'use client'

import { useState } from 'react'
import { Play, Zap, Copy, FileCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Editor } from '@monaco-editor/react'

export function ScriptsTab() {
  const [preRequestScript, setPreRequestScript] = useState('')
  const [postResponseScript, setPostResponseScript] = useState('')

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <Tabs defaultValue="pre" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pre">
              <Zap className="mr-2 h-4 w-4" />
              Pre-request Script
            </TabsTrigger>
            <TabsTrigger value="post">
              <Play className="mr-2 h-4 w-4" />
              Post-response Script
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="pre" className="h-full">
          <TabsContent value="pre" className="h-full p-0">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b">
                <span className="text-sm font-medium">Pre-request Script</span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(preRequestScript)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { /* TODO: format */ }}>
                    <FileCode className="mr-2 h-4 w-4" />
                    Format
                  </Button>
                </div>
              </div>
              <Editor
                height="100%"
                defaultLanguage="javascript"
                value={preRequestScript}
                onChange={(e) => setPreRequestScript(e || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  automaticLayout: true,
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="post" className="h-full p-0">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b">
                <span className="text-sm font-medium">Post-response Script</span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(postResponseScript)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { /* TODO: format */ }}>
                    <FileCode className="mr-2 h-4 w-4" />
                    Format
                  </Button>
                </div>
              </div>
              <Editor
                height="100%"
                defaultLanguage="javascript"
                value={postResponseScript}
                onChange={(e) => setPostResponseScript(e || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  automaticLayout: true,
                }}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="p-4 border-t bg-muted/50">
        <p className="text-xs text-muted-foreground text-center">
          Scripts run in a sandboxed environment. Available globals: <code className="bg-muted px-1 rounded">pm</code>, <code className="bg-muted px-1 rounded">request</code>, <code className="bg-muted px-1 rounded">response</code>, <code className="bg-muted px-1 rounded">variables</code>
        </p>
      </div>
    </div>
  )
}