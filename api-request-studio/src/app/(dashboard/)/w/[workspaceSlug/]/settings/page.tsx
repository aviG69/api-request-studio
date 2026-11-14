'use client'

import { useParams, useRouter } from 'next/navigation'
import { useWorkspaces, useUpdateWorkspace, useWorkspaceMembers, useInviteMember, useRemoveMember, useUpdateMemberRole, useWorkspaceInvitations, useDeleteInvitation } from '@/hooks/use-workspaces'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Plus, MoreVertical, Trash2, Mail, Loader2, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export default function WorkspaceSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const workspaceSlug = params.workspaceSlug as string

  const { data: workspaces } = useWorkspaces()
  const workspace = workspaces?.find((w: { slug: string }) => w.slug === workspaceSlug)
  const workspaceId = workspace?.id

  const { data: members, isLoading: membersLoading } = useWorkspaceMembers(workspaceId || '')
  const { data: invitations, isLoading: invitationsLoading } = useWorkspaceInvitations(workspaceId || '')

  const updateWorkspace = useUpdateWorkspace()
  const inviteMember = useInviteMember()
  const removeMember = useRemoveMember()
  const updateMemberRole = useUpdateMemberRole()
  const deleteInvitation = useDeleteInvitation()

  const [name, setName] = useState(workspace?.name || '')
  const [description, setDescription] = useState(workspace?.description || '')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'EDITOR' | 'VIEWER'>('EDITOR')
  const [isSaving, setIsSaving] = useState(false)
  const [isInviting, setIsInviting] = useState(false)

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workspaceId || isSaving) return

    setIsSaving(true)
    try {
      await updateWorkspace.mutateAsync({ id: workspaceId, data: { name, description } })
      router.refresh()
    } finally {
      setIsSaving(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workspaceId || !inviteEmail.trim() || isInviting) return

    setIsInviting(true)
    try {
      await inviteMember.mutateAsync({ workspaceId, data: { email: inviteEmail.trim(), role: inviteRole } })
      setInviteEmail('')
    } finally {
      setIsInviting(false)
    }
  }

  const handleRoleChange = async (memberId: string, role: 'ADMIN' | 'EDITOR' | 'VIEWER') => {
    if (!workspaceId) return
    await updateMemberRole.mutateAsync({ workspaceId, memberId, data: { role } })
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!workspaceId) return
    if (!confirm('Are you sure you want to remove this member?')) return
    await removeMember.mutateAsync({ workspaceId, memberId })
  }

  const handleDeleteInvitation = async (invitationId: string) => {
    if (!workspaceId) return
    if (!confirm('Are you sure you want to cancel this invitation?')) return
    await deleteInvitation.mutateAsync({ workspaceId, invitationId })
  }

  if (!workspace) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Workspace not found</h2>
          <p className="text-muted-foreground mt-1">The workspace you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your workspace settings and members</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveGeneral} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Workspace Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description"
                    disabled={isSaving}
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Members</CardTitle>
              <Button variant="outline" size="sm" onClick={() => (document.getElementById('invite-modal') as HTMLDialogElement)?.showModal()}>
                <Plus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : members && members.length > 0 ? (
                <div className="space-y-3">
                  {members.map((member: { id: string; user: { name: string | null; email: string; image: string | null }; role: string }) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.user.image || ''} alt={member.user.name || ''} />
                          <AvatarFallback>{member.user.name?.[0] || member.user.email[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.user.name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">{member.user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              {member.role}
                              <MoreVertical className="ml-1 h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() => handleRoleChange(member.id, 'ADMIN')}
                              className={cn(member.role === 'ADMIN' && 'bg-accent')}
                            >
                              Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => handleRoleChange(member.id, 'EDITOR')}
                              className={cn(member.role === 'EDITOR' && 'bg-accent')}
                            >
                              Editor
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => handleRoleChange(member.id, 'VIEWER')}
                              className={cn(member.role === 'VIEWER' && 'bg-accent')}
                            >
                              Viewer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => handleRemoveMember(member.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No members yet</p>
              )}
            </CardContent>
          </Card>

          {invitations && invitations.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Pending Invitations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invitations.map((invitation: { id: string; email: string; role: string; expiresAt: Date }) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{invitation.email}</p>
                          <p className="text-sm text-muted-foreground">
                            {invitation.role} • Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDeleteInvitation(invitation.id)}
                        disabled={invitationsLoading}
                      >
                        Cancel
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="danger">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Delete Workspace</h3>
                <p className="text-muted-foreground mb-4">
                  Permanently delete this workspace and all its collections, requests, environments, and history.
                  This action cannot be undone.
                </p>
                <Button variant="destructive" onClick={() => (document.getElementById('delete-modal') as HTMLDialogElement)?.showModal()}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Workspace
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Modal */}
      <dialog id="invite-modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box max-w-md">
          <h3 className="font-bold text-lg mb-4">Invite Member</h3>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="member@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                disabled={isInviting}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'ADMIN' | 'EDITOR' | 'VIEWER')}
                className="select select-bordered w-full"
                disabled={isInviting}
              >
                <option value="ADMIN">Admin</option>
                <option value="EDITOR">Editor</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="ghost" onClick={() => (document.getElementById('invite-modal') as HTMLDialogElement)?.close()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isInviting}>
                {isInviting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Send Invitation
              </Button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      {/* Delete Modal */}
      <dialog id="delete-modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box max-w-md">
          <h3 className="font-bold text-lg mb-4 text-destructive">Delete Workspace</h3>
          <p className="text-muted-foreground mb-4">
            Are you sure you want to delete "{workspace.name}"? This will permanently remove all collections,
            requests, environments, history, and member data. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => (document.getElementById('delete-modal') as HTMLDialogElement)?.close()}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => { /* TODO: implement delete */ }}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Workspace
            </Button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  )
}