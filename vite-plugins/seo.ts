import type { Plugin } from 'vite';
import { portfolio, type Portfolio } from '../src/content/portfolio.ts';

function personJsonLd(data: Portfolio): string {
  const { profile, contact } = data;
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    jobTitle: profile.title,
    description: profile.pitch,
    url: data.siteUrl,
    email: `mailto:${contact.email}`,
    address: { '@type': 'PostalAddress', addressLocality: profile.location },
    sameAs: [contact.linkedin, contact.github],
    alumniOf: data.education.map((ed) => ({ '@type': 'CollegeOrUniversity', name: ed.school })),
    knowsAbout: data.skillGroups.flatMap((group) => group.skills.map((skill) => skill.name)),
  });
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function sitemap(siteUrl: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${siteUrl}</loc><changefreq>monthly</changefreq><priority>1.0</priority></url>
  <url><loc>${siteUrl}?mode=classic</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
</urlset>
`;
}

function robots(siteUrl: string): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}sitemap.xml\n`;
}

/**
 * Injects SEO metadata from portfolio.ts into index.html and emits sitemap/robots,
 * so the content file stays the single source of truth.
 */
export function seoPlugin(data: Portfolio = portfolio): Plugin {
  const replacements: Record<string, string> = {
    '%PAGE_TITLE%': `${data.profile.name} · ${data.profile.title}`,
    '%DESCRIPTION%': data.profile.pitch,
    '%NAME%': data.profile.name,
    '%ROLE%': data.profile.title,
    '%SITE_URL%': data.siteUrl,
  };
  return {
    name: 'frontier-seo',
    transformIndexHtml(html) {
      let out = html.replace('%JSON_LD%', personJsonLd(data));
      for (const [token, value] of Object.entries(replacements)) {
        out = out.split(token).join(escapeAttr(value));
      }
      return out;
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap(data.siteUrl) });
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots(data.siteUrl) });
    },
  };
}
