// Run with: node --test test.js
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import NyaaGerman from './nyaa-german.js'
import AnimeToshoGerman from './animetosho-german.js'

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
    // DBZ has extensive German releases on Nyaa — reliable canary
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
    assert.ok(Array.isArray(results))
    for (const r of results) assertTorrentResult(r)
    console.log(`  → ${results.length} result(s)`)
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

  test('single() throws when anidbEid is missing', async () => {
    await assert.rejects(
      () => AnimeToshoGerman.single({ resolution: '', exclusions: [] }),
      /No anidbEid/
    )
  })

  test('batch() throws when anidbAid is missing', async () => {
    await assert.rejects(
      () => AnimeToshoGerman.batch({ resolution: '', exclusions: [], episodeCount: 1 }),
      /No anidbAid/
    )
  })

  test('movie() throws when anidbAid is missing', async () => {
    await assert.rejects(
      () => AnimeToshoGerman.movie({ resolution: '', exclusions: [] }),
      /No anidbAid/
    )
  })

  test('batch() with Dragon Ball Z (AniDB aid=13) returns only German results', async () => {
    // AniDB aid 13 = Dragon Ball Z
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
