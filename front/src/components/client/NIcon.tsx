const PATHS: Record<string, string> = {
  home:     'M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5',
  menu:     'M4 6h16M4 12h16M4 18h16',
  grid:     'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  search:   'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-3.6-3.6',
  heart:    'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.18L12 21.35z',
  user:     'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-3.9 3.6-6 8-6s8 2.1 8 6',
  bag:      'M6 8h12l1 12H5L6 8zM9 8V6a3 3 0 0 1 6 0v2',
  back:     'M15 5l-7 7 7 7',
  fwd:      'M9 5l7 7-7 7',
  close:    'M6 6l12 12M18 6L6 18',
  share:    'M12 3v13M8 7l4-4 4 4M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6',
  plus:     'M12 5v14M5 12h14',
  minus:    'M5 12h14',
  check:    'M5 12.5 10 17 19 7',
  bell:     'M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6zM10 21a2 2 0 0 0 4 0',
  trash:    'M5 7h14M10 7V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13',
  filter:   'M4 6h16M7 12h10M10 18h4',
  pin:      'M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  card:     'M3 7h18v10H3zM3 10h18M7 14h3',
  truck:    'M3 6h11v9H3zM14 9h4l3 3v3h-7zM7.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  ruler:    'M4 16.5 16.5 4l3.5 3.5L7.5 20zM8 9l2 2M11 6l2 2M5 12l2 2',
  arrow:    'M5 12h14M13 6l6 6-6 6',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 0 0-1.7-1l-.3-2.6h-4l-.3 2.6a7 7 0 0 0-1.7 1l-2.3-1-2 3.4L4.1 11a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 1.7 1l.3 2.6h4l.3-2.6a7 7 0 0 0 1.7-1l2.3 1 2-3.4-2-1.5c.1-.3.1-.7.1-1z',
  lock:     'M6 11h12v9H6zM9 11V8a3 3 0 0 1 6 0v3',
  chat:     'M4 5h16v11H8l-4 4z',
  shield:   'M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z',
  star:     'M12 3l2.5 6 6.5.5-5 4.2 1.6 6.3L12 16.8 5.9 20l1.6-6.3-5-4.2L9 9z',
  spark:    'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
  globe:    'M12 3a9 9 0 1 0 0 18A9 9 0 0 0 12 3zM3 12h18M12 3c-2.5 3-4 5.7-4 9s1.5 6 4 9M12 3c2.5 3 4 5.7 4 9s-1.5 6-4 9',
  copy:     'M8 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9l-5-5H8zM14 4v4h4M8 4h6M8 12h8M8 16h5',
  link:     'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
}

const FILL_NAMES = new Set(['heart', 'star', 'spark'])

interface Props {
  name: string
  size?: number
  fill?: boolean
  strokeWidth?: number
  className?: string
}

export function NIcon({ name, size = 22, fill, strokeWidth = 1.7, className }: Props) {
  const shouldFill = fill ?? FILL_NAMES.has(name)
  if (import.meta.env.DEV && !(name in PATHS)) {
    console.warn(`[NIcon] icône inconnue : "${name}"`)
  }
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill={shouldFill ? 'currentColor' : 'none'}
      stroke={shouldFill ? 'none' : 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name] ?? ''} />
    </svg>
  )
}

export function WAGlyph({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.004c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm4.66 13.49c-.06-.11-.23-.18-.5-.31s-1.57-.77-1.81-.86c-.24-.09-.42-.13-.6.13-.18.27-.69.86-.85 1.04-.16.18-.31.2-.58.07-.27-.13-1.14-.42-2.17-1.34-.8-.72-1.34-1.6-1.5-1.87-.16-.27-.02-.42.12-.55.12-.12.27-.31.4-.47.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.47-.07-.13-.6-1.45-.83-1.99-.22-.52-.44-.45-.6-.46l-.51-.01c-.18 0-.47.07-.71.34-.24.27-.93.91-.93 2.22s.95 2.58 1.09 2.76c.13.18 1.87 2.86 4.54 4.01.63.27 1.13.44 1.51.56.64.2 1.22.17 1.67.1.51-.07 1.57-.64 1.79-1.26.22-.62.22-1.15.16-1.26z" />
    </svg>
  )
}

export function IGGlyph({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function TikTokGlyph({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.5 3c.35 2.1 1.6 3.65 3.5 3.98v2.62c-1.27 0-2.45-.4-3.5-1.05v6.2a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6.02.9.07v2.73a3 3 0 1 0 2.1 2.86V3h2.7z" />
    </svg>
  )
}

export function Stars({ value, size = 13 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 24 24" width={size} height={size}
          fill={i <= Math.round(value) ? '#C9942B' : 'none'}
          stroke={i <= Math.round(value) ? 'none' : '#C9942B'}
          strokeWidth="1.5" aria-hidden="true">
          <path d="M12 3l2.5 6 6.5.5-5 4.2 1.6 6.3L12 16.8 5.9 20l1.6-6.3-5-4.2L9 9z" />
        </svg>
      ))}
    </span>
  )
}
