export function saveCookie(name: string, value: string, mainDomain = 'openmem.net', days = 30) {
  const date = new Date()
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
  const expires = `expires=${date.toUTCString()}`
  const cookie = `${name}=${encodeURIComponent(value)}; ${expires}; domain=.${mainDomain}; path=/; SameSite=Lax`
  document.cookie = window.location.protocol === 'https:' ? `${cookie}; secure` : cookie
}

export function getLangPath(path: string | null, locale: string) {
  if (path) {
    return locale === 'cn' ? `/cn${path}` : path
  }

  return path
}

export function getHomePath(path: string, locale: string) {
  const config = useRuntimeConfig()
  const homeDomain = config.public.homeDomain
  return locale === 'cn' ? `${homeDomain}/cn${path}` : `${homeDomain}${path}`
}

export function copyText(text: string) {
  navigator.clipboard.writeText(text)
}
