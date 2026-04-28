import { useDeferredValue, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import AlbumList from '../components/AlbumList'
import SearchBox from '../components/SearchBox'
import {
  searchAlbums,
  type AlbumListItem,
} from '../lib/catalog/catalog'

type LoadState = 'loading' | 'ready' | 'error'

function AlbumsPage() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [albums, setAlbums] = useState<AlbumListItem[]>([])
  const [status, setStatus] = useState<LoadState>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      setStatus('loading')
      setError(null)

      void searchAlbums(deferredQuery)
        .then((result) => {
          if (!active) {
            return
          }

          setAlbums(result)
          setStatus('ready')
        })
        .catch((albumError: unknown) => {
          if (!active) {
            return
          }

          setError(
            albumError instanceof Error
              ? albumError.message
              : t('albums.unknownError'),
          )
          setAlbums([])
          setStatus('error')
        })
    }, 180)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [deferredQuery, t])

  return (
    <div className="advanced-search-screen">
      <section className="search-panel" aria-label={t('albums.toolbar')}>
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder={t('albums.searchPlaceholder')}
          autoFocus
        />
      </section>

      {status === 'error' ? (
        <div className="empty-state">
          <strong>{t('albums.catalogError')}</strong>
          <span>{error}</span>
        </div>
      ) : null}

      {status === 'ready' && albums.length === 0 ? (
        <div className="empty-state">{t('albums.noResults')}</div>
      ) : null}

      <AlbumList albums={albums} loading={status === 'loading'} />
    </div>
  )
}

export default AlbumsPage
