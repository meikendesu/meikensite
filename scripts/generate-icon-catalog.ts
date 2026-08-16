import { readFile, writeFile } from 'node:fs/promises'

const metadataUrl = new URL('../node_modules/@fortawesome/fontawesome-free/metadata/icon-families.json', import.meta.url)
const outputUrl = new URL('../src/data/freeFontAwesomeIcons.ts', import.meta.url)
interface IconMetadata {
  label?: string
  familyStylesByLicense?: { free?: Array<{ family: string; style: IconStyle }> }
}
type IconStyle = 'solid' | 'regular' | 'brands'

const metadata = JSON.parse(await readFile(metadataUrl, 'utf8')) as Record<string, IconMetadata>
const prefixByStyle: Record<IconStyle, string> = { solid: 'fa-solid', regular: 'fa-regular', brands: 'fa-brands' }
const icons: Array<[string, string]> = []

for (const [name, icon] of Object.entries(metadata)) {
  const freeStyles = icon.familyStylesByLicense?.free || []
  for (const { family, style } of freeStyles) {
    if (family !== 'classic' || !prefixByStyle[style]) continue
    const label = icon.label || name
    icons.push([`${prefixByStyle[style]} fa-${name}`, label])
  }
}

icons.sort((left, right) => left[1].localeCompare(right[1], 'en'))
const source = `// 由 scripts/generate-icon-catalog.ts 从 Font Awesome Free metadata 生成。\nexport default ${JSON.stringify(icons)} as const\n`
await writeFile(outputUrl, source, 'utf8')
console.log(`Generated ${icons.length} free Font Awesome icon entries.`)
