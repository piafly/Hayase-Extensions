// Run with: node --test test.js
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import Seadex from './seadex.js'
import AnimeTosho from './animetosho.js'
import AnimeToshoNZB from './animetosho-nzb.js'
import Nyaa from './nyaa.js'
import PirateBay from './piratebay.js'
import SubsPlease from './subsplease.js'
import TokyoTosho from './tokyotosho.js'
import NyaaGerman from './nyaa-german.js'
import AnimeToshoGerman from './animetosho-german.js'
import AniRena from './anirena.js'
import AniRenaGerman from './anirena-german.js'
import NekoBT from './nekobt.js'

// ─── Source URL overview ──────────────────────────────────────────────────────
// URLs are base64-encoded in extension files. Decoded for reference:
const SOURCES = {
  Seadex:           atob('aHR0cHM6Ly9yZWxlYXNlcy5tb2U='),
  AnimeTosho:       atob('aHR0cHM6Ly9mZWVkLmFuaW1ldG9zaG8ub3Jn'),
  Nyaa:             atob('aHR0cHM6Ly9ueWFhLnNpLz9wYWdlPXJzcyZjPTFfMCZmPTAmcT0='),
  PirateBay:        atob('aHR0cHM6Ly9hcGliYXkub3JnL3EucGhwP3E9'),
  SubsPlease:       atob('aHR0cHM6Ly9zdWJzcGxlYXNlLm9yZy9hcGkv'),
  TokyoTosho:       atob('aHR0cHM6Ly93d3cudG9reW90b3Noby5pbmZvL3Jzcy5waHA='),
  AniRena:          atob('aHR0cHM6Ly93d3cuYW5pcmVuYS5jb20vcnNzP3E9'),
  NekoBT:           atob('aHR0cHM6Ly9uZWtvYnQudG8vYXBpL3YxLw=='),
  NekoBTMapping:    atob('aHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL1RoYVVua25vd24vYW5pbWUtbGlzdHMtdHMvcmVmcy9oZWFkcy9tYWluL2RhdGEvbmJ0LW1hcHBpbmcuanNvbg=='),
}
console.log('\nSource URLs:')
for (const [name, url] of Object.entries(SOURCES)) console.log(`  ${name.padEnd(16)} ${url}`)
console.log('')

// ─── Helpers ─────────────────────────────────────────────────────────────────

function assertTorrentResult (r) {
  assert.ok(typeof r.title === 'string' && r.title.length > 0,
    `title should be non-empty string, got: ${JSON.stringify(r.title)}`)
  assert.ok(typeof r.link === 'string',
    `link should be string, got: ${JSON.stringify(r.link)}`)
  assert.ok(typeof r.seeders === 'number',
    `seeders should be number, got: ${JSON.stringify(r.seeders)}`)
  assert.ok(typeof r.leechers === 'number',
    `leechers should be number, got: ${JSON.stringify(r.leechers)}`)
  assert.ok(typeof r.size === 'number',
    `size should be number, got: ${JSON.stringify(r.size)}`)
  assert.ok(r.date instanceof Date,
    `date should be Date, got: ${r.date}`)
  assert.ok(['high', 'medium', 'low'].includes(r.accuracy),
    `accuracy should be high|medium|low, got: ${r.accuracy}`)
}

// Validates an array if non-empty; always passes for empty (API may be offline)
function assertResultsIfAny (results) {
  assert.ok(Array.isArray(results))
  for (const r of results) assertTorrentResult(r)
  console.log(`  → ${results.length} result(s)`)
}

// ─── Seadex ──────────────────────────────────────────────────────────────────

describe('Seadex', () => {
  test('test() confirms connectivity', async () => {
    const ok = await Seadex.test()
    assert.strictEqual(ok, true)
  })

  test('single() throws when anilistId is missing', async () => {
    await assert.rejects(
      () => Seadex.single({ titles: ['Cowboy Bebop'], resolution: '', exclusions: [] }),
      /No anilistId/
    )
  })

  test('single() throws when titles is missing', async () => {
    await assert.rejects(
      () => Seadex.single({ anilistId: 1, resolution: '', exclusions: [] }),
      /No titles/
    )
  })

  test('single() returns valid TorrentResult[] for Cowboy Bebop (AniList 1)', async () => {
    // AniList ID 1 = Cowboy Bebop — classic, reliably indexed in SeaDex
    const results = await Seadex.single({
      anilistId: 1,
      titles: ['Cowboy Bebop'],
      episodeCount: 26,
      resolution: '',
      exclusions: []
    })
    assert.ok(Array.isArray(results))
    for (const r of results) {
      assertTorrentResult(r)
      // SeaDex always returns high accuracy
      assert.strictEqual(r.accuracy, 'high')
      // hash must be a non-empty string (SeaDex uses it as the link too)
      assert.ok(r.hash.length > 0, 'hash should be non-empty')
    }
    console.log(`  → ${results.length} result(s)`)
  })

  test('batch() and movie() alias single()', async () => {
    // SeaDex sets batch = movie = single internally
    assert.strictEqual(Seadex.batch, Seadex.single)
    assert.strictEqual(Seadex.movie, Seadex.single)
  })
})

// ─── AnimeTosho ───────────────────────────────────────────────────────────────

describe('AnimeTosho', () => {
  test('test() confirms connectivity', async () => {
    const ok = await AnimeTosho.test()
    assert.strictEqual(ok, true)
  })

  test('single() returns [] when anidbEid is missing', async () => {
    const r = await AnimeTosho.single({ resolution: '', exclusions: [] })
    assert.deepStrictEqual(r, [])
  })

  test('batch() returns [] when anidbAid is missing', async () => {
    const r = await AnimeTosho.batch({ resolution: '', exclusions: [], episodeCount: 1 })
    assert.deepStrictEqual(r, [])
  })

  test('batch() returns [] when episodeCount is missing', async () => {
    const r = await AnimeTosho.batch({ anidbAid: 13, resolution: '', exclusions: [] })
    assert.deepStrictEqual(r, [])
  })

  test('movie() returns [] when anidbAid is missing', async () => {
    const r = await AnimeTosho.movie({ resolution: '', exclusions: [] })
    assert.deepStrictEqual(r, [])
  })

  test('batch() returns valid TorrentResult[] for Dragon Ball Z (AniDB aid=13)', async () => {
    const results = await AnimeTosho.batch({
      anidbAid: 13,
      episodeCount: 1,
      resolution: '',
      exclusions: []
    })
    assertResultsIfAny(results)
  })

  test('movie() returns valid TorrentResult[] for Dragon Ball Z (AniDB aid=13)', async () => {
    const results = await AnimeTosho.movie({
      anidbAid: 13,
      resolution: '',
      exclusions: []
    })
    assertResultsIfAny(results)
  })
})

// ─── Nyaa ─────────────────────────────────────────────────────────────────────
// Uses a third-party proxy (torrent-search-api-livid.vercel.app) that may be
// intermittently unavailable. Tests validate shape when results are returned.

describe('Nyaa', () => {
  test('test() confirms connectivity', async () => {
    const ok = await Nyaa.test()
    assert.strictEqual(ok, true)
  })

  test('single() returns empty array when titles is empty', async () => {
    const results = await Nyaa.single({ titles: [], episode: 1, resolution: '', exclusions: [] })
    assert.deepStrictEqual(results, [])
  })

  test('single() returns valid TorrentResult[] for One Piece ep 1', async () => {
    const results = await Nyaa.single({
      titles: ['One Piece'],
      episode: 1,
      resolution: '',
      exclusions: []
    })
    assertResultsIfAny(results)
  })

  test('batch() aliases single()', () => {
    assert.strictEqual(Nyaa.batch, Nyaa.single)
  })
})

// ─── PirateBay ────────────────────────────────────────────────────────────────
// Same third-party proxy as Nyaa — may be unavailable.

describe('PirateBay', () => {
  test('test() confirms connectivity', async () => {
    const ok = await PirateBay.test()
    assert.strictEqual(ok, true)
  })

  test('single() returns empty array when titles is empty', async () => {
    const results = await PirateBay.single({ titles: [], episode: 1, resolution: '', exclusions: [] })
    assert.deepStrictEqual(results, [])
  })

  test('single() returns valid TorrentResult[] for One Piece ep 1', async () => {
    const results = await PirateBay.single({
      titles: ['One Piece'],
      episode: 1,
      resolution: '',
      exclusions: []
    })
    assertResultsIfAny(results)
  })

  test('batch() aliases single()', () => {
    assert.strictEqual(PirateBay.batch, PirateBay.single)
  })
})

// ─── SubsPlease ───────────────────────────────────────────────────────────────

describe('SubsPlease', () => {
  test('test() confirms connectivity', async () => {
    const ok = await SubsPlease.test()
    assert.strictEqual(ok, true)
  })

  test('single() returns empty array when titles is empty', async () => {
    const results = await SubsPlease.single({ titles: [], episode: 1, resolution: '', exclusions: [] })
    assert.deepStrictEqual(results, [])
  })

  test('single() returns valid TorrentResult[] for One Piece', async () => {
    // One Piece is perpetually airing — SubsPlease always has recent episodes
    const results = await SubsPlease.single({
      titles: ['One Piece'],
      episode: null,
      resolution: '',
      exclusions: []
    })
    assert.ok(Array.isArray(results))
    for (const r of results) {
      assertTorrentResult(r)
      // SubsPlease results always have high accuracy
      assert.strictEqual(r.accuracy, 'high')
      // magnet link must contain btih hash
      assert.match(r.link, /btih:/i, 'link should be a magnet URI')
    }
    console.log(`  → ${results.length} result(s)`)
  })

  test('batch() aliases single()', () => {
    assert.strictEqual(SubsPlease.batch, SubsPlease.single)
  })
})

// ─── TokyoTosho ───────────────────────────────────────────────────────────────

describe('TokyoTosho', () => {
  test('test() confirms connectivity', async () => {
    const ok = await TokyoTosho.test()
    assert.strictEqual(ok, true)
  })

  test('single() returns valid TorrentResult[] for One Piece ep 1', async () => {
    const results = await TokyoTosho.single({
      titles: ['One Piece'],
      episode: 1,
      resolution: '',
      exclusions: []
    })
    // TokyoTosho has sparse content; assert shape only if results returned
    assertResultsIfAny(results)
  })

  test('batch() aliases single()', () => {
    assert.strictEqual(TokyoTosho.batch, TokyoTosho.single)
  })
})

// ─── AnimeToshoNZB ────────────────────────────────────────────────────────────

describe('AnimeToshoNZB', () => {
  test('test() confirms connectivity', async () => {
    const ok = await AnimeToshoNZB.test()
    assert.strictEqual(ok, true)
  })

  test('query() returns undefined for unknown hash', async () => {
    const url = await AnimeToshoNZB.query('0000000000000000000000000000000000000000')
    assert.strictEqual(url, undefined)
  })

  test('query() returns NZB URL for known hash', async () => {
    // Hash from Hitori no Shita S06E17 — indexed by AnimeTosho
    const url = await AnimeToshoNZB.query('c40b62a41d095847411877f410b331fad6d2e6b9')
    if (url) {
      assert.ok(typeof url === 'string', 'nzb_url should be a string')
      assert.match(url, /\.nzb$/, 'URL should end with .nzb')
      console.log('  → ' + url)
    } else {
      console.log('  ⚠ NZB URL not available for this entry')
    }
  })
})

// ─── NyaaGerman ──────────────────────────────────────────────────────────────

describe('NyaaGerman', () => {
  test('test() confirms connectivity', async () => {
    const ok = await NyaaGerman.test()
    assert.strictEqual(ok, true)
  })

  test('single() returns empty array when titles is empty', async () => {
    const results = await NyaaGerman.single({ titles: [], episode: 1, resolution: '', exclusions: [] })
    assert.deepStrictEqual(results, [])
  })

  test('single() returns valid TorrentResult[] for Dragon Ball Z ep 1', async () => {
    const results = await NyaaGerman.single({
      titles: ['Dragon Ball Z'],
      episode: 1,
      resolution: '',
      exclusions: []
    })
    assert.ok(Array.isArray(results))
    for (const r of results) assertTorrentResult(r)
    console.log(`  → ${results.length} result(s)`)
  })

  test('batch() returns valid TorrentResult[] for Naruto (no episode)', async () => {
    const results = await NyaaGerman.batch({
      titles: ['Naruto'],
      resolution: '',
      exclusions: []
    })
    assertResultsIfAny(results)
  })

  test('results contain no hash duplicates', async () => {
    const results = await NyaaGerman.single({
      titles: ['Attack on Titan'],
      episode: 1,
      resolution: '',
      exclusions: []
    })
    const hashes = results.map(r => r.hash).filter(Boolean)
    assert.strictEqual(hashes.length, new Set(hashes).size, 'duplicate hashes found')
  })
})

// ─── AnimeToshoGerman ─────────────────────────────────────────────────────────

describe('AnimeToshoGerman', () => {
  test('test() confirms connectivity', async () => {
    const ok = await AnimeToshoGerman.test()
    assert.strictEqual(ok, true)
  })

  test('single() returns [] when anidbEid is missing', async () => {
    const r = await AnimeToshoGerman.single({ resolution: '', exclusions: [] })
    assert.deepStrictEqual(r, [])
  })

  test('batch() returns [] when anidbAid is missing', async () => {
    const r = await AnimeToshoGerman.batch({ resolution: '', exclusions: [], episodeCount: 1 })
    assert.deepStrictEqual(r, [])
  })

  test('movie() returns [] when anidbAid is missing', async () => {
    const r = await AnimeToshoGerman.movie({ resolution: '', exclusions: [] })
    assert.deepStrictEqual(r, [])
  })

  test('batch() with Dragon Ball Z (AniDB aid=13) returns only German results', async () => {
    const results = await AnimeToshoGerman.batch({
      anidbAid: 13,
      episodeCount: 1,
      resolution: '',
      exclusions: []
    })
    assert.ok(Array.isArray(results))
    for (const r of results) {
      assertTorrentResult(r)
      assert.match(r.title, /german|deutsch|gersub|gerdub|\[ger\]|\(ger\)|\[de\]|\(de\)/i,
        `Expected German indicator in title: "${r.title}"`)
    }
    console.log(`  → ${results.length} German result(s)`)
  })
})

// ─── AniRena ──────────────────────────────────────────────────────────────────

describe('AniRena', () => {
  test('test() confirms connectivity', async () => {
    const ok = await AniRena.test()
    assert.strictEqual(ok, true)
  })

  test('single() returns empty array when titles is empty', async () => {
    const results = await AniRena.single({ titles: [], episode: 1, resolution: '', exclusions: [] })
    assert.deepStrictEqual(results, [])
  })

  test('single() returns valid TorrentResult[] for One Piece ep 1', async () => {
    const results = await AniRena.single({
      titles: ['One Piece'],
      episode: 1,
      resolution: '',
      exclusions: []
    })
    assertResultsIfAny(results)
    // AniRena uses .torrent URLs, not magnet links
    for (const r of results) {
      assert.match(r.link, /\.torrent$/, 'link should be a .torrent URL')
    }
  })

  test('batch() aliases single()', () => {
    assert.strictEqual(AniRena.batch, AniRena.single)
  })
})

// ─── AniRenaGerman ────────────────────────────────────────────────────────────

describe('AniRenaGerman', () => {
  test('test() confirms connectivity', async () => {
    const ok = await AniRenaGerman.test()
    assert.strictEqual(ok, true)
  })

  test('single() returns empty array when titles is empty', async () => {
    const results = await AniRenaGerman.single({ titles: [], episode: 1, resolution: '', exclusions: [] })
    assert.deepStrictEqual(results, [])
  })

  test('single() returns only German results for Dragon Ball Z', async () => {
    const results = await AniRenaGerman.single({
      titles: ['Dragon Ball Z'],
      episode: 1,
      resolution: '',
      exclusions: []
    })
    assert.ok(Array.isArray(results))
    for (const r of results) {
      assertTorrentResult(r)
      assert.match(r.title, /german|deutsch|gersub|gerdub|\[ger\]|\(ger\)|\[de\]|\(de\)/i,
        `Expected German indicator in title: "${r.title}"`)
    }
    console.log(`  → ${results.length} German result(s)`)
  })
})

// ─── NekoBT ───────────────────────────────────────────────────────────────────

describe('NekoBT', () => {
  test('test() confirms connectivity', async () => {
    const ok = await NekoBT.test()
    assert.strictEqual(ok, true)
  })

  test('single() returns [] when no IDs are provided', async () => {
    const results = await NekoBT.single({ titles: ['One Piece'], episode: 1, resolution: '', exclusions: [] })
    assert.deepStrictEqual(results, [])
  })

  test('single() returns valid TorrentResult[] for One Piece E1 (TVDB 81797)', async () => {
    // One Piece TVDB ID = 81797, S01E01 tvdbEId = 361887
    const results = await NekoBT.single({
      tvdbId: 81797,
      tvdbEId: 361887,
      episode: 1,
      titles: ['One Piece'],
      resolution: '',
      exclusions: []
    })
    assertResultsIfAny(results)
    for (const r of results) {
      assert.match(r.link, /^magnet:/, 'link should be a magnet URI')
      assert.ok(r.hash.length > 0, 'hash should be non-empty')
    }
  })

  test('batch() returns valid TorrentResult[] for One Piece (TVDB 81797)', async () => {
    const results = await NekoBT.batch({
      tvdbId: 81797,
      titles: ['One Piece'],
      resolution: '',
      exclusions: []
    })
    assertResultsIfAny(results)
  })

  test('movie() aliases batch()', () => {
    assert.strictEqual(NekoBT.movie, NekoBT.batch)
  })
})
