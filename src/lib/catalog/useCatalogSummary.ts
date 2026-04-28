import { useEffect, useState } from 'react'
import { getCatalogSummary, type CatalogSummary } from './catalog'

interface CatalogSummaryState {
  loading: boolean
  data: CatalogSummary | null
  error: string | null
}

export function useCatalogSummary() {
  const [state, setState] = useState<CatalogSummaryState>({
    loading: true,
    data: null,
    error: null,
  })

  useEffect(() => {
    let active = true

    void getCatalogSummary()
      .then((data) => {
        if (!active) {
          return
        }

        setState({
          loading: false,
          data,
          error: null,
        })
      })
      .catch((error: unknown) => {
        if (!active) {
          return
        }

        setState({
          loading: false,
          data: null,
          error: error instanceof Error ? error.message : 'Unknown catalog error',
        })
      })

    return () => {
      active = false
    }
  }, [])

  return state
}
