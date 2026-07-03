# How to add content to Open Source Design

> The website moved from Jekyll to Hugo and the standalone *Articles* section was retired during the information-architecture overhaul. Article-style writing now lives under **Resources**, and event write-ups live under **Events**. This guide explains how to contribute content using the GitHub web interface — no local setup required.

## Where content lives

| You want to add… | Edit / create a file in… |
|------------------|--------------------------|
| A job post | `content/jobs/` (or use the [online form](https://opensourcedesign.net/jobs/job-form/)) |
| An event announcement or write-up | `content/events/` |
| A tool, link, or reading-list entry | `content/resources/_index.md` or `data/bibliography.yaml` |
| An About Us page | `content/about-us/` |

## Submitting content via GitHub

1. Open the relevant folder above on GitHub and choose **Add file → Create new file** (or open an existing file and click the pencil icon to edit it).

2. Give new files a descriptive name. For dated content (events, jobs) start with the date, e.g. `2026-03-15-my-event.md`. Use `-` between words and end with `.md` so it is treated as a [Markdown file](https://www.markdownguide.org/).

3. Start the file with front matter between `---` markers. For example, for an event:

   ```yaml
   ---
   title: "Open Source Design at FOSDEM 2026"
   eventDate: 2026-02-01
   status: upcoming
   location: "Brussels, Belgium"
   ---
   ```

4. Write your content in Markdown below the front matter. Check the formatting and alignment of images, links, and text.

5. Once finished, submit a pull request. It will be reviewed by two Open Source Design community members, who may request changes before it is published.

## Previewing locally (optional)

For larger contributions, clone the repository and run `hugo server` to preview your changes at `http://localhost:1313/` with live reload — styling is compiled in the browser, so only [Hugo](https://gohugo.io/) is needed. See the main [README](../README.md) for full setup instructions.
