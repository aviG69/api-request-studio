'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Collection, Request, CollectionVariable } from '@/types/collection'

const api = {
  collections: {
    list: (workspaceId: string) =>
      fetch(`/api/collections?workspaceId=${workspaceId}`).then((res) => res.json()),
    get: (id: string) => fetch(`/api/collections/${id}`).then((res) => res.json()),
    create: (data: { name: string; description?: string; workspaceId: string; parentId?: string }) =>
      fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
    update: (id: string, data: Partial<Collection>) =>
      fetch(`/api/collections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
    delete: (id: string) =>
      fetch(`/api/collections/${id}`, { method: 'DELETE' }).then((res) => res.json()),
    reorder: (items: Array<{ id: string; order: number; parentId?: string }>) =>
      fetch('/api/collections/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      }).then((res) => res.json()),
    variables: {
      list: (collectionId: string) =>
        fetch(`/api/collections/${collectionId}/variables`).then((res) => res.json()),
      create: (collectionId: string, data: { key: string; value: string; type: 'DEFAULT' | 'SECRET'; description?: string }) =>
        fetch(`/api/collections/${collectionId}/variables`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }).then((res) => res.json()),
      update: (collectionId: string, variableId: string, data: Partial<CollectionVariable>) =>
        fetch(`/api/collections/${collectionId}/variables/${variableId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }).then((res) => res.json()),
      delete: (collectionId: string, variableId: string) =>
        fetch(`/api/collections/${collectionId}/variables/${variableId}`, { method: 'DELETE' }).then((res) => res.json()),
    },
  },
  requests: {
    list: (collectionId: string) =>
      fetch(`/api/requests?collectionId=${collectionId}`).then((res) => res.json()),
    get: (id: string) => fetch(`/api/requests/${id}`).then((res) => res.json()),
    create: (data: { name: string; description?: string; method: string; url: string; headers?: any[]; queryParams?: any[]; body?: any; bodyType: string; auth?: any; settings?: any; collectionId: string }) =>
      fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
    update: (id: string, data: Partial<Request>) =>
      fetch(`/api/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
    delete: (id: string) =>
      fetch(`/api/requests/${id}`, { method: 'DELETE' }).then((res) => res.json()),
    execute: (data: any) =>
      fetch('/api/requests/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((res) => res.json()),
    history: (requestId: string) =>
      fetch(`/api/requests/${requestId}/history`).then((res) => res.json()),
  },
}

export function useCollections(workspaceId: string) {
  return useQuery({
    queryKey: ['collections', workspaceId],
    queryFn: () => api.collections.list(workspaceId),
    enabled: !!workspaceId,
  })
}

export function useCollection(id: string) {
  return useQuery({
    queryKey: ['collection', id],
    queryFn: () => api.collections.get(id),
    enabled: !!id,
  })
}

export function useCreateCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.collections.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collections', variables.workspaceId] })
      if (variables.parentId) {
        queryClient.invalidateQueries({ queryKey: ['collection', variables.parentId] })
      }
    },
  })
}

export function useUpdateCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Collection> }) => api.collections.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['collection', id] })
      queryClient.invalidateQueries({ queryKey: ['collections'] })
    },
  })
}

export function useDeleteCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.collections.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
    },
  })
}

export function useReorderCollections() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.collections.reorder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
    },
  })
}

export function useCollectionVariables(collectionId: string) {
  return useQuery({
    queryKey: ['collection', collectionId, 'variables'],
    queryFn: () => api.collections.variables.list(collectionId),
    enabled: !!collectionId,
  })
}

export function useCreateCollectionVariable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ collectionId, data }: { collectionId: string; data: { key: string; value: string; type: 'DEFAULT' | 'SECRET'; description?: string } }) =>
      api.collections.variables.create(collectionId, data),
    onSuccess: (_, { collectionId }) => {
      queryClient.invalidateQueries({ queryKey: ['collection', collectionId, 'variables'] })
    },
  })
}

export function useUpdateCollectionVariable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ collectionId, variableId, data }: { collectionId: string; variableId: string; data: Partial<CollectionVariable> }) =>
      api.collections.variables.update(collectionId, variableId, data),
    onSuccess: (_, { collectionId }) => {
      queryClient.invalidateQueries({ queryKey: ['collection', collectionId, 'variables'] })
    },
  })
}

export function useDeleteCollectionVariable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ collectionId, variableId }: { collectionId: string; variableId: string }) =>
      api.collections.variables.delete(collectionId, variableId),
    onSuccess: (_, { collectionId }) => {
      queryClient.invalidateQueries({ queryKey: ['collection', collectionId, 'variables'] })
    },
  })
}

export function useRequests(collectionId: string) {
  return useQuery({
    queryKey: ['requests', collectionId],
    queryFn: () => api.requests.list(collectionId),
    enabled: !!collectionId,
  })
}

export function useRequest(id: string) {
  return useQuery({
    queryKey: ['request', id],
    queryFn: () => api.requests.get(id),
    enabled: !!id,
  })
}

export function useCreateRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.requests.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['requests', variables.collectionId] })
      queryClient.invalidateQueries({ queryKey: ['collection', variables.collectionId] })
    },
  })
}

export function useUpdateRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Request> }) => api.requests.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['request', id] })
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}

export function useDeleteRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.requests.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    },
  })
}

export function useExecuteRequest() {
  return useMutation({
    mutationFn: api.requests.execute,
  })
}

export function useRequestHistory(requestId: string) {
  return useQuery({
    queryKey: ['request', requestId, 'history'],
    queryFn: () => api.requests.history(requestId),
    enabled: !!requestId,
  })
}