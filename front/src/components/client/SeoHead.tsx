import { useEffect } from 'react'
import { useShopStore } from '@/store/shopStore'

type SeoType = 'website' | 'product'

interface SeoHeadProps {
  title?: string | null
  description?: string | null
  canonical?: string | null
  image?: string | null
  type?: SeoType
  keywords?: string[] | string | null
  structuredData?: unknown
}

function absoluteUrl(value: string | null | undefined) {
  if (!value) return undefined

  try {
    return new URL(value, window.location.origin).toString()
  } catch {
    return value
  }
}

function setMeta(attribute: 'name' | 'property', key: string, content?: string) {
  const selector = `meta[${attribute}="${key}"]`
  let element = document.head.querySelector<HTMLMetaElement>(selector)

  if (!content) {
    element?.remove()
    return
  }

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}

function setCanonical(url: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')

  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }

  link.setAttribute('href', url)
}

function setStructuredData(json: string) {
  const id = 'nd-world-json-ld'
  let script = document.getElementById(id) as HTMLScriptElement | null

  if (!json) {
    script?.remove()
    return
  }

  if (!script) {
    script = document.createElement('script')
    script.id = id
    script.type = 'application/ld+json'
    document.head.appendChild(script)
  }

  script.textContent = json
}

export function SeoHead({
  title,
  description,
  canonical,
  image,
  type = 'website',
  keywords,
  structuredData,
}: SeoHeadProps) {
  const shopName = useShopStore((s) => s.shopName)
  const structuredJson = structuredData ? JSON.stringify(structuredData) : ''
  const keywordContent = Array.isArray(keywords) ? keywords.filter(Boolean).join(', ') : keywords ?? undefined

  useEffect(() => {
    const resolvedTitle = title?.trim() || `${shopName} | Boutique en ligne au Senegal`
    const resolvedDescription = description?.trim() || 'Boutique en ligne au Senegal avec livraison rapide a Dakar et partout au pays.'
    const resolvedCanonical = absoluteUrl(canonical) || window.location.href
    const resolvedImage = absoluteUrl(image)

    document.title = resolvedTitle

    setMeta('name', 'description', resolvedDescription)
    setMeta('name', 'keywords', keywordContent)
    setMeta('name', 'robots', 'index,follow,max-image-preview:large')

    setMeta('property', 'og:type', type)
    setMeta('property', 'og:url', resolvedCanonical)
    setMeta('property', 'og:title', resolvedTitle)
    setMeta('property', 'og:description', resolvedDescription)
    setMeta('property', 'og:image', resolvedImage)
    setMeta('property', 'og:locale', 'fr_FR')
    setMeta('property', 'og:site_name', shopName)

    setMeta('name', 'twitter:card', resolvedImage ? 'summary_large_image' : 'summary')
    setMeta('name', 'twitter:title', resolvedTitle)
    setMeta('name', 'twitter:description', resolvedDescription)
    setMeta('name', 'twitter:image', resolvedImage)

    setCanonical(resolvedCanonical)
    setStructuredData(structuredJson)
  }, [canonical, description, image, keywordContent, structuredJson, title, type, shopName])

  return null
}
