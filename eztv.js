export default new class EZTV {
  base     = atob('aHR0cHM6Ly9lenR2eC50by9hcGkvZ2V0LXRvcnJlbnRz')
  cinemeta = atob('aHR0cHM6Ly92My1jaW5lbWV0YS5zdHJlbS5pby9jYXRhbG9n')

  /** @type {import('./').SearchFunction} */
  async single({ imdbAid, titles, episode, fetch = globalThis.fetch }) {
    const imdbId = imdbAid ?? await this.resolveImdb(titles, fetch)
    if (!imdbId) return []
    return this.fetchTorrents(imdbId, episode ?? null, fetch)
  }

  /** @type {import('./').SearchFunction} */
  batch = this.single

  /** @type {import('./').SearchFunction} */
  movie = this.single

  async resolveImdb(titles, fetch) {
    if (!titles?.length) return null
    for (const title of titles) {
      try {
        const res = await fetch(`${this.cinemeta}/series/top/search=${encodeURIComponent(title)}.json`)
        if (!res.ok) continue
        const data = await res.json()
        const id = data?.metas?.[0]?.id
        if (id?.startsWith('tt')) return id
      } catch {}
    }
    return null
  }

  async fetchTorrents(imdbId, episode, fetch) {
    try {
      // strip leading "tt" — EZTV expects the numeric part only
      const id = imdbId.replace(/^tt/, '')
      const res = await fetch(`${this.base}?imdb_id=${id}&limit=100`)
      if (!res.ok) return []
      const data = await res.json()
      if (!Array.isArray(data?.torrents)) return []
      return data.torrents
        .filter(t => episode == null || Number(t.episode) === episode)
        .map(t => ({
          title:     t.filename || t.title || '',
          link:      t.magnet_url || '',
          hash:      (t.hash || '').toLowerCase(),
          seeders:   parseInt(t.seeds  ?? '0') || 0,
          leechers:  parseInt(t.peers  ?? '0') || 0,
          downloads: 0,
          size:      parseInt(t.size_bytes ?? '0') || 0,
          date:      new Date((t.date_released_unix ?? 0) * 1000),
          accuracy:  'medium'
        }))
        .filter(t => t.hash)
    } catch {
      return []
    }
  }

  async test() {
    // tt0944947 = Game of Thrones — strip "tt" but keep leading zero
    const res = await fetch(`${this.base}?imdb_id=0944947&limit=1`)
    if (!res.ok) throw new Error('EZTV returned ' + res.status + ' — service may be down')
    const data = await res.json()
    if (typeof data?.torrents_count !== 'number') throw new Error('EZTV returned unexpected response format')
    return true
  }
}()
