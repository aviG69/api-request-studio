'use client'

import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Edit2, Copy, Eye, EyeOff, Check, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Environment {
  id: string
  name: string
  workspaceId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  variables: EnvironmentVariable[]
}

interface EnvironmentVariable {
  id: string
  key: string
  value: string
  type: 'DEFAULT' | 'SECRET'
  description: string | null
  environmentId: string
}

export default function EnvironmentsPage() {
  const params = useParams()
  const workspaceSlug = params.workspaceSlug as string

  const queryClient = useQueryClient()

  const { data: workspaces } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => fetch('/api/workspaces').then((res) => res.json()),
  })

  const workspace = workspaces?.find((w: any) => w.slug === workspaceSlug)

  const { data: environments, isLoading } = useQuery({
    queryKey: ['environments', workspace?.id],
    queryFn: async () => {
      if (!workspace?.id) return []
      const res = await fetch(`/api/environments?workspaceId=${workspace.id}`)
      return res.json()
    },
    enabled: !!workspace?.id,
  })

  const createEnvironment = useMutation({
    mutationFn: (data: { name: string; workspaceId: string }) =>
      fetch('/api/environments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['environments', workspace?.id] })
    },
  })

  const updateEnvironment = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Environment> }) =>
      fetch(`/api/environments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['environments', workspace?.id] })
    },
  })

  const deleteEnvironment = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/environments/${id}`, { method: 'DELETE' }).then((res) => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['environments', workspace?.id] })
    },
  })

  const [newEnvName, setNewEnvName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [editingEnv, setEditingEnv] = useState<Environment | null>(null)
  const [editName, setEditName] = useState('')

  const handleCreateEnvironment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEnvName.trim() || !workspace?.id || isCreating) return
    setIsCreating(true)
    try {
      await createEnvironment.mutateAsync({ name: newEnvName.trim(), workspaceId: workspace.id })
      setNewEnvName('')
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdateEnvironment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEnv || !editName.trim()) return
    await updateEnvironment.mutateAsync({ id: editingEnv.id, data: { name: editName.trim() } })
    setEditingEnv(null)
    setEditName('')
  }

  const handleDeleteEnvironment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this environment?')) return
    await deleteEnvironment.mutateAsync(id)
  }

  const handleSetActive = async (env: Environment) => {
    await updateEnvironment.mutateAsync({ id: env.id, data: { isActive: !env.isActive } })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Environments</h1>
          <p className="text-muted-foreground">Manage environment variables for your requests</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Environment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create Environment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateEnvironment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="env-name">Name</Label>
                <Input
                  id="env-name"
                  value={newEnvName}
                  onChange={(e) => setNewEnvName(e.target.value)}
                  placeholder="e.g., Development, Staging, Production"
                  autoFocus
                  disabled={isCreating}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setNewEnvName('')} disabled={isCreating}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating || !newEnvName.trim()}>
                  {isCreating ? 'Creating...' : 'Create Environment'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : environments && environments.length > 0 ? (
        <Tabs defaultValue="environments" className="space-y-6">
          <TabsList>
            <TabsTrigger value="environments">Environments ({environments.length})</TabsTrigger>
            <TabsTrigger value="globals">Globals</TabsTrigger>
          </TabsList>

          <TabsContent value="environments">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {environments.map((env: Environment) => (
                <Card key={env.id} className={cn(env.isActive && 'ring-2 ring-primary')}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {env.name}
                      {env.isActive && <Badge variant="default" className="text-xs">Active</Badge>}
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setEditingEnv(env)} onClick={() => setEditName(env.name)}>
                          <Edit2 className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleSetActive(env)}>
                          {env.isActive ? 'Deactivate' : 'Set Active'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onSelect={() => handleDeleteEnvironment(env.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {env.variables?.length || 0} variables
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => { /* TODO: open variable editor */ }}>
                        Manage Variables
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="globals">
            <Card>
              <CardHeader>
                <CardTitle>Global Variables</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Global variables apply to all environments</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">No environments yet</p>
          <Button onClick={() => setNewEnvName('Development')}>
            <Plus className="mr-2 h-4 w-4" />
            Create your first environment
          </Button>
        </Card>
      )}

      {/* Edit Environment Dialog */}
      <Dialog open={!!editingEnv} onOpenChange={(open) => !open && setEditingEnv(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Environment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateEnvironment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-env-name">Name</Label>
              <Input
                id="edit-env-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditingEnv(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!editName.trim()}>
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}