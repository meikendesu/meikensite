import { mkdir, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

const NOTO_CJK_COMMIT = 'f8d157532fbfaeda587e826d4cd5b21a49186f7c'
const FONT_DOWNLOADS = [
  {
    fileName: 'NotoSans-VF.woff2',
    source: 'Google Fonts',
    url: 'https://fonts.gstatic.com/s/notosans/v42/o-0bIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjc5a7duw.woff2'
  },
  {
    fileName: 'NotoSansCJK-VF.woff2',
    source: 'Noto CJK official repository',
    url: `https://raw.githubusercontent.com/notofonts/noto-cjk/${NOTO_CJK_COMMIT}/android/NotoSansCJK-wght-400-900.ttf.woff2`
  }
] as const

const LICENSE_URL = 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosans/OFL.txt'
const projectRoot = path.resolve(process.cwd())
const fontsRoot = path.resolve(projectRoot, 'src', 'assets', 'fonts')
const targetDirectory = path.resolve(fontsRoot, 'noto')
const stagingDirectory = path.resolve(fontsRoot, '.noto-download')

function assertProjectPath(target: string) {
  const relative = path.relative(projectRoot, target)
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`拒绝操作项目目录之外的路径：${target}`)
  }
}

async function fetchOrThrow(url: string) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'meikensite-font-updater/1.0' }
  })
  if (!response.ok) throw new Error(`下载失败（${response.status}）：${url}`)
  return response
}

function assertWoff2(bytes: Uint8Array, source: string) {
  const isWoff2 = bytes.length >= 4
    && bytes[0] === 0x77
    && bytes[1] === 0x4f
    && bytes[2] === 0x46
    && bytes[3] === 0x32
  if (!isWoff2) throw new Error(`文件不是有效的 WOFF2：${source}`)
}

async function main() {
  assertProjectPath(fontsRoot)
  assertProjectPath(targetDirectory)
  assertProjectPath(stagingDirectory)

  await rm(stagingDirectory, { recursive: true, force: true })
  await mkdir(stagingDirectory, { recursive: true })

  try {
    let totalBytes = 0
    for (const font of FONT_DOWNLOADS) {
      const response = await fetchOrThrow(font.url)
      const bytes = new Uint8Array(await response.arrayBuffer())
      assertWoff2(bytes, font.url)
      await writeFile(path.join(stagingDirectory, font.fileName), bytes)
      totalBytes += bytes.byteLength
      console.log(`已下载 ${font.fileName}（${font.source}，${(bytes.byteLength / 1024 / 1024).toFixed(2)} MiB）`)
    }

    const licenseResponse = await fetchOrThrow(LICENSE_URL)
    await writeFile(path.join(stagingDirectory, 'OFL.txt'), await licenseResponse.text(), 'utf8')

    // 两个新字体全部下载并通过格式检查后，才替换旧的分片目录。
    await rm(targetDirectory, { recursive: true, force: true })
    await rename(stagingDirectory, targetDirectory)
    console.log(`字体已替换为 2 个完整 WOFF2 文件，共 ${(totalBytes / 1024 / 1024).toFixed(2)} MiB。`)
  } catch (error) {
    await rm(stagingDirectory, { recursive: true, force: true })
    throw error
  }
}

await main()
