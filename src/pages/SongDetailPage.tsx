import { type CSSProperties, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Download,
  Heart,
  Music,
  Pause,
  Play,
  Presentation,
  Repeat,
  Share2,
  SkipBack,
  SkipForward,
  StickyNote,
  Users,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  ANDROID_PLACEHOLDER_URL,
  default as AlbumArtwork,
} from '../components/AlbumArtwork'
import TeamDetailRow, { type ContributorLink } from '../components/TeamDetailRow'
import {
  getAlbumImageUrl,
  getAudioUrl,
  getSongById,
  type SongDetails,
} from '../lib/catalog/catalog'
import { useUserLibraryStore } from '../stores/userLibraryStore'

type LoadState = 'loading' | 'ready' | 'missing' | 'error'

function SongDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { songId } = useParams()
  const numericSongId = Number(songId)
  const [song, setSong] = useState<SongDetails | null>(null)
  const [status, setStatus] = useState<LoadState>('loading')
  const [error, setError] = useState<string | null>(null)
  const favoriteSongIds = useUserLibraryStore((state) => state.favoriteSongIds)
  const toggleFavoriteSong = useUserLibraryStore((state) => state.toggleFavoriteSong)
  const incrementPlayCount = useUserLibraryStore((state) => state.incrementPlayCount)
  const incrementAlbumPlayCount = useUserLibraryStore((state) => state.incrementAlbumPlayCount)
  const localPlayCount = useUserLibraryStore((state) =>
    Number.isFinite(numericSongId) ? state.playCounts[numericSongId] ?? 0 : 0,
  )

  useEffect(() => {
    let active = true

    void getSongById(numericSongId)
      .then((result) => {
        if (!active) {
          return
        }

        setSong(result)
        setStatus(result ? 'ready' : 'missing')
      })
      .catch((detailError: unknown) => {
        if (!active) {
          return
        }

        setError(
          detailError instanceof Error ? detailError.message : t('songDetail.unknownError'),
        )
        setStatus('error')
      })

    return () => {
      active = false
    }
  }, [numericSongId, t])

  if (status === 'loading' || song?.id !== numericSongId) {
    return <div className="empty-state">{t('songDetail.loading')}</div>
  }

  if (status === 'missing' || !song) {
    return (
      <div className="empty-state">
        <strong>{t('songDetail.notFound')}</strong>
        <button type="button" className="text-button" onClick={() => navigate(-1)}>
          {t('songDetail.backToSongs')}
        </button>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="empty-state">
        <strong>{t('songDetail.error')}</strong>
        <span>{error}</span>
      </div>
    )
  }

  const audioUrl = getAudioUrl(song.audioPath)
  const imageUrl = getAlbumImageUrl(song.albumImage)
  const isFavorite = favoriteSongIds.includes(song.id)
  const totalPlayCount = song.catalogPlayCount + localPlayCount
  const teamRows = [
    {
      label: t('songDetail.singer'),
      contributors: toContributor('singer', song.singerId, song.singerName),
    },
    {
      label: t('songDetail.poet'),
      contributors: toContributor('poet', song.poetId, song.poetName),
    },
    {
      label: t('songDetail.composer'),
      contributors: toContributor('composer', song.composerId, song.composerName),
    },
    {
      label: t('songDetail.distributer'),
      contributors: toContributor(
        'distributer',
        song.distributerId,
        song.distributerName,
      ),
    },
  ]
  const downloads = [
    { label: t('songDetail.downloadMp3'), path: audioUrl, icon: Download },
    { label: t('songDetail.chords'), path: absoluteFileUrl(song.chordPath), icon: Music },
    { label: t('songDetail.pptPicture'), path: absoluteFileUrl(song.pptPicturePath), icon: Presentation },
    { label: t('songDetail.pptWords'), path: absoluteFileUrl(song.pptWordPath), icon: Presentation },
    { label: t('songDetail.note'), path: absoluteFileUrl(song.notePath), icon: StickyNote },
  ].filter((item) => item.path)

  return (
    <article className="song-detail">
      <img
        className="song-detail__background"
        src={imageUrl ?? ANDROID_PLACEHOLDER_URL}
        alt=""
        onError={(event) => {
          event.currentTarget.src = ANDROID_PLACEHOLDER_URL
        }}
      />
      <section className="song-detail__top">
        {song.albumId ? (
          <Link className="song-art-link" to={`/albums/${song.albumId}`}>
            <AlbumArtwork
              imageUrl={imageUrl}
              alt={song.albumName ?? song.name}
              className="song-art"
              iconSize={72}
            />
          </Link>
        ) : (
          <AlbumArtwork
            imageUrl={imageUrl}
            alt={song.albumName ?? song.name}
            className="song-art"
            iconSize={72}
          />
        )}

        <div className="song-detail__copy">
          <p className="song-detail__album">{song.albumName ?? ''}</p>
          <h1>{song.name}</h1>

          <div className="detail-actions">
            <button
              type="button"
              className="favorite-large"
              onClick={() => toggleFavoriteSong(song.id)}
              title={isFavorite ? t('songs.removeFavorite') : t('songs.addFavorite')}
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

      {audioUrl ? (
        <MiniPlayer
          audioUrl={audioUrl}
          title={[song.albumName, song.singerName, song.name].filter(Boolean).join(' - ')}
          playCount={totalPlayCount}
          isFavorite={isFavorite}
          onFavorite={() => toggleFavoriteSong(song.id)}
          onFirstPlay={() => {
            incrementPlayCount(song.id)
            if (song.albumId) {
              incrementAlbumPlayCount(song.albumId)
            }
          }}
          songId={song.id}
        />
      ) : null}

      <section className="lyrics-section">
        <div className="section-label">
          <span />
          <h2>{t('songDetail.lyrics')}</h2>
          <span />
        </div>
          <pre>{song.lyrics || t('songDetail.noLyrics')}</pre>
      </section>

      <section className="action-grid">
        {downloads.map((item) => (
          <a key={item.label} className="resource-card" href={item.path ?? '#'} target="_blank" rel="noreferrer">
            <item.icon size={24} />
            <span>{item.label}</span>
          </a>
        ))}
        {navigator.share ? (
          <button
            type="button"
            className="resource-card"
            onClick={() =>
              void navigator.share({
                title: song.name,
                text: song.lyrics ?? song.name,
                url: window.location.href,
              })
            }
          >
            <Share2 size={24} />
            <span>{t('songDetail.share')}</span>
          </button>
        ) : null}
      </section>

      <section className="team-card">
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
    </article>
  )
}

interface MiniPlayerProps {
  audioUrl: string
  title: string
  playCount: number
  isFavorite: boolean
  onFavorite: () => void
  onFirstPlay: () => void
  songId: number
}

function MiniPlayer({
  audioUrl,
  title,
  playCount,
  isFavorite,
  onFavorite,
  onFirstPlay,
  songId,
}: MiniPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const countedSongId = useRef<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [repeat, setRepeat] = useState(false)

  const seekBy = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    const nextTime = Math.min(Math.max(audio.currentTime + seconds, 0), duration || 0)
    audio.currentTime = nextTime
    setCurrentTime(nextTime)
  }

  const togglePlayback = () => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    if (audio.paused) {
      void audio.play()
      return
    }

    audio.pause()
  }

  return (
    <section className="mini-player-card" aria-label={title}>
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="none"
        loop={repeat}
        onLoadedMetadata={(event) => {
          setDuration(event.currentTarget.duration || 0)
        }}
        onTimeUpdate={(event) => {
          setCurrentTime(event.currentTarget.currentTime)
        }}
        onPlay={() => {
          setIsPlaying(true)
          if (countedSongId.current !== songId) {
            countedSongId.current = songId
            onFirstPlay()
          }
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="mini-player-card__title-row">
        <p className="mini-player-card__title">
          <span>{title}</span>
        </p>
        <span className="mini-player-card__count">{playCount}</span>
      </div>

      <input
        className="mini-player-card__seek"
        type="range"
        min="0"
        max={duration || 0}
        step="1"
        value={Math.min(currentTime, duration || currentTime)}
        style={
          {
            '--seek-progress': `${duration ? (currentTime / duration) * 100 : 0}%`,
          } as CSSProperties
        }
        onChange={(event) => {
          const nextTime = Number(event.target.value)
          const audio = audioRef.current
          if (audio) {
            audio.currentTime = nextTime
          }
          setCurrentTime(nextTime)
        }}
      />

      <div className="mini-player-card__controls">
        <button
          type="button"
          className={isFavorite ? 'mini-icon-button mini-icon-button--favorite' : 'mini-icon-button'}
          onClick={onFavorite}
        >
          <Heart size={24} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>

        <button type="button" className="mini-icon-button" onClick={() => seekBy(-10)}>
          <SkipBack size={28} fill="currentColor" />
        </button>

        <button type="button" className="mini-play-button" onClick={togglePlayback}>
          {isPlaying ? <Pause size={25} fill="currentColor" /> : <Play size={25} fill="currentColor" />}
        </button>

        <button type="button" className="mini-icon-button" onClick={() => seekBy(10)}>
          <SkipForward size={28} fill="currentColor" />
        </button>

        <button
          type="button"
          className={repeat ? 'mini-icon-button mini-icon-button--repeat' : 'mini-icon-button'}
          onClick={() => setRepeat((value) => !value)}
        >
          <Repeat size={22} />
        </button>
      </div>
    </section>
  )
}

function absoluteFileUrl(path: string | null) {
  return path ? `https://www.taranimarabia.org/${path}` : null
}

function toContributor(
  type: ContributorLink['type'],
  id: number | null,
  name: string | null,
): ContributorLink[] {
  return id && name ? [{ id, name, type }] : []
}

export default SongDetailPage
