import { siteConfig } from "@/lib/site-config"
import { ogContentType, ogSize, renderSocialCard } from "@/lib/og-image"

export const runtime = "edge"
export const alt = siteConfig.title
export const size = ogSize
export const contentType = ogContentType

export default function TwitterImage() {
  return renderSocialCard()
}
