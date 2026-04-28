import { Link } from 'react-router-dom'
import { Heart, Play } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import AlbumArtwork from './AlbumArtwork'
import {
  getAlbumImageUrl,
  type SongListItem,
} from '../lib/catalog/catalog'
import { useUserLibraryStore } from '../stores/userLibraryStore'

interface SongListProps {
  songs: SongListItem[]
  loading?: boolean
  showSinger?: boolean
}

function SongList({ songs, loading = false, showSinger = true }: SongListProps) {
  const { t } = useTranslation()
  const favoriteSongIds = useUserLibraryStore((state) => state.favoriteSongIds)
  const toggleFavoriteSong = useUserLibraryStore((state) => state.toggleFavoriteSong)
  const playCounts = useUserLibraryStore((state) => state.playCounts)
  const getTotalPlayCount = (song: SongListItem) =>
    song.catalogPlayCount + (playCounts[song.id] ?? 0)
  const isFavoriteSong = (song: SongListItem) =>
    song.catalogIsFavorite || favoriteSongIds.includes(song.id)
  const sortedSongs = [...songs].sort((a, b) => {
    const favoriteSort = Number(isFavoriteSong(b)) - Number(isFavoriteSong(a))

    return (
      favoriteSort ||
      getTotalPlayCount(b) - getTotalPlayCount(a) ||
      a.name.localeCompare(b.name, 'ar')
    )
  })

  return (
    <section className="song-list" aria-busy={loading}>
      {loading
        ? Array.from({ length: 8 }, (_, index) => (
            <div className="song-row song-row--loading" key={index} />
          ))
        : sortedSongs.map((song) => {
            const isFavorite = isFavoriteSong(song)
            const totalPlayCount = getTotalPlayCount(song)

            return (
              <article className="song-row" key={song.id}>
                <div className="song-row__meta">
                  <button
                    type="button"
                    className={
                      isFavorite
                        ? 'icon-button icon-button--favorite'
                        : 'icon-button icon-button--subtle'
                    }
                    onClick={() => toggleFavoriteSong(song.id)}
                    title={
                      isFavorite
                        ? t('songs.removeFavorite')
                        : t('songs.addFavorite')
                    }
                  >
                    <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                  </button>
                  <span className="song-row__play-count" title={t('songs.localPlays')}>
                    {totalPlayCount > 0 ? (
                      <>
                        <Play size={13} fill="currentColor" />
                        {totalPlayCount}
                      </>
                    ) : null}
                  </span>
                </div>

                <Link className="song-row__main" to={`/songs/${song.id}`}>
                  <h2>{song.name}</h2>
                  {showSinger ? <p>{song.singerName ?? ''}</p> : null}
                </Link>

                <Link className="song-row__image-link" to={`/songs/${song.id}`}>
                  <AlbumThumb imagePath={song.albumImage} title={song.albumName} />
                </Link>
              </article>
            )
          })}
    </section>
  )
}

interface AlbumThumbProps {
  imagePath: string | null
  title: string | null
}

function AlbumThumb({ imagePath, title }: AlbumThumbProps) {
  const imageUrl = getAlbumImageUrl(imagePath)

  return (
    <AlbumArtwork
      imageUrl={imageUrl}
      alt={title ?? ''}
      className="album-thumb"
      iconSize={21}
    />
  )
}

export default SongList
