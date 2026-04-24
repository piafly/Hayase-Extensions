// AnimeTosho source filtered to German-dubbed/-subbed releases only.
// Fetches by AniDB IDs (high accuracy) then keeps only entries whose
// titles contain recognised German language markers.
const GERMAN_RE = /\b(german|deutsch|gersub|gerdub)\b|\[ger\]|\(ger\)|\[de\]|\(de\)/i
const QUALITIES = ['1080', '720', '540', '480']

export default new class AnimeToshoGerman {
  url = atob('aHR0cHM6Ly9mZWVkLmFuaW1ldG9zaG8ub3JnL2pzb24=')

  buildQuery ({ resolution, exclusions }) {
    const base = `&qx=1&q=!("${exclusions?.join('"|"') || ''}")`
    if (!resolution) return base
    const excl = QUALITIES.filter(q => q !== resolution)
    return base + `!(*${excl.join('*|*')}*)`
  }

  map (entries, batch = false) {
    return entries.map(entry => ({
      title:     entry.title || entry.torrent_name,
      link:      entry.magnet_uri,
      seeders:   (entry.seeders  || 0) >= 30000 ? 0 : entry.seeders  || 0,
      leechers:  (entry.leechers || 0) >= 30000 ? 0 : entry.leechers || 0,
      downloads: entry.torrent_downloaded_count || 0,
      hash:      entry.info_hash,
      size:      entry.total_size,
      accuracy:  entry.anidb_fid ? 'high' : 'medium',
      type:      batch ? 'batch' : undefined,
      date:      new Date(entry.timestamp * 1000)
    }))
  }

  filterGerman (entries) {
    return entries.filter(e => GERMAN_RE.test(e.title || e.torrent_name))
  }

  /** @type {import('./').SearchFunction} */
  async single ({ anidbEid, resolution, exclusions }) {
    if (!anidbEid) throw new Error('No anidbEid provided')
    const query = this.buildQuery({ resolution, exclusions })
    const res = await fetch(this.url + '?eid=' + anidbEid + query)
    const data = await res.json()
    return this.map(this.filterGerman(data))
  }

  /** @type {import('./').SearchFunction} */
  async batch ({ anidbAid, resolution, episodeCount, exclusions }) {
    if (!anidbAid) throw new Error('No anidbAid provided')
    if (episodeCount == null) throw new Error('No episodeCount provided')
    const query = this.buildQuery({ resolution, exclusions })
    const res = await fetch(this.url + '?order=size-d&aid=' + anidbAid + query)
    const data = (await res.json()).filter(e => e.num_files >= episodeCount)
    return this.map(this.filterGerman(data), true)
  }

  /** @type {import('./').SearchFunction} */
  async movie ({ anidbAid, resolution, exclusions }) {
    if (!anidbAid) throw new Error('No anidbAid provided')
    const query = this.buildQuery({ resolution, exclusions })
    const res = await fetch(this.url + '?aid=' + anidbAid + query)
    const data = await res.json()
    return this.map(this.filterGerman(data))
  }

  async test () {
    try {
      const res = await fetch(this.url)
      return res.ok
    } catch {
      return false
    }
  }
}()
