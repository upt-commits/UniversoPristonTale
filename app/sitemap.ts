import type { MetadataRoute } from "next";

const routes = [
  "",
  "/noticias",
  "/eventos",
  "/rankings",
  "/clas",
  "/shop",
  "/download",
  "/suporte",
  "/status",
  "/seguranca",
  "/entrar",
  "/criar-conta",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `https://www.universopt.com.br${route}`,
    lastModified: new Date("2026-07-25T00:00:00-03:00"),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
