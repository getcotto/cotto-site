export function GET() {
  const base = "https://getcotto.com";
  const urls = [
    { loc: base + "/", priority: 1 },
    { loc: base + "/about", priority: 0.8 },
    { loc: base + "/contact", priority: 0.8 },
    { loc: base + "/privacy", priority: 0.5 },
    { loc: base + "/terms", priority: 0.5 },
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    urls.map(u => `<url><loc>${u.loc}</loc><priority>${u.priority}</priority></url>`).join("") +
    `</urlset>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}


