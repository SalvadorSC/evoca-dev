import type { MetadataRoute } from "next"
import { siteConfig } from "@/lib/site-config"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep private / app / dynamic surfaces out of the index.
      disallow: [
        "/dashboard",
        "/admin",
        "/app",
        "/dev",
        "/wall",
        "/speaker",
        "/present",
        "/qna",
        "/remote",
        "/c/",
        "/cfp/",
        "/auth",
        "/api",
      ],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  }
}
