'use client'

import { useSession } from 'next-auth/react'
import { useWorkspaces, useCreateWorkspace } from '@/hooks/use-workspaces'
import { Plus, ChevronDown, Check, Building2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function WorkspaceSwitcher() {
  const { data: session } = useSession()
  const { data: workspaces, isLoading } = useWorkspaces()
  const createWorkspace = useCreateWorkspace()
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const currentWorkspace = workspaces?.[0]

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWorkspaceName.trim() || isCreating) return

    setIsCreating(true)
    try {
      await createWorkspace.mutateAsync({ name: newWorkspaceName.trim() })
      setNewWorkspaceName('')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-9 w-auto min-w-[180px] justify-between gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : currentWorkspace ? (
            <>
              <Building2 className="h-4 w-4" />
              <span className="truncate">{currentWorkspace.name}</span>
            </>
          ) : (
            <span className="text-muted-foreground">No workspace</span>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center justify-between">
            <span>Workspaces</span>
          </div>
        </DropdownMenuLabel>

        <form onSubmit={handleCreateWorkspace} className="p-2">
          <div className="flex gap-2">
            <Input
              placeholder="New workspace name"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              className="flex-1"
              disabled={isCreating}
            />
            <Button type="submit" size="sm" disabled={isCreating || !newWorkspaceName.trim()}>
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        </form>

        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
            Loading workspaces...
          </div>
        ) : workspaces && workspaces.length > 0 ? (
          <>
            {workspaces.map((workspace: { id: string; name: string; slug: string }) => (
              <DropdownMenuItem
                key={workspace.id}
                onSelect={() => (window.location.href = `/w/${workspace.slug}`)}
                className={cn(
                  'flex items-center gap-2',
                  currentWorkspace?.id === workspace.id && 'bg-accent'
                )}
              >
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="truncate flex-1">{workspace.name}</span>
                {currentWorkspace?.id === workspace.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </>
        ) : (
          <DropdownMenuItem className="text-center text-muted-foreground py-4">
            No workspaces yet. Create one above.
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => (window.location.href = '/settings')}
          className="text-sm"
        >
          Workspace Settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}