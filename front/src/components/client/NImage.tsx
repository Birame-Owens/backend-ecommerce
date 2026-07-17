import { useState, type ImgHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface NImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'srcSet'> {
  src: string
  alt: string
  /** Charge en eager + fetchpriority=high (LCP / image au-dessus du fold) */
  priority?: boolean
  /** thumbnail ~150w, medium ~600w, original taille réelle */
  srcSets?: { thumbnail?: string; medium?: string; original?: string }
  objectFit?: 'cover' | 'contain'
  className?: string
  imgClassName?: string
}

export function NImage({
  src,
  alt,
  priority = false,
  srcSets,
  objectFit = 'cover',
  className,
  imgClassName,
  ...rest
}: NImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  const srcset = srcSets
    ? [
        srcSets.thumbnail ? `${srcSets.thumbnail} 150w` : null,
        srcSets.medium    ? `${srcSets.medium} 600w`    : null,
        srcSets.original  ? `${srcSets.original} 1200w`  : null,
      ].filter(Boolean).join(', ')
    : undefined

  const sizes = srcset ? '(max-width: 640px) 150px, (max-width: 1024px) 600px, 1200px' : undefined

  return (
    <div className={cn('relative overflow-hidden bg-sand', className)}>
      {/* Skeleton shimmer visible tant que l'image n'est pas chargée */}
      {!loaded && !error && (
        <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-sand via-line to-sand bg-[length:200%_100%]" />
      )}

      {!error ? (
        <img
          src={src}
          alt={alt}
          srcSet={srcset}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          // @ts-expect-error — fetchpriority est valide HTML mais pas encore dans les types React
          fetchpriority={priority ? 'high' : 'auto'}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={cn(
            'w-full h-full transition-opacity duration-300',
            objectFit === 'cover' ? 'object-cover' : 'object-contain',
            loaded ? 'opacity-100' : 'opacity-0',
            imgClassName,
          )}
          {...rest}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-sand to-line" role="img" aria-label={alt} />
      )}
    </div>
  )
}
