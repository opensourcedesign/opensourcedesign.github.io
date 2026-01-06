# [opensourcedesign.net](https://opensourcedesign.net)

Website of the Open Source Design community, built with [Hugo](https://gohugo.io/) and [Tailwind CSS](https://tailwindcss.com/), hosted on GitHub Pages.

[![Backers on Open Collective](https://opencollective.com/opensourcedesign/backers/badge.svg)](#backers) [![Sponsors on Open Collective](https://opencollective.com/opensourcedesign/sponsors/badge.svg)](#sponsors) [![Twitter Follow](https://img.shields.io/twitter/follow/opensrcdesign?style=social)](https://twitter.com/opensrcdesign)

## How to Contribute

There are several ways to edit content on [opensourcedesign.net](https://opensourcedesign.net), all of which require a GitHub account:

1. **Using GitHub's file editor** - Quick edits directly in your browser. Navigate to any file, click the pencil icon, and submit a pull request.

2. **Using Gitpod** - A preconfigured cloud IDE with live preview. Click the button below to get started instantly:

   [![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/opensourcedesign/opensourcedesign.github.io)

3. **Setting up locally** - For more extensive development work. See the instructions below.

## Local Development Setup

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 20 or higher) - Required by Tailwind CSS v4. [Download Node.js](https://nodejs.org/)
- **Hugo** (extended version recommended)
- **Git** - [Download Git](https://git-scm.com/)

#### Installing Hugo

**macOS (using Homebrew):**
```bash
brew install hugo
```

**Linux (Debian/Ubuntu):**
```bash
# Download the latest extended .deb from GitHub releases
# Check https://github.com/gohugoio/hugo/releases for the latest version
wget https://github.com/gohugoio/hugo/releases/download/v0.154.3/hugo_extended_0.154.3_linux-amd64.deb
sudo dpkg -i hugo_extended_0.154.3_linux-amd64.deb

# Verify installation
hugo version
```

**Linux (Arch):**
```bash
sudo pacman -S hugo
```

**Linux (Fedora):**
```bash
sudo dnf install hugo
```

**Windows (using Chocolatey):**
```bash
choco install hugo-extended
```

**Windows (using Scoop):**
```bash
scoop install hugo-extended
```

For other platforms, download from the [Hugo releases page](https://github.com/gohugoio/hugo/releases).

### Installation Steps

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/YOUR-USERNAME/opensourcedesign.github.io.git
   cd opensourcedesign.github.io
   ```

2. **Install Node.js dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

   This runs both Tailwind CSS (watching for changes) and Hugo's development server with live reload.

4. **Open your browser** at `http://localhost:1313/`

## Project Structure

```
opensourcedesign.github.io/
├── archetypes/       # Hugo content templates for new pages
├── assets/
│   └── css/
│       ├── main.css    # Tailwind CSS source (edit this!)
│       └── output.css  # Generated CSS (gitignored, don't edit)
├── content/          # All website content in Markdown
│   ├── articles/     # Blog posts and articles
│   ├── events/       # Event announcements
│   ├── jobs/         # Job listings
│   ├── people/       # Community member profiles
│   └── ...           # Other pages (goals, manifesto, etc.)
├── data/             # YAML data files for dynamic content
├── layouts/          # Hugo HTML templates
├── static/           # Static assets (images, fonts, downloads)
│   └── images/
│       └── brand/    # Official logos and branding assets
├── hugo.toml         # Hugo configuration
└── package.json      # npm scripts and dependencies
```

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (CSS + Hugo with live reload) |
| `npm run build` | Build for production (minified CSS + Hugo) |
| `npm run css:build` | Build Tailwind CSS only |
| `npm run css:watch` | Watch and rebuild CSS on changes |
| `npm run hugo:dev` | Run Hugo development server only |
| `npm run hugo:build` | Build Hugo site only |

## Technology Stack

- **[Hugo](https://gohugo.io/)** - Fast static site generator written in Go
- **[Tailwind CSS v4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[@tailwindcss/typography](https://tailwindcss.com/docs/typography-plugin)** - Beautiful typographic defaults for Markdown content

## Edit Content

### Adding a Job Post

1. Navigate to `content/jobs/`
2. Create a new `.md` file following the existing format
3. Or use the online form at [opensourcedesign.net/jobs/job-form/](https://opensourcedesign.net/jobs/job-form/)

### Adding an Event

1. Navigate to `content/events/`
2. Create a new `.md` file with the date in the filename (e.g., `2025-03-15-event-name.md`)
3. Fill in the frontmatter with event details (date, location, etc.)

### Adding a Person

1. Navigate to `content/people/`
2. Create a folder with your name (e.g., `john-doe/`)
3. Add an `index.md` file with your profile information
4. Optionally add a profile image in the same folder
5. Or use the online form at [opensourcedesign.net/people/join/](https://opensourcedesign.net/people/join/)

### Adding an Article

1. Navigate to `content/articles/`
2. Create a new `.md` file with the date prefix (e.g., `2025-01-15-article-title.md`)
3. Add frontmatter with title, author, and tags

## Data Files

Content that appears on multiple pages is managed through YAML files in `data/`:

| File | Description |
|------|-------------|
| `social.yaml` | Social media links and icons |
| `supporters.yaml` | Supporter/sponsor logos |
| `conferences.yaml` | Conference partnerships |
| `affiliates.yaml` | Affiliate organizations |
| `tools.yaml` | Featured open source design tools |
| `quicklinks.yaml` | Footer navigation links |
| `summits.yaml` | Past summit event information |

## Styling Guidelines

The site uses Tailwind CSS v4 with CSS-based configuration. To modify styles:

1. Edit `assets/css/main.css` for custom components and base styles
2. Use Tailwind utility classes directly in HTML templates (`layouts/`)
3. Run `npm run dev` to see changes with live reload

Custom component classes (prefixed with `osd-`) are defined in `main.css`:
- `.osd-card` - Card component styling
- `.osd-pill` - Tag/badge styling
- `.osd-prose` - Article content styling
- `.osd-lightbox-*` - Image lightbox components

## 👩‍🚀 Contributors, Backers & Sponsors

This project exists thanks to all the **people who contribute**.

<a href="graphs/contributors"><img src="https://opencollective.com/opensourcedesign/contributors.svg?width=890&button=false" /></a>

Thank you to **all our backers**! 🙏 ([Become a backer](https://opencollective.com/opensourcedesign#backer))

<a href="https://opencollective.com/opensourcedesign#backers" target="_blank"><img src="https://opencollective.com/opensourcedesign/backers.svg?width=890"></a>

**Support this project by becoming a sponsor.** ([Become a sponsor](https://opencollective.com/opensourcedesign#sponsor))

<a href="https://opencollective.com/opensourcedesign/sponsor/0/website" target="_blank"><img src="https://opencollective.com/opensourcedesign/sponsor/0/avatar.svg"></a>

## ♥ Code of Conduct

Please note that Open Source Design has a [Contributor Code of Conduct](https://opensourcedesign.net/code-of-conduct/). By participating in this project online or at events you agree to abide by its terms.

## 📜 License

**🔀 You can use & modify everything as long as you credit [Open Source Design](https://opensourcedesign.net) and use the same license for your resulting work.**

- Code: [AGPLv3](https://www.gnu.org/licenses/agpl-3.0.en.html)
- Content: [Creative Commons Attribution-ShareAlike 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
