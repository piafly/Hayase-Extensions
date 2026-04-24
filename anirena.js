export default new class AniRena {
  base = 'https://www.anirena.com/rss?q='

  /** @type {import('./').SearchFunction} */
  async single ({ titles, episode, fetch = globalThis.fetch }) {
    if (!titles?.length) return []
    const clean = titles[0].replace(/[^\w\s-]/g, ' ').trim()
    const ep = episode ? episode.toString().padStart(2, '0') : ''
    const q = [clean, ep].filter(Boolean).join(' ')
    return this.fetchRSS(q, fetch)
  }

  /** @type {import('./').SearchFunction} */
  batch = this.single
  movie = this.single

  async fetchRSS (query, fetch) {
    try {
      const res = await fetch(this.base + encodeURIComponent(query))
      if (!res.ok) return []
      return this.parseRSS(await res.text())
    } catch {
      return []
    }
  }

  parseRSS (text) {
    const results = []
    const itemPattern = /<item>([\s\S]*?)<\/item>/g
    let m
    while ((m = itemPattern.exec(text)) !== null) {
      const s = m[1]
      const title = s.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
        ?? s.match(/<title>(.*?)<\/title>/)?.[1]
      if (!title) continue

      const torrentUrl = s.match(/<enclosure url="([^"]+\.torrent)"/)?.[1]
      if (!torrentUrl) continue

      const desc = s.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ?? ''
      const pubDate = s.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]

      results.push({
        title,
        link:      torrentUrl,
        hash:      '',
        seeders:   0,
        leechers:  0,
        downloads: 0,
        size:      this.parseSize(desc),
        date:      pubDate ? new Date(pubDate) : new Date(),
        accuracy:  'medium'
      })
    }
    return results
  }

  parseSize (desc) {
    const m = desc.match(/Size:\s*([\d.]+)\s*(KB|MB|GB|KiB|MiB|GiB)/i)
    if (!m) return 0
    const v = parseFloat(m[1])
    switch (m[2].toUpperCase()) {
      case 'KB': case 'KIB': return v * 1024
      case 'MB': case 'MIB': return v * 1024 * 1024
      case 'GB': case 'GIB': return v * 1024 * 1024 * 1024
      default: return 0
    }
  }

  async test () {
    const res = await fetch(this.base + 'one+piece')
    if (!res.ok) throw new Error('AniRena returned ' + res.status + ' — service may be down')
    return true
  }
}()
