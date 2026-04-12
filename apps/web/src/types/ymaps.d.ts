// Minimal global type declaration for Yandex Maps JS API 2.1
// Loaded via <Script> tag, available as window.ymaps
/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  const ymaps: any
  interface Window {
    ymaps: any
  }
}

export {}
