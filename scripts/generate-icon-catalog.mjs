import { readFile, writeFile } from 'node:fs/promises'

const metadataUrl = new URL('../node_modules/@fortawesome/fontawesome-free/metadata/icon-families.json', import.meta.url)
const outputUrl = new URL('../src/data/freeFontAwesomeIcons.js', import.meta.url)
const metadata = JSON.parse(await readFile(metadataUrl, 'utf8'))
const prefixByStyle = { solid: 'fa-solid', regular: 'fa-regular', brands: 'fa-brands' }
const icons = []

for (const [name, icon] of Object.entries(metadata)) {
  const freeStyles = icon.familyStylesByLicense?.free || []
  for (const { family, style } of freeStyles) {
    if (family !== 'classic' || !prefixByStyle[style]) continue
    const label = icon.label || name
    icons.push([`${prefixByStyle[style]} fa-${name}`, label])
  }
}

icons.sort((left, right) => left[1].localeCompare(right[1], 'en'))
const source = `// 由 scripts/generate-icon-catalog.mjs 从 Font Awesome Free metadata 生成。\nexport default ${JSON.stringify(icons)}\n`
await writeFile(outputUrl, source, 'utf8')
console.log(`Generated ${icons.length} free Font Awesome icon entries.`)
