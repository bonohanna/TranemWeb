import { Link } from 'react-router-dom'
import { Heart, Play } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import AlbumArtwork from './AlbumArtwork'
import {
  getAlbumImageUrl,
  type AlbumListItem,
} from '../lib/catalog/catalog'
import { useUserLibraryStore } from '../stores/userLibraryStore'

interface AlbumListProps {
  albums: AlbumListItem[]
  loading?: boolean
}

function AlbumList({ albums, loading = false }: AlbumListProps) {
  const { t } = useTranslation()
  const favoriteAlbumIds = useUserLibraryStore((state) => state.favoriteAlbumIds)
  const toggleFavoriteAlbum = useUserLibraryStore((state) => state.toggleFavoriteAlbum)
  const albumPlayCounts = useUserLibraryStore((state) => state.albumPlayCounts)
  const getTotalPlayCount = (album: AlbumListItem) =>
    album.catalogPlayCount + (albumPlayCounts[album.id] ?? 0)
  const isFavoriteAlbum = (album: AlbumListItem) =>
    album.catalogIsFavorite || favoriteAlbumIds.includes(album.id)
  const sortedAlbums = [...albums].sort((a, b) => {
    const favoriteSort = Number(isFavoriteAlbum(b)) - Number(isFavoriteAlbum(a))

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
        : sortedAlbums.map((album) => {
            const isFavorite = isFavoriteAlbum(album)
            const totalPlayCount = getTotalPlayCount(album)

            return (
              <article className="song-row" key={album.id}>
                <div className="song-row__meta">
                  <button
                    type="button"
                    className={
                      isFavorite
                        ? 'icon-button icon-button--favorite'
                        : 'icon-button icon-button--subtle'
                    }
                    onClick={() => toggleFavoriteAlbum(album.id)}
                    title={
                      isFavorite
                        ? t('albums.removeFavorite')
                        : t('albums.addFavorite')
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

                <Link className="song-row__main" to={`/albums/${album.id}`}>
                  <h2>{album.name}</h2>
                  <p>{t('albums.songsCount', { count: album.songCount })}</p>
                </Link>

                <Link className="song-row__image-link" to={`/albums/${album.id}`}>
                  <AlbumArtwork
                    imageUrl={getAlbumImageUrl(album.image)}
                    alt={album.name}
                    className="album-thumb"
                    iconSize={21}
                  />
                </Link>
              </article>
            )
          })}
    </section>
  )
}

export default AlbumList
