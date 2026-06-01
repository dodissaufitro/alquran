import { useEffect, useState } from 'react'
import { DEFAULT_USER_AVATAR_DATA_URI, resolveUserPictureUrl } from '../lib/userPicture'

type Props = {
  src?: string | null
  alt?: string
  className?: string
}

/**
 * Foto profil pengguna — di Android WebView, gambar Google CDN perlu
 * referrerPolicy="no-referrer" agar tidak diblokir.
 */
export function UserAvatar({ src, alt = '', className }: Props) {
  const [failed, setFailed] = useState(false)
  const resolved = resolveUserPictureUrl(src)

  useEffect(() => {
    setFailed(false)
  }, [resolved])

  if (!resolved || failed) {
    return (
      <img
        src={DEFAULT_USER_AVATAR_DATA_URI}
        alt={alt}
        className={className}
        aria-hidden={!alt}
      />
    )
  }

  return (
    <img
      src={resolved}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}
