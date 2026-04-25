export default new class TokyoTosho {
  base = atob('aHR0cHM6Ly93d3cudG9reW90b3Noby5pbmZvL3Jzcy5waHA=')

  /** @type {import('./').SearchFunction} */
  async single({ titles, episode, fetch = globalThis.fetch }) {
    if (!titles?.length) return []

    const query = titles[0] + (episode ? ` ${episode}` : '')
    const url = `${this.base}?terms=${encodeURIComponent(query)}`

    const res = await fetch(url)
    const text = await res.text()

    return this.parseRSS(text)
  }

  /** @type {import('./').SearchFunction} */
  batch = this.single
  movie = this.single

  parseRSS(text) {
    const results = []
    const itemRe = /<item>([\s\S]*?)<\/item>/g
    const titleRe = /<title><!\[CDATA\[(.*?)\]\]><\/title>/
    const descRe = /<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/
    const pubDateRe = /<pubDate>(.*?)<\/pubDate>/

    let m
    while ((m = itemRe.exec(text)) !== null) {
      const item = m[1]
      const titleMatch = item.match(titleRe)
      const descMatch = item.match(descRe)

      if (!titleMatch || !descMatch) continue

      const title = titleMatch[1]
      const description = descMatch[1]

      const magnetMatch = description.match(/magnet:\?xt=urn:btih:([a-zA-Z0-9]+)/)
      if (!magnetMatch) continue

      const magnet = magnetMatch[0]
      const hash = magnetMatch[1]

      const sizeMatch = description.match(/Size:\s*([\d.]+)\s*(KiB|MiB|GiB|KB|MB|GB)/i)
      const size = sizeMatch ? this.parseSize(sizeMatch[0]) : 0

      const pubDate = item.match(pubDateRe)?.[1]

      results.push({
        title,
        link: magnet,
        hash,
        seeders: 0,
        leechers: 0,
        downloads: 0,
        size,
        date: pubDate ? new Date(pubDate) : new Date(),
        accuracy: 'medium'
      })
    }
    return results
  }

  parseSize(sizeStr) {
    const match = sizeStr.match(/([\d.]+)\s*(KiB|MiB|GiB|KB|MB|GB)/i)
    if (!match) return 0

    const value = parseFloat(match[1])
    const unit = match[2].toUpperCase()

    switch (unit) {
      case 'KIB':
      case 'KB': return value * 1024
      case 'MIB':
      case 'MB': return value * 1024 * 1024
      case 'GIB':
      case 'GB': return value * 1024 * 1024 * 1024
      default: return 0
    }
  }

  async test() {
    const res = await fetch(this.base)
    if (!res.ok) throw new Error(`TokyoTosho returned ${res.status} — service may be down`)
    return true
  }
}()
