# Product

## Register

brand

## Users

- **Designers curious about open source**: exploring how to contribute, looking for projects, community, and guidance. Often arrive via the jobs board or a conference talk (FOSDEM). Context: casual browsing, evaluating whether this community is credible and welcoming.
- **Open source maintainers and developers**: posting design jobs, seeking design help for their projects. Context: task-driven, want to post/find quickly and trust the venue.
- **Community members**: returning for events, meeting notes, resources, and the forum. Context: habitual, low-friction visits.

The job to be done: connect designers with open source work, and prove — through the site itself — that open source and good design belong together.

## Product Purpose

Open Source Design (opensourcedesign.net) is the home of a community of designers and developers pushing more open design processes and improving the user experience of open source software. The site hosts the manifesto, a jobs board, events, curated resources, and community governance documents. Success: a designer lands here and thinks "these people take design seriously" — then joins, posts, or contributes.

## Brand Personality

Editorial, confident, principled. The site of a design community must itself be an argument for design: strong typographic hierarchy, generous whitespace, restraint over decoration. Warm enough to feel like a community, rigorous enough to feel like a discipline. Three words: **editorial, credible, welcoming**.

## Anti-references

- **Generic SaaS template**: hero + three feature cards + testimonial strip. This is a community, not a product pitch.
- **Corporate foundation site**: dry, bureaucratic, committee-written. The Linux Foundation press-page look.
- **Trend-chasing**: glassmorphism, gradient text, neo-brutalist borders, floating blobs. Fashion ages; typography doesn't.
- **Documentation-site plainness**: unstyled walls of text with default link blue. Content-first must not mean design-absent.

## Design Principles

1. **Practice what we preach**: the site is the community's portfolio. Every page must survive scrutiny from professional designers.
2. **Typography carries the design**: hierarchy through scale and weight, not boxes. Cards only where they are genuinely the best affordance.
3. **Content over chrome**: the manifesto, jobs, and events are the substance; the design frames them, never competes.
4. **Open by construction**: monochrome-first (the logo is pure black), openly licensed assets, semantic HTML, no dark patterns.
5. **Accessible is non-negotiable**: a community about inclusive design ships an inclusive site.

## Accessibility & Inclusion

- Target WCAG 2.1 AA throughout (contrast, focus visibility, keyboard navigation, skip links).
- Honors OS-level preferences already wired in code: `prefers-reduced-motion` (animations disabled), `prefers-contrast: more` (darkened muted text, stronger borders).
- Single H1 per page, proper heading outline, descriptive link text, `alt` text on content images — maintained by render hooks and prior audits; do not regress.
- Touch targets ≥ 44px on interactive controls.
