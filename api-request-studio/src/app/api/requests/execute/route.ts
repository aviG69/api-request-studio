import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const executeRequestSchema = z.object({
  requestId: z.string().cuid().optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']),
  url: z.string().url(),
  headers: z.array(z.object({ key: z.string(), value: z.string(), enabled: z.boolean().default(true) })).default([]),
  queryParams: z.array(z.object({ key: z.string(), value: z.string(), enabled: z.boolean().default(true) })).default([]),
  body: z.any().optional(),
  bodyType: z.enum(['NONE', 'JSON', 'FORM_DATA', 'URLENCODED', 'RAW', 'BINARY', 'GRAPHQL']).default('NONE'),
  auth: z.any().optional(),
  settings: z.object({
    timeout: z.number().int().positive().max(300000).default(30000),
    followRedirects: z.boolean().default(true),
    sslVerification: z.boolean().default(true),
  }).default({ timeout: 30000, followRedirects: true, sslVerification: true }),
})

function buildUrl(url: string, queryParams: Array<{ key: string; value: string; enabled: boolean }>) {
  const urlObj = new URL(url)
  queryParams
    .filter((p) => p.enabled && p.key)
    .forEach((p) => urlObj.searchParams.append(p.key, p.value))
  return urlObj.toString()
}

function buildHeaders(
  headers: Array<{ key: string; value: string; enabled: boolean }>,
  bodyType: string,
  body: any
) {
  const headerObj: Record<string, string> = {}

  headers
    .filter((h) => h.enabled && h.key)
    .forEach((h) => {
      headerObj[h.key] = h.value
    })

  if (body && bodyType !== 'NONE' && bodyType !== 'FORM_DATA' && !headerObj['Content-Type']) {
    const contentTypes: Record<string, string> = {
      JSON: 'application/json',
      URLENCODED: 'application/x-www-form-urlencoded',
      RAW: 'text/plain',
      GRAPHQL: 'application/json',
    }
    if (contentTypes[bodyType]) {
      headerObj['Content-Type'] = contentTypes[bodyType]
    }
  }

  return headerObj
}

function buildBody(body: any, bodyType: string) {
  if (!body || bodyType === 'NONE') return null

  switch (bodyType) {
    case 'JSON':
      return JSON.stringify(body)
    case 'URLENCODED':
      return new URLSearchParams(body).toString()
    case 'RAW':
      return typeof body === 'string' ? body : JSON.stringify(body)
    case 'GRAPHQL':
      return JSON.stringify({ query: body.query, variables: body.variables })
    default:
      return null
  }
}

async function executeFetch(
  url: string,
  method: string,
  headers: Record<string, string>,
  body: string | null,
  settings: { timeout: number; followRedirects: boolean; sslVerification: boolean } = { timeout: 30000, followRedirects: true, sslVerification: true }
) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), settings.timeout)

  const startTime = performance.now()
  const timing = { dns: 0, tcp: 0, tls: 0, ttfb: 0, download: 0 }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body || undefined,
      redirect: settings.followRedirects ? 'follow' : 'manual',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const endTime = performance.now()
    timing.ttfb = endTime - startTime

    const responseStart = performance.now()
    const responseBody = await response.text()
    const responseEnd = performance.now()
    timing.download = responseEnd - responseStart

    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseBody,
      timing,
      responseTime: Math.round(endTime - startTime),
    }
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = executeRequestSchema.parse(body)

    const finalUrl = buildUrl(data.url, data.queryParams)
    const headers = buildHeaders(data.headers, data.bodyType, data.body)
    const requestBody = buildBody(data.body, data.bodyType)

    const result = await executeFetch(
      finalUrl,
      data.method,
      headers,
      requestBody,
      data.settings
    )

    let responseBody: any = result.body
    try {
      responseBody = JSON.parse(result.body)
    } catch {
      // Keep as text
    }

    // Save to history
    await prisma.requestHistory.create({
      data: {
        userId: session.user!.id!,
        requestId: data.requestId ?? undefined,
        workspaceId: '', // Will be filled from request if requestId provided
        method: data.method,
        url: finalUrl,
        headers: data.headers as any,
        queryParams: data.queryParams as any,
        body: data.body as any,
        bodyType: data.bodyType,
        auth: data.auth as any,
        statusCode: result.status,
        statusText: result.statusText,
        responseHeaders: result.headers as any,
        responseBody: responseBody as any,
        responseTime: result.responseTime,
        timing: result.timing as any,
      },
    })

    return NextResponse.json({
      status: result.status,
      statusText: result.statusText,
      headers: result.headers,
      body: responseBody,
      timing: result.timing,
      responseTime: result.responseTime,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 })
    }

    const errorMessage = error instanceof Error ? error.message : 'Request failed'

    // Save error to history
    if (session?.user) {
      try {
        await prisma.requestHistory.create({
          data: {
            userId: session.user!.id!,
            workspaceId: '',
            method: 'GET' as const,
            url: '',
            headers: [] as any,
            queryParams: [] as any,
            body: undefined,
            bodyType: 'NONE',
            auth: undefined,
            statusCode: null,
            statusText: null,
            responseHeaders: undefined,
            responseBody: undefined,
            responseTime: null,
            timing: undefined,
            error: errorMessage,
          },
        })
      } catch {
        // Ignore history save errors
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}