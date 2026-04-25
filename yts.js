export default new class YTS {
  base = atob('aHR0cHM6Ly95dHMubXgvYXBpL3YyL2xpc3RfbW92aWVzLmpzb24=')

  /** @type {import('./').SearchFunction} */
  single = this.movie

  /** @type {import('./').SearchFunction} */
  batch = this.movie

  /** @type {import('./').SearchFunction} */
  async movie({ imdbAid, titles, fetch = globalThis.fetch }) {
    if (!titles?.length && !imdbAid) return []
    try {
      const query = imdbAid ?? titles[0]
      const res = await fetch(`${this.base}?query_term=${encodeURIComponent(query)}&limit=50`)
      if (!res.ok) return []
      const data = await res.json()
      if (data?.status !== 'ok') return []
      const movies = data?.data?.movies
      if (!Array.isArray(movies)) return []
      return movies.flatMap(movie =>
        (movie.torrents ?? []).map(t => ({
          title:     `[YTS] ${movie.title} (${movie.year}) [${t.quality}]`,
          link:      t.url || `magnet:?xt=urn:btih:${t.hash}`,
          hash:      (t.hash || '').toLowerCase(),
          seeders:   parseInt(t.seeds  ?? '0') || 0,
          leechers:  parseInt(t.peers  ?? '0') || 0,
          downloads: 0,
          size:      parseInt(t.size_bytes ?? '0') || 0,
          date:      new Date((t.date_uploaded_unix ?? 0) * 1000),
          accuracy:  'low'
        }))
      ).filter(t => t.hash)
    } catch {
      return []
    }
  }

  async test() {
    const res = await fetch(`${this.base}?query_term=tt0068646&limit=1`)
    if (!res.ok) throw new Error('YTS returned ' + res.status + ' — service may be down')
    const data = await res.json()
    if (data?.status !== 'ok') throw new Error('YTS returned unexpected response format')
    return true
  }
}()
