'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Workspace, WorkspaceMember } from '@/types/workspace'

const api = {
  workspaces: {
    list: () => fetch('/api/workspaces').then((res) => res.json()),
    get: (id: string) => fetch(`/api/workspaces/${id}`).then((res) => res.json()),
    create: (data: { name: string; description?: string }) =>
      fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
    update: (id: string, data: Partial<Workspace>) =>
      fetch(`/api/workspaces/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
    delete: (id: string) =>
      fetch(`/api/workspaces/${id}`, { method: 'DELETE' }).then((res) => res.json()),
    members: {
      list: (workspaceId: string) =>
        fetch(`/api/workspaces/${workspaceId}/members`).then((res) => res.json()),
      invite: (workspaceId: string, data: { email: string; role: string }) =>
        fetch(`/api/workspaces/${workspaceId}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }).then((res) => res.json()),
      update: (workspaceId: string, memberId: string, data: { role: string }) =>
        fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }).then((res) => res.json()),
      remove: (workspaceId: string, memberId: string) =>
        fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, { method: 'DELETE' }).then(
          (res) => res.json()
        ),
    },
    invitations: {
      list: (workspaceId: string) =>
        fetch(`/api/workspaces/${workspaceId}/invitations`).then((res) => res.json()),
      create: (workspaceId: string, data: { email: string }) =>
        fetch(`/api/workspaces/${workspaceId}/invitations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }).then((res) => res.json()),
      resend: (workspaceId: string, data: { email: string }) =>
        fetch(`/api/workspaces/${workspaceId}/invitations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }).then((res) => res.json()),
      delete: (workspaceId: string, invitationId: string) =>
        fetch(`/api/workspaces/${workspaceId}/invitations?invitationId=${invitationId}`, {
          method: 'DELETE',
        }).then((res) => res.json()),
    },
  },
}

export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: api.workspaces.list,
  })
}

export function useWorkspace(id: string) {
  return useQuery({
    queryKey: ['workspace', id],
    queryFn: () => api.workspaces.get(id),
    enabled: !!id,
  })
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.workspaces.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Workspace> }) =>
      api.workspaces.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      queryClient.invalidateQueries({ queryKey: ['workspace', id] })
    },
  })
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.workspaces.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })
}

export function useWorkspaceMembers(workspaceId: string) {
  return useQuery({
    queryKey: ['workspace', workspaceId, 'members'],
    queryFn: () => api.workspaces.members.list(workspaceId),
    enabled: !!workspaceId,
  })
}

export function useInviteMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ workspaceId, data }: { workspaceId: string; data: { email: string; role: string } }) =>
      api.workspaces.members.invite(workspaceId, data),
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'members'] })
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'invitations'] })
    },
  })
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      workspaceId,
      memberId,
      data,
    }: {
      workspaceId: string
      memberId: string
      data: { role: string }
    }) => api.workspaces.members.update(workspaceId, memberId, data),
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'members'] })
    },
  })
}

export function useRemoveMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ workspaceId, memberId }: { workspaceId: string; memberId: string }) =>
      api.workspaces.members.remove(workspaceId, memberId),
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'members'] })
    },
  })
}

export function useWorkspaceInvitations(workspaceId: string) {
  return useQuery({
    queryKey: ['workspace', workspaceId, 'invitations'],
    queryFn: () => api.workspaces.invitations.list(workspaceId),
    enabled: !!workspaceId,
  })
}

export function useCreateInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ workspaceId, data }: { workspaceId: string; data: { email: string } }) =>
      api.workspaces.invitations.create(workspaceId, data),
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'invitations'] })
    },
  })
}

export function useDeleteInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ workspaceId, invitationId }: { workspaceId: string; invitationId: string }) =>
      api.workspaces.invitations.delete(workspaceId, invitationId),
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'invitations'] })
    },
  })
}