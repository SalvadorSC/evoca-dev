import sharp from "sharp"
import { writeFile } from "node:fs/promises"

// EVOCA chat-bubble mark. `bg` = rounded-square background, `fg` = bubble + dots.
const mark = (bg, fg) => `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="${bg}"/>
  <g transform="translate(2,2)">
    <path d="M4 6C4 4.89543 4.89543 4 6 4H22C23.1046 4 24 4.89543 24 6V18C24 19.1046 23.1046 20 22 20H10L6 24V20H6C4.89543 20 4 19.1046 4 18V6Z" stroke="${fg}" stroke-width="2" fill="none"/>
    <circle cx="9" cy="12" r="1.5" fill="${fg}"/>
    <circle cx="14" cy="12" r="1.5" fill="${fg}"/>
    <circle cx="19" cy="12" r="1.5" fill="${fg}"/>
  </g>
</svg>`

const DARK = "#080808"
const LIGHT = "#FAFAFA"

async function png(svg, size, out) {
  const buf = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer()
  await writeFile(out, buf)
  console.log("wrote", out)
}

// dark variant: dark bg + light mark (for dark UIs)
await png(mark(DARK, LIGHT), 32, "public/icon-dark-32x32.png")
// light variant: light bg + dark mark (for light UIs)
await png(mark(LIGHT, DARK), 32, "public/icon-light-32x32.png")
// apple touch icon: 180x180, dark bg (iOS rounds corners itself)
await png(mark(DARK, LIGHT), 180, "public/apple-icon.png")
