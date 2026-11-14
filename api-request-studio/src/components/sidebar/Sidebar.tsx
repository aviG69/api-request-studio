'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Folder, FileText, History, Settings, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  children?: ReactNode
}

const navigationItems = [
  { icon: Folder, label: 'Collections', href: '/w/' },
  { icon: History, label: 'History', href: '/w/history' },
  { icon: Settings, label: 'Environments', href: '/w/environments' },
]

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-card transition-all duration-200',
        isOpen ? 'w-64' : 'w-16'
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        {isOpen && (
          <span className="font-semibold text-lg">API Studio</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8"
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {isOpen && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search collections..."
              className="pl-9 h-9 text-sm"
            />
          </div>
        )}

        <ul className="space-y-1" role="list">
          {navigationItems.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isOpen ? '' : 'justify-center'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                {isOpen && <span>{item.label}</span>}
              </a>
            </li>
          ))}
        </ul>

        {isOpen && (
          <div className="border-t pt-3 mt-4">
            <Collapsible className="w-full">
              <CollapsibleTrigger
                asChild
                className={cn(
                  'w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
                  'hover:bg-accent hover:text-accent-foreground',
                  'text-muted-foreground'
                )}
              >
                <Plus className="h-5 w-5 flex-shrink-0" />
                <span>New Collection</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="w-full p-2">
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Folder className="h-4 w-4" />
                    Collection
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <FileText className="h-4 w-4" />
                    Request
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </nav>

      <div className="border-t p-3">
        {isOpen ? (
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={onToggle}>
            <ChevronLeft className="h-4 w-4" />
            <span>Collapse</span>
          </Button>
        ) : (
          <Button variant="ghost" className="w-full justify-center" onClick={onToggle}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </aside>
  )
}