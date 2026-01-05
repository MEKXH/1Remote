import { useStorage } from '@vueuse/core'

const favorites = useStorage<string[]>('1remote-favorites', [])

export function useFavorites() {
  const toggleFavorite = (serverId: string) => {
    const index = favorites.value.indexOf(serverId)
    if (index === -1) {
      favorites.value.push(serverId)
    } else {
      favorites.value.splice(index, 1)
    }
  }

  const isFavorite = (serverId: string) => {
    return favorites.value.includes(serverId)
  }

  return {
    favorites,
    toggleFavorite,
    isFavorite
  }
}
