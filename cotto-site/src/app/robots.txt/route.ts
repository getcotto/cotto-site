export function GET() {
  const base = "https://getcotto.com";
  const body = `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}


