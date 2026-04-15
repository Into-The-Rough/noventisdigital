import { startTransition, useCallback, useEffect, useState } from 'react'
import {
  getCurrentClient,
  getQuotesForClient,
  portalMode,
  signInClient,
  signOutClient,
  subscribeToAuth,
} from '../lib/portalService'
import type { PortalClient, QuoteDocument } from '../types'

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.'
}

export function usePortalSession() {
  const [client, setClient] = useState<PortalClient | null>(null)
  const [quotes, setQuotes] = useState<QuoteDocument[]>([])
  const [booting, setBooting] = useState(true)
  const [quotesLoading, setQuotesLoading] = useState(false)
  const [portalError, setPortalError] = useState<string | null>(null)

  const loadQuotesForClient = useCallback(async (clientId: string) => {
    setQuotesLoading(true)

    try {
      const nextQuotes = await getQuotesForClient(clientId)

      startTransition(() => {
        setQuotes(nextQuotes)
        setPortalError(null)
      })
    } catch (error) {
      startTransition(() => {
        setQuotes([])
        setPortalError(getErrorMessage(error))
      })
    } finally {
      setQuotesLoading(false)
    }
  }, [])

  useEffect(() => {
    let isActive = true

    const initialise = async () => {
      try {
        const nextClient = await getCurrentClient()

        if (!isActive) {
          return
        }

        startTransition(() => {
          setClient(nextClient)
          setPortalError(null)
        })

        if (nextClient) {
          await loadQuotesForClient(nextClient.id)
        }
      } catch (error) {
        if (!isActive) {
          return
        }

        startTransition(() => {
          setClient(null)
          setQuotes([])
          setPortalError(getErrorMessage(error))
        })
      } finally {
        if (isActive) {
          setBooting(false)
        }
      }
    }

    void initialise()

    const unsubscribe = subscribeToAuth(async (nextClient) => {
      if (!isActive) {
        return
      }

      startTransition(() => {
        setClient(nextClient)
        setPortalError(null)
      })

      if (nextClient) {
        await loadQuotesForClient(nextClient.id)
      } else {
        startTransition(() => {
          setQuotes([])
        })
      }

      setBooting(false)
    })

    return () => {
      isActive = false
      unsubscribe()
    }
  }, [loadQuotesForClient])

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      const nextClient = await signInClient(email, password)

      if (portalMode === 'live') {
        return
      }

      startTransition(() => {
        setClient(nextClient)
        setPortalError(null)
      })

      await loadQuotesForClient(nextClient.id)
    },
    [loadQuotesForClient],
  )

  const handleLogout = useCallback(async () => {
    await signOutClient()

    if (portalMode === 'live') {
      return
    }

    startTransition(() => {
      setClient(null)
      setQuotes([])
      setPortalError(null)
    })
  }, [])

  return {
    client,
    quotes,
    booting,
    quotesLoading,
    portalError,
    portalMode,
    handleLogin,
    handleLogout,
  }
}
