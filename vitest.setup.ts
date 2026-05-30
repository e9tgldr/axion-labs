import '@testing-library/jest-dom'

// Deterministic in-memory localStorage. This Node build ships an experimental
// built-in localStorage that shadows jsdom's and lacks a usable clear(); replace
// it so demo-auth/i18n tests behave consistently.
class MemoryStorage implements Storage {
  private m = new Map<string, string>()
  get length() {
    return this.m.size
  }
  clear() {
    this.m.clear()
  }
  getItem(key: string) {
    return this.m.has(key) ? this.m.get(key)! : null
  }
  setItem(key: string, value: string) {
    this.m.set(key, String(value))
  }
  removeItem(key: string) {
    this.m.delete(key)
  }
  key(index: number) {
    return Array.from(this.m.keys())[index] ?? null
  }
}
Object.defineProperty(globalThis, 'localStorage', {
  value: new MemoryStorage(),
  configurable: true,
  writable: true,
})

// jsdom lacks IntersectionObserver (used by the Reveal scroll-in component).
class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null
  readonly rootMargin = ''
  readonly thresholds = []
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}
globalThis.IntersectionObserver =
  MockIntersectionObserver as unknown as typeof IntersectionObserver
