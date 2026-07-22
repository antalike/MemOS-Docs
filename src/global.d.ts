declare global {
  interface Window {
    /** Provided by `locale.1.1.2.min.js` (loaded in `LocaleScripts`). */
    setLocaleCookie?: (locale: string) => void;
    Cookies?: {
      get: (name: string, options?: { domain?: string }) => string | undefined;
      set: (
        name: string,
        value: string,
        options?: { domain?: string; path?: string; expires?: number },
      ) => void;
    };
    __RUNTIME_CONFIG__?: {
      tokenDomain?: string;
    };
  }
}

export {};
