import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/conta"],
    },
    sitemap: "https://www.universopt.com.br/sitemap.xml",
  };
}
