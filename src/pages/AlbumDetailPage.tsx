import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Heart, Play, Users } from 'lucide-react'
import {
  ANDROID_PLACEHOLDER_URL,
  default as AlbumArtwork,
} from '../components/AlbumArtwork'
import SongList from '../components/SongList'
import TeamDetailRow, { type ContributorLink } from '../components/TeamDetailRow'
import {
  getAlbumById,
  getAlbumImageUrl,
  getSongsByAlbumId,
  type AlbumListItem,
  type SongListItem,
} from '../lib/catalog/catalog'
import { useUserLibraryStore } from '../stores/userLibraryStore'

type LoadState = 'loading' | 'ready' | 'missing' | 'error'

function AlbumDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { albumId } = useParams()
  const numericAlbumId = Number(albumId)
  const [album, setAlbum] = useState<AlbumListItem | null>(null)
  const [songs, setSongs] = useState<SongListItem[]>([])
  const [status, setStatus] = useState<LoadState>('loading')
  const [error, setError] = useState<string | null>(null)
  const favoriteAlbumIds = useUserLibraryStore((state) => state.favoriteAlbumIds)
  const toggleFavoriteAlbum = useUserLibraryStore((state) => state.toggleFavoriteAlbum)
  const albumPlayCounts = useUserLibraryStore((state) => state.albumPlayCounts)

  useEffect(() => {
    let active = true

    void Promise.all([
      getAlbumById(numericAlbumId),
      getSongsByAlbumId(numericAlbumId),
    ])
      .then(([albumResult, songResults]) => {
        if (!active) {
          return
        }

        setAlbum(albumResult)
        setSongs(songResults)
        setStatus(albumResult ? 'ready' : 'missing')
      })
      .catch((albumError: unknown) => {
        if (!active) {
          return
        }

        setError(
          albumError instanceof Error ? albumError.message : t('albums.unknownError'),
        )
        setStatus('error')
      })

    return () => {
      active = false
    }
  }, [numericAlbumId, t])

  if (status === 'loading' || album?.id !== numericAlbumId) {
    return <div className="empty-state">{t('albums.loading')}</div>
  }

  if (status === 'missing' || !album) {
    return (
      <div className="empty-state">
        <strong>{t('albums.notFound')}</strong>
        <button type="button" className="text-button" onClick={() => navigate(-1)}>
          {t('songDetail.backToSongs')}
        </button>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="empty-state">
        <strong>{t('albums.catalogError')}</strong>
        <span>{error}</span>
      </div>
    )
  }

  const imageUrl = getAlbumImageUrl(album.image)
  const singerName = songs[0]?.singerName ?? ''
  const isFavorite = album.catalogIsFavorite || favoriteAlbumIds.includes(album.id)
  const totalPlayCount = album.catalogPlayCount + (albumPlayCounts[album.id] ?? 0)
  const teamRows = [
    {
      label: t('songDetail.singer'),
      contributors: uniqueContributors(
        songs,
        'singer',
        (song) => song.singerId,
        (song) => song.singerName,
      ),
    },
    {
      label: t('songDetail.poet'),
      contributors: uniqueContributors(
        songs,
        'poet',
        (song) => song.poetId,
        (song) => song.poetName,
      ),
    },
    {
      label: t('songDetail.composer'),
      contributors: uniqueContributors(
        songs,
        'composer',
        (song) => song.composerId,
        (song) => song.composerName,
      ),
    },
    {
      label: t('songDetail.distributer'),
      contributors: uniqueContributors(
        songs,
        'distributer',
        (song) => song.distributerId,
        (song) => song.distributerName,
      ),
    },
  ]
  const hasTeam = teamRows.some((row) => row.contributors.length > 0)

  return (
    <article className="album-detail">
      <img
        className="album-detail__background"
        src={imageUrl ?? ANDROID_PLACEHOLDER_URL}
        alt=""
        onError={(event) => {
          event.currentTarget.src = ANDROID_PLACEHOLDER_URL
        }}
      />

      <section className="album-detail__hero">
        <AlbumArtwork
          imageUrl={imageUrl}
          alt={album.name}
          className="album-detail__art"
          iconSize={72}
        />

        <div className="album-detail__copy">
          <h1>{album.name}</h1>
          {singerName ? <p>{singerName}</p> : null}

          <div className="album-detail__actions">
            <button
              type="button"
              className="favorite-large"
              onClick={() => toggleFavoriteAlbum(album.id)}
              title={isFavorite ? t('albums.removeFavorite') : t('albums.addFavorite')}
            >
              <Heart size={38} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>

            {totalPlayCount > 0 ? (
              <span className="display-play-count">
                <Play size={17} fill="currentColor" />
                {totalPlayCount}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <section className="album-detail__songs-section">
        <div className="section-label">
          <span />
          <h2>{t('albums.songsList')}</h2>
          <span />
        </div>
        <p className="album-detail__songs-count">
          {t('albums.songsCount', { count: songs.length || album.songCount })}
        </p>

        {songs.length === 0 ? (
          <div className="empty-state">{t('songs.noResults')}</div>
        ) : null}

        <SongList songs={songs} showSinger={false} />
      </section>

      {hasTeam ? (
        <section className="team-card album-detail__team">
          <div className="team-card__title">
            <Users size={32} />
            <span>{t('songDetail.team')}</span>
          </div>
          {teamRows.map((row) => (
            <TeamDetailRow
              key={row.label}
              label={row.label}
              contributors={row.contributors}
            />
          ))}
        </section>
      ) : null}
    </article>
  )
}

function uniqueContributors(
  songs: SongListItem[],
  type: ContributorLink['type'],
  getId: (song: SongListItem) => number | null,
  getName: (song: SongListItem) => string | null,
) {
  const contributors = new Map<number, ContributorLink>()

  songs.forEach((song) => {
    const id = getId(song)
    const name = getName(song)

    if (id && name && !contributors.has(id)) {
      contributors.set(id, { id, name, type })
    }
  })

  return [...contributors.values()]
}

export default AlbumDetailPage
