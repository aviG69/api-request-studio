import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const workspaceId = searchParams.get('workspaceId')
  const search = searchParams.get('search')
  const method = searchParams.get('method')
  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId required' }, { status: 400 })
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { members: true },
  })

  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  const isMember = workspace.members.some((m) => m.userId === session.user!.id)
  if (!isMember) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const where: any = {
    workspaceId,
    userId: session.user.id,
  }

  if (search) {
    where.OR = [
      { url: { contains: search, mode: 'insensitive' } },
      { headers: { path: '$', string_contains: search } },
      { body: { path: '$', string_contains: search } },
    ]
  }

  if (method && method !== 'all') {
    where.method = method
  }

  if (status && status !== 'all') {
    if (status === 'error') {
      where.error = { not: null }
    } else if (status === '2xx') {
      where.statusCode = { gte: 200, lt: 300 }
    } else if (status === '3xx') {
      where.statusCode = { gte: 300, lt: 400 }
    } else if (status === '4xx') {
      where.statusCode = { gte: 400, lt: 500 }
    } else if (status === '5xx') {
      where.statusCode = { gte: 500, lt: 600 }
    }
  }

  const [items, total] = await Promise.all([
    prisma.requestHistory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.requestHistory.count({ where }),
  ])

  return NextResponse.json({ items, total, limit, offset })
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const historyId = searchParams.get('id')

  if (!historyId) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  const history = await prisma.requestHistory.findUnique({
    where: { id: historyId },
  })

  if (!history) {
    return NextResponse.json({ error: 'History item not found' }, { status: 404 })
  }

  if (history.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.requestHistory.delete({ where: { id: historyId } })

  return NextResponse.json({ success: true })
}