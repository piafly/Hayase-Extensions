// Nyaa.si RSS feed filtered for German-dubbed/-subbed anime.
// German releases consistently use "German", "Deutsch", "GerSub", or "GerDub"
// in their titles, so keyword-based RSS queries are reliable enough.
export default new class NyaaGerman {
  base = 'https://nyaa.si/?page=rss&c=1_0&f=0&q='

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
      if (!r.hash || seen.has(r.hash)) return false
      seen.add(r.hash)
      return true
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
    const items = []
    const itemRe = /<item>([\s\S]*?)<\/item>/g
    let m
    while ((m = itemRe.exec(text)) !== null) {
      const s = m[1]
      const title = s.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
        ?? s.match(/<title>(.*?)<\/title>/)?.[1]
      if (!title) continue

      const viewId = s.match(/<guid[^>]*>https:\/\/nyaa\.si\/view\/(\d+)<\/guid>/)?.[1]
      const hash = (s.match(/<nyaa:infoHash>(.*?)<\/nyaa:infoHash>/)?.[1] ?? '').toLowerCase()
      const link = viewId ? `https://nyaa.si/download/${viewId}.torrent` : ''
      const pubDate = s.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]

      items.push({
        title,
        link,
        hash,
        seeders:   parseInt(s.match(/<nyaa:seeders>(\d+)<\/nyaa:seeders>/)?.[1]   ?? '0'),
        leechers:  parseInt(s.match(/<nyaa:leechers>(\d+)<\/nyaa:leechers>/)?.[1]  ?? '0'),
        downloads: parseInt(s.match(/<nyaa:downloads>(\d+)<\/nyaa:downloads>/)?.[1] ?? '0'),
        size:      this.parseSize(s.match(/<nyaa:size>(.*?)<\/nyaa:size>/)?.[1]    ?? ''),
        date:      pubDate ? new Date(pubDate) : new Date(),
        accuracy:  'medium'
      })
    }
    return items
  }

  parseSize (str) {
    const m = str.match(/([\d.]+)\s*(KiB|MiB|GiB)/i)
    if (!m) return 0
    const v = parseFloat(m[1])
    switch (m[2].toUpperCase()) {
      case 'KIB': return v * 1024
      case 'MIB': return v * 1024 * 1024
      case 'GIB': return v * 1024 * 1024 * 1024
      default: return 0
    }
  }

  async test () {
    const res = await fetch(this.base + 'German')
    if (!res.ok) throw new Error(`Nyaa returned ${res.status} — service may be down`)
    return true
  }
}()
