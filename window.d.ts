declare global {
  interface Window {
    setLocaleCookie: (locale: string) => void
    setSitePrefCookie: (sitePref: string) => void
  }
}

export {}
