// AniRena RSS filtered to German releases via keyword search.
const GERMAN_RE = /\b(german|deutsch|gersub|gerdub)\b|\[ger\]|\(ger\)|\[de\]|\(de\)/i

export default new class AniRenaGerman {
  base = atob('aHR0cHM6Ly93d3cuYW5pcmVuYS5jb20vcnNzP3E9')

  /** @type {import('./').SearchFunction} */
  async single ({ titles, episode, fetch = globalThis.fetch }) {
    if (!titles?.length) return []
    return this.search(titles[0], episode, fetch)
  }

  /** @type {import('./').SearchFunction} */
  async batch ({ titles, fetch = globalThis.fetch }) {
    if (!titles?.length) return []
    return this.search(titles[0], null, fetch)
  }

  /** @type {import('./').SearchFunction} */
  async movie ({ titles, fetch = globalThis.fetch }) {
    if (!titles?.length) return []
    return this.search(titles[0], null, fetch)
  }

  async search (title, episode, fetch) {
    const clean = title.replace(/[^\w\s-]/g, ' ').trim()
    const ep = episode ? episode.toString().padStart(2, '0') : ''

    const queries = ['German', 'Deutsch'].map(lang =>
      [clean, ep, lang].filter(Boolean).join(' ')
    )

    const results = await Promise.all(queries.map(q => this.fetchRSS(q, fetch)))

    const seen = new Set()
    return results.flat().filter(r => {
      if (seen.has(r.link)) return false
      seen.add(r.link)
      return GERMAN_RE.test(r.title)
    })
  }

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
    const res = await fetch(this.base + 'German')
    if (!res.ok) throw new Error('AniRena returned ' + res.status + ' — service may be down')
    return true
  }
}()
