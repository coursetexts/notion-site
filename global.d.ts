interface Window {
  gtag: (command: string, target: string, params?: Record<string, any>) => void;
  dataLayer: any[];
  __authDebugEntries?: Array<{
    at: string
    label: string
    payload: Record<string, unknown>
  }>
}