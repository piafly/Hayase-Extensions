export default new class PirateBay {
  base = 'https://apibay.org/q.php?q='

  /** @type {import('./').SearchFunction} */
  async single({ titles, episode, fetch = globalThis.fetch }) {
    if (!titles?.length) return []
    const clean = titles[0].replace(/[^\w\s-]/g, ' ').trim()
    const ep = episode ? episode.toString().padStart(2, '0') : ''
    const q = [clean, ep].filter(Boolean).join(' ')
    return this.search(q, fetch)
  }

  /** @type {import('./').SearchFunction} */
  batch = this.single
  movie = this.single

  async search(query, fetch) {
    try {
      const res = await fetch(this.base + encodeURIComponent(query) + '&cat=0')
      if (!res.ok) return []
      let data
      try { data = await res.json() } catch { return [] }
      if (!Array.isArray(data)) return []
      // apibay returns [{"id":"0","name":"No results returned","info_hash":"0000..."}] when empty
      if (data.length === 1 && data[0].info_hash === '0000000000000000000000000000000000000000') return []
      return data.map(item => ({
        title:     item.name || '',
        link:      'magnet:?xt=urn:btih:' + item.info_hash + '&dn=' + encodeURIComponent(item.name || ''),
        hash:      item.info_hash?.toLowerCase() || '',
        seeders:   parseInt(item.seeders  ?? '0') || 0,
        leechers:  parseInt(item.leechers ?? '0') || 0,
        downloads: 0,
        size:      parseInt(item.size ?? '0') || 0,
        date:      new Date(parseInt(item.added ?? '0') * 1000),
        accuracy:  'low'
      }))
    } catch {
      return []
    }
  }

  async test() {
    const res = await fetch(this.base + 'one+piece&cat=0')
    if (!res.ok) throw new Error('apibay.org returned ' + res.status + ' — PirateBay API may be down')
    return true
  }
}()
