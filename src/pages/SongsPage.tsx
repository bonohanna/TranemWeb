import { useDeferredValue, useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import SearchBox from '../components/SearchBox'
import SongList from '../components/SongList'
import {
  advancedSearchSongs,
  getSongsByIdsForSearch,
  type SongListItem,
} from '../lib/catalog/catalog'
import { useUserLibraryStore } from '../stores/userLibraryStore'

type LoadState = 'loading' | 'ready' | 'error'

function SongsPage() {
  const { t } = useTranslation()
  const [songName, setSongName] = useState('')
  const [songWords, setSongWords] = useState('')
  const [singerName, setSingerName] = useState('')
  const [albumName, setAlbumName] = useState('')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const deferredSongName = useDeferredValue(songName)
  const deferredSongWords = useDeferredValue(songWords)
  const deferredSingerName = useDeferredValue(singerName)
  const deferredAlbumName = useDeferredValue(albumName)
  const favoriteSongIds = useUserLibraryStore((state) => state.favoriteSongIds)
  const playCounts = useUserLibraryStore((state) => state.playCounts)
  const [songs, setSongs] = useState<SongListItem[]>([])
  const [status, setStatus] = useState<LoadState>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      setStatus('loading')
      setError(null)

      const searchParams = {
        songName: deferredSongName,
        songWords: deferredSongWords,
        singerName: deferredSingerName,
        albumName: deferredAlbumName,
      }
      const localPlayedSongIds = Object.entries(playCounts)
        .filter(([, count]) => count > 0)
        .map(([songId]) => Number(songId))
      const localPrioritySongIds = [...favoriteSongIds, ...localPlayedSongIds]

      void Promise.all([
        advancedSearchSongs(searchParams),
        getSongsByIdsForSearch(localPrioritySongIds, searchParams),
      ])
        .then(([result, localSongs]) => {
          if (!active) {
            return
          }

          const mergedSongs = new Map<number, SongListItem>()
          result.songs.forEach((song) => mergedSongs.set(song.id, song))
          localSongs.forEach((song) => mergedSongs.set(song.id, song))

          setSongs([...mergedSongs.values()])
          setStatus('ready')
        })
        .catch((searchError: unknown) => {
          if (!active) {
            return
          }

          setError(
            searchError instanceof Error
              ? searchError.message
              : t('songs.unknownError'),
          )
          setSongs([])
          setStatus('error')
        })
    }, 180)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [
    deferredAlbumName,
    deferredSingerName,
    deferredSongName,
    deferredSongWords,
    favoriteSongIds,
    playCounts,
    t,
  ])

  return (
    <div className="advanced-search-screen">
      <section className="search-panel" aria-label={t('songs.toolbar')}>
        <SearchBox
          value={songName}
          onChange={setSongName}
          placeholder={t('songs.searchTitle')}
          autoFocus
        />

        <button
          type="button"
          className="advanced-toggle"
          onClick={() => setAdvancedOpen((value) => !value)}
        >
          <ChevronDown
            size={16}
            className={advancedOpen ? 'advanced-toggle__icon is-open' : 'advanced-toggle__icon'}
          />
          {t('songs.advancedSearch')}
        </button>

        {advancedOpen ? (
          <div className="advanced-fields">
            <SearchBox
              value={songWords}
              onChange={setSongWords}
              placeholder={t('songs.searchBody')}
            />
            <div className="advanced-fields__row">
              <SearchBox
                value={singerName}
                onChange={setSingerName}
                placeholder={t('songs.singerName')}
              />
              <SearchBox
                value={albumName}
                onChange={setAlbumName}
                placeholder={t('songs.albumName')}
              />
            </div>
          </div>
        ) : null}
      </section>

      {status === 'error' ? (
        <div className="empty-state">
          <strong>{t('songs.catalogError')}</strong>
          <span>{error}</span>
        </div>
      ) : null}

      {status === 'ready' && songs.length === 0 ? (
        <div className="empty-state">
          {t('songs.noResults')}
        </div>
      ) : null}

      <SongList songs={songs} loading={status === 'loading'} />
    </div>
  )
}

export default SongsPage
