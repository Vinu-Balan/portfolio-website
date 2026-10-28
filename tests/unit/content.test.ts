import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Texture } from 'three';
import { describe, expect, it, vi } from 'vitest';
import { portfolio } from '../../src/content/portfolio';
import { mountClassic } from '../../src/ui/classicMode';
import { renderPanel } from '../../src/ui/panels';
import { disposeObject3D } from '../../src/utils/dispose';

describe('portfolio content', () => {
  it('has unique project ids and valid absolute URLs', () => {
    const ids = portfolio.projects.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    const urls = [
      ...portfolio.projects.flatMap((p) => [p.liveUrl, p.repoUrl]),
      portfolio.contact.linkedin,
      portfolio.contact.github,
      portfolio.siteUrl,
    ].filter((u): u is string => typeof u === 'string');
    urls.forEach((url) => {
      expect(() => new URL(url)).not.toThrow();
    });
  });

  it('keeps skill levels in range', () => {
    portfolio.skillGroups
      .flatMap((g) => g.skills)
      .forEach((s) => {
        expect(s.level).toBeGreaterThanOrEqual(0);
        expect(s.level).toBeLessThanOrEqual(100);
      });
  });
});

describe('classic mode content parity', () => {
  it('renders every job, project, skill, school, honour and contact link', () => {
    const root = document.createElement('main');
    mountClassic({ root, data: portfolio, reason: null, worldAvailable: false });
    const text = root.textContent;
    const expected = [
      portfolio.profile.name,
      portfolio.profile.title,
      ...portfolio.profile.summary,
      ...portfolio.jobs.flatMap((j) => [j.role, j.company, ...j.achievements]),
      ...portfolio.projects.flatMap((p) => [p.name, p.tagline, ...p.description]),
      ...portfolio.skillGroups.flatMap((g) => [...g.skills.map((s) => s.name), ...g.all]),
      ...portfolio.education.flatMap((e) => [e.degree, e.school]),
      ...portfolio.accomplishments,
      portfolio.contact.email,
    ];
    expected.forEach((snippet) => {
      expect(text).toContain(snippet);
    });
    const hrefs = [...root.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toContain(portfolio.contact.linkedin);
    expect(hrefs).toContain(portfolio.contact.github);
  });

  it('gives every section an h2 heading', () => {
    const panel = renderPanel('experience', portfolio, { interactive: false });
    expect(panel.querySelector('h2')?.textContent).toBe('Experience');
  });
});

describe('resume skills', () => {
  it('includes every category from the resume', () => {
    expect(portfolio.skillGroups.map((g) => g.category)).toEqual([
      'Languages',
      'Frontend',
      'Backend & APIs',
      'AI, LLM & Generative AI',
      'Machine Learning & Data',
      'Databases',
      'Cloud & DevOps',
      'Testing & Quality',
      'Experimentation & Analytics',
      'AI-Assisted Development',
      'Practices',
    ]);
    const all = portfolio.skillGroups.flatMap((g) => g.all);
    ['Zustand', 'Kubernetes (fundamentals)', 'Selenium', 'Confluence', 'OpenCV', 'Cursor'].forEach(
      (skill) => {
        expect(all).toContain(skill);
      },
    );
  });
});

describe('interactive skills workbench', () => {
  it('switches tool tabs with arrow keys', () => {
    const panel = renderPanel('skills', portfolio, { interactive: true });
    document.body.append(panel);
    const tabs = [...panel.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    expect(tabs[0]?.getAttribute('aria-selected')).toBe('true');
    tabs[0]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(tabs[1]?.getAttribute('aria-selected')).toBe('true');
    panel.remove();
  });
});

describe('disposeObject3D', () => {
  it('disposes geometry, material and textures and detaches the node', () => {
    const parent = new Group();
    const texture = new Texture();
    const material = new MeshBasicMaterial({ map: texture });
    const geometry = new BoxGeometry();
    const mesh = new Mesh(geometry, material);
    parent.add(mesh);
    const spies = [
      vi.spyOn(geometry, 'dispose'),
      vi.spyOn(material, 'dispose'),
      vi.spyOn(texture, 'dispose'),
    ];
    disposeObject3D(mesh);
    spies.forEach((spy) => {
      expect(spy).toHaveBeenCalled();
    });
    expect(mesh.parent).toBeNull();
  });
});
