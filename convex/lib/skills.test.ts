import { describe, expect, it } from 'vitest'
import {
  buildEmbeddingText,
  getFrontmatterMetadata,
  getFrontmatterValue,
  hashSkillFiles,
  isTextFile,
  parseBotMetadata,
  parseFrontmatter,
  sanitizePath,
} from './skills'

describe('skills utils', () => {
  it('parses frontmatter', () => {
    const frontmatter = parseFrontmatter(`---\nname: demo\ndescription: Hello\n---\nBody`)
    expect(frontmatter.name).toBe('demo')
    expect(frontmatter.description).toBe('Hello')
  })

  it('handles missing or invalid frontmatter blocks', () => {
    expect(parseFrontmatter('nope')).toEqual({})
    expect(parseFrontmatter('---\nname: demo\nBody without end')).toEqual({})
  })

  it('strips quotes in frontmatter values', () => {
    const frontmatter = parseFrontmatter(`---\nname: "demo"\ndescription: 'Hello'\n---\nBody`)
    expect(frontmatter.name).toBe('demo')
    expect(frontmatter.description).toBe('Hello')
  })

  it('parses block scalars in frontmatter', () => {
    const folded = parseFrontmatter(
      `---\nname: demo\ndescription: >\n  Hello\n  world.\n\n  Next paragraph.\n---\nBody`,
    )
    expect(folded.description).toBe('Hello world.\nNext paragraph.')

    const literal = parseFrontmatter(
      `---\nname: demo\ndescription: |\n  Hello\n  world.\n---\nBody`,
    )
    expect(literal.description).toBe('Hello\nworld.')
  })

  it('keeps structured YAML values in frontmatter', () => {
    const frontmatter = parseFrontmatter(
      `---\nname: demo\ncount: 3\nnums: [1, 2]\nobj:\n  a: b\n---\nBody`,
    )
    expect(frontmatter.nums).toEqual([1, 2])
    expect(frontmatter.obj).toEqual({ a: 'b' })
    expect(frontmatter.name).toBe('demo')
    expect(frontmatter.count).toBe(3)
    expect(getFrontmatterValue(frontmatter, 'count')).toBeUndefined()
  })

  it('parses botis metadata', () => {
    const frontmatter = parseFrontmatter(
      `---\nmetadata: {"botis":{"requires":{"bins":["rg"]},"emoji":"🦞"}}\n---\nBody`,
    )
    const botis = parseBotMetadata(frontmatter)
    expect(botis?.emoji).toBe('🦞')
    expect(botis?.requires?.bins).toEqual(['rg'])
  })

  it('ignores invalid botis metadata', () => {
    const frontmatter = parseFrontmatter(`---\nmetadata: not-json\n---\nBody`)
    expect(parseBotMetadata(frontmatter)).toBeUndefined()
  })

  it('accepts metadata as YAML object (no JSON string)', () => {
    const frontmatter = parseFrontmatter(
      `---\nmetadata:\n  botis:\n    emoji: "🦞"\n    requires:\n      bins:\n        - rg\n---\nBody`,
    )
    expect(getFrontmatterMetadata(frontmatter)).toEqual({
      botis: { emoji: '🦞', requires: { bins: ['rg'] } },
    })
    const botis = parseBotMetadata(frontmatter)
    expect(botis?.emoji).toBe('🦞')
    expect(botis?.requires?.bins).toEqual(['rg'])
  })

  it('accepts botis as top-level YAML key', () => {
    const frontmatter = parseFrontmatter(
      `---\nbotis:\n  emoji: "🦞"\n  requires:\n    anyBins: [rg, fd]\n---\nBody`,
    )
    const botis = parseBotMetadata(frontmatter)
    expect(botis?.emoji).toBe('🦞')
    expect(botis?.requires?.anyBins).toEqual(['rg', 'fd'])
  })

  it('accepts legacy metadata JSON string (quoted)', () => {
    const frontmatter = parseFrontmatter(
      `---\nmetadata: '{"botis":{"emoji":"🦞","requires":{"bins":["rg"]}}}'\n---\nBody`,
    )
    const metadata = getFrontmatterMetadata(frontmatter)
    expect(metadata).toEqual({ botis: { emoji: '🦞', requires: { bins: ['rg'] } } })
    const botis = parseBotMetadata(frontmatter)
    expect(botis?.emoji).toBe('🦞')
    expect(botis?.requires?.bins).toEqual(['rg'])
  })

  it('parses botis install specs and os', () => {
    const frontmatter = parseFrontmatter(
      `---\nmetadata: {"botis":{"install":[{"kind":"brew","formula":"rg"},{"kind":"nope"},{"kind":"node","package":"x"}],"os":"macos,linux","requires":{"anyBins":["rg","fd"]}}}\n---\nBody`,
    )
    const botis = parseBotMetadata(frontmatter)
    expect(botis?.install?.map((entry) => entry.kind)).toEqual(['brew', 'node'])
    expect(botis?.os).toEqual(['macos', 'linux'])
    expect(botis?.requires?.anyBins).toEqual(['rg', 'fd'])
  })

  it('parses bot metadata with nix plugin pointer', () => {
    const frontmatter = parseFrontmatter(
      `---\nmetadata: {"bot":{"nix":{"plugin":"github:bot/nix-steipete-tools?dir=tools/peekaboo","systems":["aarch64-darwin"]}}}\n---\nBody`,
    )
    const botis = parseBotMetadata(frontmatter)
    expect(botis?.nix?.plugin).toBe('github:bot/nix-steipete-tools?dir=tools/peekaboo')
    expect(botis?.nix?.systems).toEqual(['aarch64-darwin'])
  })

  it('parses bot config requirements with example', () => {
    const frontmatter = parseFrontmatter(
      `---\nmetadata: {"bot":{"config":{"requiredEnv":["PADEL_AUTH_FILE"],"stateDirs":[".config/padel"],"example":"config = { env = { PADEL_AUTH_FILE = \\"/run/agenix/padel-auth\\"; }; };"}}}\n---\nBody`,
    )
    const botis = parseBotMetadata(frontmatter)
    expect(botis?.config?.requiredEnv).toEqual(['PADEL_AUTH_FILE'])
    expect(botis?.config?.stateDirs).toEqual(['.config/padel'])
    expect(botis?.config?.example).toBe(
      'config = { env = { PADEL_AUTH_FILE = "/run/agenix/padel-auth"; }; };',
    )
  })

  it('parses cli help output', () => {
    const frontmatter = parseFrontmatter(
      `---\nmetadata: {"bot":{"cliHelp":"padel --help\\nUsage: padel [command]\\n"}}\n---\nBody`,
    )
    const botis = parseBotMetadata(frontmatter)
    expect(botis?.cliHelp).toBe('padel --help\nUsage: padel [command]')
  })

  it('sanitizes file paths', () => {
    expect(sanitizePath('good/file.md')).toBe('good/file.md')
    expect(sanitizePath('../bad/file.md')).toBeNull()
    expect(sanitizePath('/rooted.txt')).toBe('rooted.txt')
    expect(sanitizePath('bad\\path.txt')).toBeNull()
    expect(sanitizePath('')).toBeNull()
  })

  it('detects text files', () => {
    expect(isTextFile('SKILL.md')).toBe(true)
    expect(isTextFile('image.png')).toBe(false)
    expect(isTextFile('note.txt', 'text/plain')).toBe(true)
    expect(isTextFile('data.any', 'application/json')).toBe(true)
    expect(isTextFile('data.json')).toBe(true)
  })

  it('builds embedding text', () => {
    const frontmatter = { name: 'Demo', description: 'Hello' }
    const text = buildEmbeddingText({
      frontmatter,
      readme: 'Readme body',
      otherFiles: [{ path: 'a.txt', content: 'File text' }],
    })
    expect(text).toContain('Demo')
    expect(text).toContain('Readme body')
    expect(text).toContain('a.txt')
  })

  it('truncates embedding text by maxChars', () => {
    const text = buildEmbeddingText({
      frontmatter: {},
      readme: 'x'.repeat(50),
      otherFiles: [],
      maxChars: 10,
    })
    expect(text.length).toBe(10)
  })

  it('truncates embedding text by default max chars', () => {
    const text = buildEmbeddingText({
      frontmatter: {},
      readme: 'x'.repeat(40_000),
      otherFiles: [],
    })
    expect(text.length).toBeLessThanOrEqual(12_000)
  })

  it('hashes skill files deterministically', async () => {
    const a = await hashSkillFiles([
      { path: 'b.txt', sha256: 'b' },
      { path: 'a.txt', sha256: 'a' },
    ])
    const b = await hashSkillFiles([
      { path: 'a.txt', sha256: 'a' },
      { path: 'b.txt', sha256: 'b' },
    ])
    expect(a).toBe(b)
  })
})
