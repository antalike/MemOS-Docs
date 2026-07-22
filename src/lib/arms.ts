// Aliyun ARMS RUM custom-event tracking, ported from the legacy `useArms`.
// The SDK is loaded by `src/components/arms.tsx`; this helper sends custom
// events once the SDK is ready (no-op on the server or before it loads).

interface RumSDK {
  default?: {
    sendCustom?: (event: { type: string; name: string; value?: string }) => void;
  };
}

declare global {
  interface Window {
    RumSDK?: RumSDK;
    __rum?: unknown;
  }
}

export function trackEvent(name: string, type: string, value?: string): void {
  if (typeof window === 'undefined') return;
  const rum = window.RumSDK?.default;
  rum?.sendCustom?.({ type, name, value });
}
