// NZB extension: given a torrent info hash, returns the NZB URL from AnimeTosho.
// Works for all languages AnimeTosho indexes, including German fansub groups.
export default new class AnimeToshoNZB {
  url = atob('aHR0cHM6Ly9mZWVkLmFuaW1ldG9zaG8ub3JnL2pzb24=')

  async query (infoHash, _options, fetch = globalThis.fetch) {
    const res = await fetch(this.url + '?show=torrent&btih=' + infoHash)
    if (!res.ok) return undefined
    let data
    try { data = await res.json() } catch { return undefined }
    return data?.nzb_url ?? undefined
  }

  async test () {
    const res = await fetch(this.url)
    if (!res.ok) throw new Error('AnimeTosho returned ' + res.status + ' — service may be down')
    return true
  }
}()
