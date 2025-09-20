import { getServerSession } from 'next-auth'
import { authConfig } from './auth-config'
import { NextRequest } from 'next/server'

export interface AuthenticatedSession {
  user: {
    id: string
    email: string
    name?: string
    image?: string
  }
}

export async function getAuthenticatedSession(request?: NextRequest): Promise<AuthenticatedSession | null> {
  try {
    const session = await getServerSession(authConfig)
    
    if (!session || !session.user) {
      return null
    }

    return {
      user: {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.name || undefined,
        image: session.user.image || undefined
      }
    }
  } catch (error) {
    console.error('Error getting authenticated session:', error)
    return null
  }
}

export async function requireAuth(request?: NextRequest): Promise<AuthenticatedSession> {
  const session = await getAuthenticatedSession(request)
  
  if (!session) {
    throw new Error('Authentication required')
  }
  
  return session
}

export function createAuthResponse(message: string, status: number = 401) {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
}