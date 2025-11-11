declare global {
  interface Window {
    setLocaleCookie: (locale: string) => void
  }
}

export {}
