import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-image"

export const alt = "EVOCA — One platform for your schedule, speakers and live engagement"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function Image() {
  return renderOgImage()
}
