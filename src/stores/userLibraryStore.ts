import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface UserLibraryState {
  favoriteSongIds: number[]
  favoriteAlbumIds: number[]
  playCounts: Record<number, number>
  albumPlayCounts: Record<number, number>
  toggleFavoriteSong: (songId: number) => void
  toggleFavoriteAlbum: (albumId: number) => void
  incrementPlayCount: (songId: number) => void
  incrementAlbumPlayCount: (albumId: number) => void
  isFavoriteSong: (songId: number) => boolean
  isFavoriteAlbum: (albumId: number) => boolean
  getPlayCount: (songId: number) => number
  getAlbumPlayCount: (albumId: number) => number
}

export const useUserLibraryStore = create<UserLibraryState>()(
  persist(
    (set, get) => ({
      favoriteSongIds: [],
      favoriteAlbumIds: [],
      playCounts: {},
      albumPlayCounts: {},
      toggleFavoriteSong: (songId) =>
        set((state) => ({
          favoriteSongIds: state.favoriteSongIds.includes(songId)
            ? state.favoriteSongIds.filter((id) => id !== songId)
            : [...state.favoriteSongIds, songId],
        })),
      toggleFavoriteAlbum: (albumId) =>
        set((state) => ({
          favoriteAlbumIds: state.favoriteAlbumIds.includes(albumId)
            ? state.favoriteAlbumIds.filter((id) => id !== albumId)
            : [...state.favoriteAlbumIds, albumId],
        })),
      incrementPlayCount: (songId) =>
        set((state) => ({
          playCounts: {
            ...state.playCounts,
            [songId]: (state.playCounts[songId] ?? 0) + 1,
          },
        })),
      incrementAlbumPlayCount: (albumId) =>
        set((state) => ({
          albumPlayCounts: {
            ...state.albumPlayCounts,
            [albumId]: (state.albumPlayCounts[albumId] ?? 0) + 1,
          },
        })),
      isFavoriteSong: (songId) => get().favoriteSongIds.includes(songId),
      isFavoriteAlbum: (albumId) => get().favoriteAlbumIds.includes(albumId),
      getPlayCount: (songId) => get().playCounts[songId] ?? 0,
      getAlbumPlayCount: (albumId) => get().albumPlayCounts[albumId] ?? 0,
    }),
    {
      name: 'tranem-web-library',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        favoriteSongIds: state.favoriteSongIds,
        favoriteAlbumIds: state.favoriteAlbumIds,
        playCounts: state.playCounts,
        albumPlayCounts: state.albumPlayCounts,
      }),
    },
  ),
)
