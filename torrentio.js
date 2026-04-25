export default new class Torrentio {
  cinemeta = atob('aHR0cHM6Ly92My1jaW5lbWV0YS5zdHJlbS5pby9jYXRhbG9n')
  torrentio = atob('aHR0cHM6Ly90b3JyZW50aW8uc3RyZW0uZnVuL2xhbmd1YWdlPWdlcm1hbi9zdHJlYW0=')

  /** @type {import('./').SearchFunction} */
  async single({ imdbAid, titles, episode, fetch = globalThis.fetch }) {
    const imdbId = imdbAid ?? await this.resolveImdb(titles, 'series', fetch)
    if (!imdbId) return []
    const ep = episode ?? 1
    return this.fetchStreams(`series/${imdbId}:1:${ep}`, fetch)
  }

  /** @type {import('./').SearchFunction} */
  batch = this.single

  /** @type {import('./').SearchFunction} */
  async movie({ imdbAid, titles, fetch = globalThis.fetch }) {
    const imdbId = imdbAid ?? await this.resolveImdb(titles, 'movie', fetch)
    if (!imdbId) return []
    return this.fetchStreams(`movie/${imdbId}`, fetch)
  }

  async resolveImdb(titles, type, fetch) {
    if (!titles?.length) return null
    for (const title of titles) {
      try {
        const res = await fetch(`${this.cinemeta}/${type}/top/search=${encodeURIComponent(title)}.json`)
        if (!res.ok) continue
        const data = await res.json()
        const id = data?.metas?.[0]?.id
        if (id?.startsWith('tt')) return id
      } catch {}
    }
    return null
  }

  async fetchStreams(path, fetch) {
    try {
      const res = await fetch(`${this.torrentio}/${path}.json`)
      if (!res.ok) return []
      const data = await res.json()
      if (!Array.isArray(data?.streams)) return []
      return data.streams.flatMap(stream => {
        if (!stream.infoHash) return []
        const lines = (stream.title ?? '').split('\n')
        const title = lines[0]?.trim() ?? stream.name ?? ''
        const meta = lines[1] ?? ''
        const seeders = parseInt(meta.match(/👤\s*(\d+)/)?.[1] ?? '0')
        const size = this.parseSize(meta.match(/💾\s*([\d.]+\s*[KMGT]i?B)/i)?.[1] ?? '')
        return [{
          title,
          link: `magnet:?xt=urn:btih:${stream.infoHash}`,
          hash: stream.infoHash.toLowerCase(),
          seeders,
          leechers: 0,
          downloads: 0,
          size,
          date: new Date(),
          accuracy: 'medium'
        }]
      })
    } catch {
      return []
    }
  }

  parseSize(str) {
    if (!str) return 0
    const m = str.match(/([\d.]+)\s*(K|M|G|T)i?B/i)
    if (!m) return 0
    const v = parseFloat(m[1])
    switch (m[2].toUpperCase()) {
      case 'K': return v * 1024
      case 'M': return v * 1024 * 1024
      case 'G': return v * 1024 * 1024 * 1024
      case 'T': return v * 1024 * 1024 * 1024 * 1024
      default: return 0
    }
  }

  async test() {
    // tt0068646 = The Godfather, a reliable public test target
    const res = await fetch(`${this.torrentio}/movie/tt0068646.json`)
    if (!res.ok) throw new Error('Torrentio returned ' + res.status + ' — service may be down')
    const data = await res.json()
    if (!data?.streams?.length) throw new Error('Torrentio returned no streams for test')
    return true
  }
}()
