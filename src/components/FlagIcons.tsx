export function IndonesiaFlag({ width = 20, height = 14 }: { width?: number; height?: number } = {}) {
  return (
    <svg width={width} height={height} viewBox="0 0 20 14" xmlns="http://www.w3.org/2000/svg">
      <rect width="20" height="7" fill="#FF0000" />
      <rect y="7" width="20" height="7" fill="#FFFFFF" />
    </svg>
  )
}

export function UKFlag({ width = 20, height = 14 }: { width?: number; height?: number } = {}) {
  return (
    <svg width={width} height={height} viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="30" fill="#012169" />
      <polygon points="0,0 20,0 0,15" fill="#FFFFFF" />
      <polygon points="60,0 40,0 60,15" fill="#FFFFFF" />
      <polygon points="0,30 20,30 0,15" fill="#FFFFFF" />
      <polygon points="60,30 40,30 60,15" fill="#FFFFFF" />
      <polygon points="0,0 60,30 60,24 12,0" fill="#C8102E" />
      <polygon points="0,30 60,0 54,0 0,24" fill="#C8102E" />
      <polygon points="30,0 37,0 30,7 33,7 33,0" fill="#FFFFFF" />
      <polygon points="30,30 37,30 30,23 33,23 33,30" fill="#FFFFFF" />
      <polygon points="0,15 60,15 60,11 0,11" fill="#FFFFFF" />
      <polygon points="0,15 60,15 60,19 0,19" fill="#FFFFFF" />
      <polygon points="30,0 37,0 30,7 33,7 33,0" fill="#C8102E" />
      <polygon points="30,30 37,30 30,23 33,23 33,30" fill="#C8102E" />
      <polygon points="0,15 60,15 60,18 0,18" fill="#C8102E" />
      <polygon points="0,15 60,15 60,12 0,12" fill="#C8102E" />
    </svg>
  )
}
