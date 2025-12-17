export function saveCookie(name: string, value: string, mainDomain = 'openmem.net', days = 30) {
  const date = new Date()
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
  const expires = `expires=${date.toUTCString()}`
  const cookie = `${name}=${encodeURIComponent(value)}; ${expires}; domain=.${mainDomain}; path=/; SameSite=Lax`
  document.cookie = window.location.protocol === 'https:' ? `${cookie}; secure` : cookie
}

export function getLangPath(path: string, locale: string) {
  return locale === 'cn' ? `/cn${path}` : path
}

export function getHomePath(path: string, locale: string) {
  const config = useRuntimeConfig()
  const homeDomain = config.public.homeDomain
  return locale === 'cn' ? `${homeDomain}/cn${path}` : `${homeDomain}${path}`
}

export function copyText(text: string) {
  navigator.clipboard.writeText(text)
}

// 检测移动端的函数
export function checkIsMobile() {
  // SSR环境检查
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false
  }

  try {
    const mobileMediaQuery = window.matchMedia('(max-width: 768px)')

    const mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

    const isTouchDevice = 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0)

    return mobileMediaQuery.matches || (mobileUserAgent && isTouchDevice)
  } catch (error) {
    // 兜底返回false
    console.warn('Error detecting mobile device:', error)
    return false
  }
}
