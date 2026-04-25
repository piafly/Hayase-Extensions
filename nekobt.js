const mappingP = fetch(atob('aHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL1RoYVVua25vd24vYW5pbWUtbGlzdHMtdHMvcmVmcy9oZWFkcy9tYWluL2RhdGEvbmJ0LW1hcHBpbmcuanNvbg==')).then(r => r.json()).catch(() => null)

export default new class NekoBT {
  base = atob('aHR0cHM6Ly9uZWtvYnQudG8vYXBpL3YxLw==')

  async resolveId ({ tvdbId, tmdbId, imdbId }) {
    const map = await mappingP
    if (!map) return null
    return (tvdbId != null && map.tvdb[String(tvdbId)])
        || (tmdbId != null && map.tmdb[String(tmdbId)])
        || (imdbId != null && map.imdb[String(imdbId)])
        || null
  }

  async findEpisodeId (nekoId, tvdbEId, episode, fetchFn) {
    const res = await fetchFn(this.base + 'media/' + nekoId)
    if (!res.ok) return null
    let data
    try { data = await res.json() } catch { return null }
    if (data.error) return null
    const episodes = data.data?.episodes ?? []
    const ep = (tvdbEId != null && episodes.find(e => e.tvdbId === tvdbEId))
            || (episode != null && episodes.find(e => e.episode === episode))
    return ep?.id ?? null
  }

  mapResult (item) {
    return {
      title: item.title || '',
      link: item.magnet || '',
      hash: item.infohash?.toLowerCase() || '',
      seeders: Number(item.seeders || 0),
      leechers: Number(item.leechers || 0),
      downloads: Number(item.completed || 0),
      size: Number(item.filesize || 0),
      date: new Date(item.uploaded_at || 0),
      accuracy: 'high',
      type: (item.level ?? 0) >= 3 ? 'alt' : undefined
    }
  }

  async doSearch (nekoId, episodeId, fetchFn) {
    let url = this.base + 'torrents/search?media_id=' + nekoId
    if (episodeId != null) url += '&episode_ids=' + episodeId
    const res = await fetchFn(url)
    if (!res.ok) return []
    let data
    try { data = await res.json() } catch { return [] }
    if (data.error) return []
    return (data.data?.results ?? []).map(r => this.mapResult(r))
  }

  /** @type {import('./').SearchFunction} */
  async single ({ tvdbId, tvdbEId, tmdbId, imdbId, episode, fetch = globalThis.fetch }) {
    const nekoId = await this.resolveId({ tvdbId, tmdbId, imdbId })
    if (!nekoId) return []
    const episodeId = await this.findEpisodeId(nekoId, tvdbEId, episode, fetch)
    return this.doSearch(nekoId, episodeId, fetch)
  }

  /** @type {import('./').SearchFunction} */
  async batch ({ tvdbId, tmdbId, imdbId, fetch = globalThis.fetch }) {
    const nekoId = await this.resolveId({ tvdbId, tmdbId, imdbId })
    if (!nekoId) return []
    return this.doSearch(nekoId, null, fetch)
  }

  movie = this.batch

  async test () {
    const res = await fetch(this.base + 'announcements')
    if (!res.ok) throw new Error('NekoBT returned ' + res.status + ' — service may be down')
    return true
  }
}()
