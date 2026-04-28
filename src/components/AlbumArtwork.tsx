import { useState } from 'react'
import { Music2 } from 'lucide-react'

const ANDROID_PLACEHOLDER_URL = `${import.meta.env.BASE_URL}android/placeholder.png`

interface AlbumArtworkProps {
  imageUrl: string | null
  alt: string
  className: string
  iconSize?: number
}

function AlbumArtwork({ imageUrl, alt, className, iconSize = 24 }: AlbumArtworkProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const isPlaceholder = !imageUrl || failedUrl === imageUrl
  const src = isPlaceholder ? ANDROID_PLACEHOLDER_URL : imageUrl

  return (
    <span className={`${className} album-artwork${isPlaceholder ? ' album-artwork--placeholder' : ''}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => {
          if (imageUrl) {
            setFailedUrl(imageUrl)
          }
        }}
      />
      {isPlaceholder ? (
        <span className="album-artwork__fallback" aria-hidden="true">
          <Music2 size={iconSize} />
        </span>
      ) : null}
    </span>
  )
}

export { ANDROID_PLACEHOLDER_URL }
export default AlbumArtwork
