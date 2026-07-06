# Test Plan - IA migration (Hugo branch)
# opensourcedesign.net

> **Purpose:** Verify that after the IA migration, all old Jekyll URLs
> either redirect correctly or return the expected status in the Hugo
> environment, before merging to `master`.
>
> Run this plan after Phase 1 of `migration-plan-hugo.md` is complete
> and again as a full regression before Phase 5 (merge).

---

## How Hugo aliases differ from Jekyll redirects

Jekyll's `redirect_from` (via the `jekyll-redirect-from` gem) generates
real HTTP 301 redirects served by GitHub Pages' CDN.

Hugo's `aliases` generate **static HTML stub files** with a
`<meta http-equiv="refresh">` tag and a `<link rel="canonical">` header.
GitHub Pages serves these as HTTP 200, not 301. The browser follows the
meta refresh client-side.

**Practical consequence for testing:**
- `curl -I` will return `200` for alias URLs, not `301`.
- To verify a redirect, check for the meta refresh tag in the body, or
  use `curl -L` and verify you land on the correct final URL.
- The test script below uses `-L` (follow redirects) and checks the
  final URL, which works for both 301s and meta-refresh chains.

> **Exception:** `hugo server` (dev mode) serves aliases as true HTTP
> 301s. So local testing with `curl -I` will show 301. The production
> (GitHub Pages) behaviour is meta-refresh. Both are acceptable for
> this site's purposes, but be aware of the difference when
> interpreting curl output.

---

## How to run tests

### Local
```bash
# Start the dev server
hugo server

# In a second terminal, run the test script (see below)
bash docs/test-redirects.sh http://localhost:1313
```

### Build output check (GitHub Pages / production)

**Do not run the test script against a GitHub Pages URL.** On GitHub
Pages, Hugo alias stubs are served as HTTP 200 with a
`<meta http-equiv="refresh">` tag. `curl -L` follows HTTP 3xx headers
but does not parse HTML meta-refresh - it would stop at the 200 and
report every redirect as broken.

Instead, verify the built output directly:

```bash
hugo build

# Each alias should generate an index.html at the old path.
# Spot-check the most important ones:
ls public/goals/index.html              # should exist
ls public/manifesto/index.html          # should exist
ls public/summit/index.html             # should exist
ls public/contribute/index.html         # should exist
ls public/articles/index.html           # should exist → redirects to /resources/
ls public/people/index.html             # should NOT exist (no redirect)

# Verify a redirect stub points to the right destination:
grep -o 'URL=.*"' public/goals/index.html          # should contain /about-us/
grep -o 'URL=.*"' public/manifesto/index.html       # should contain /about-us/manifesto/
grep -o 'URL=.*"' public/summit/index.html          # should contain /events/
```

---

## Pre-flight: known issue to fix before testing

### URL collision in `content/articles/` - fix before Phase 3

Two article files produce the same Hugo URL `/articles/osd-meetup-recap/`:
- `2017-12-14-OSD-meetup-recap.md`
- `2018-07-12-OSD-meetup-recap.md`

Hugo will warn and one will overwrite the other. **Fix: add an explicit
`slug:` or `permalink:` to each file before running any tests.**
Suggested permalinks:
- `2017-12-14-OSD-meetup-recap.md` → `permalink: /2017/12/14/OSD-meetup-recap`
- `2018-07-12-OSD-meetup-recap.md` → `permalink: /2018/07/12/OSD-meetup-recap`

### Articles without `permalink:` need two aliases each

19 of the 24 articles have no `permalink:` in their front matter.
Hugo currently serves them at `/articles/SLUG/` (Hugo default).
The old Jekyll site served them at `/YYYY/MM/DD/SLUG/`.

When each article is moved to `/events/` or `/resources/` (Tasks 3.6,
3.7), it needs **two aliases**:

```yaml
aliases:
  - /articles/osd-nyc-first-meetup/          # current Hugo URL
  - /2017/10/30/osd-nyc-first-meetup/        # old Jekyll URL
```

The 5 articles WITH an explicit `permalink:` already match the old
Jekyll URL and only need one alias (the permalink value).

The full alias requirements are in the **Per-article alias reference**
section at the bottom of this document.

---

## Test script

Save as `docs/test-redirects.sh`. Usage: `bash docs/test-redirects.sh BASE_URL`

```bash
#!/usr/bin/env bash
# Usage: bash test-redirects.sh http://localhost:1313
# Requires: hugo server running at the given BASE URL.
# Do NOT use against a GitHub Pages URL - see "Build output check" above.

BASE="${1:-http://localhost:1313}"
PASS=0
FAIL=0

check_redirect() {
  local old="$1" expected_dest="$2"
  local final expected
  final=$(curl -sS -L -o /dev/null -w '%{url_effective}' "$BASE$old" 2>/dev/null || echo "CURL_ERROR")
  # Normalise trailing slash
  final="${final%/}/"
  expected="${BASE}${expected_dest%/}/"
  if [[ "$final" == "$expected" ]]; then
    echo "  PASS  $old → $expected_dest"
    PASS=$((PASS + 1))
  else
    echo "  FAIL  $old → got $final (expected $expected_dest)"
    FAIL=$((FAIL + 1))
  fi
}

check_200() {
  local path="$1"
  local status
  status=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE$path" 2>/dev/null || echo "000")
  if [[ "$status" == "200" ]]; then
    echo "  PASS  $path returns 200"
    PASS=$((PASS + 1))
  else
    echo "  FAIL  $path returned $status (expected 200)"
    FAIL=$((FAIL + 1))
  fi
}

check_404() {
  local path="$1"
  local status
  status=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE$path" 2>/dev/null || echo "000")
  if [[ "$status" == "404" ]]; then
    echo "  PASS  $path returns 404"
    PASS=$((PASS + 1))
  else
    echo "  FAIL  $path returned $status (expected 404)"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "=== New pages (should return 200) ==="
check_200 /about-us/
check_200 /about-us/manifesto/
check_200 /about-us/how-to-join/
check_200 /about-us/code-of-conduct/
check_200 /about-us/governance/
check_200 /about-us/by-laws/
check_200 /forum/
check_200 /imprint/
check_200 /events/
check_200 /resources/
check_200 /jobs/
check_200 /brand/
check_200 /feed.xml

echo ""
echo "=== Static page redirects ==="
check_redirect /goals/              /about-us/
check_redirect /faq/                /about-us/
check_redirect /manifesto/          /about-us/manifesto/
check_redirect /code-of-conduct/    /about-us/code-of-conduct/
check_redirect /governance/         /about-us/governance/
check_redirect /processes/          /about-us/governance/
check_redirect /by-laws/            /about-us/by-laws/
check_redirect /contribute/         /about-us/how-to-join/
check_redirect /contributing/       /about-us/how-to-join/
check_redirect /people/join/        /about-us/how-to-join/
check_redirect /articles/           /resources/
check_redirect /summit/             /events/
check_redirect /summit/2017         /events/

echo ""
echo "=== Event write-ups: old Jekyll URLs → /events/ ==="
check_redirect /2017/10/30/osd-nyc-first-meetup/                      /events/nyc-meetup-oct-2017/
check_redirect /2017/11/09/osd-nyc-meetup-Recap/                      /events/nyc-meetup-nov-2017/
check_redirect /2017/12/14/OSD-meetup-recap/                          /events/nyc-meetup-dec-2017/
check_redirect /2018/07/12/OSD-meetup-recap/                          /events/nyc-meetup-jul-2018/
check_redirect /2018/12/25/osd-summit-2018/                           /events/osd-summit-2018/
check_redirect /2019/05/31/libre-graphics-meeting-no-design-without-research/ /events/libre-graphics-meeting-2019/
check_redirect /2020/02/01/fosdem-2020/                               /events/fosdem-2020/
check_redirect /2021/05/05/FOSDEM-2021-Open-Source-Design-Devroom-wrap-up/ /events/fosdem-2021/
check_redirect /2021/07/05/FOSS-Backstage-2021-Open-Source-Design-track-support-and-UX-Clinic-wrap-up/ /events/foss-backstage-2021/
check_redirect /2021/07/08/Mozfest-2021-Open-Source-Design-helps-out-Simply-Secure-with-a-UX-Clinic/ /events/mozfest-2021/
check_redirect /2025/02/05/FOSDEM-2025-Open-Source-Design-Devroom-wrap-up/ /events/fosdem-2025/
check_redirect /2025/05/13/FOSSBACKSTAGE-2025-wrap-up/                /events/foss-backstage-2025/

echo ""
echo "=== Event write-ups: old Hugo /articles/ URLs → /events/ ==="
check_redirect /articles/osd-nyc-first-meetup/                        /events/nyc-meetup-oct-2017/
check_redirect /articles/osd-nyc-meetup-recap/                        /events/nyc-meetup-nov-2017/
check_redirect /articles/osd-meetup-recap-dec-2017/                   /events/nyc-meetup-dec-2017/
check_redirect /articles/osd-meetup-recap-jul-2018/                   /events/nyc-meetup-jul-2018/
check_redirect /articles/osd-summit-2018/                             /events/osd-summit-2018/
check_redirect /articles/libre-graphics-meeting-no-design-without-research/ /events/libre-graphics-meeting-2019/
check_redirect /articles/fosdem-2020/                                 /events/fosdem-2020/
check_redirect /articles/fosdem-2021-open-source-design-devroom-wrap-up/ /events/fosdem-2021/
check_redirect /articles/foss-backstage-2021-open-source-design-track-support-and-ux-clinic-wrap-up/ /events/foss-backstage-2021/
check_redirect /articles/mozfest-2021-open-source-design-helps-out-simply-secure-with-a-ux-clinic/ /events/mozfest-2021/
check_redirect /articles/fosdem-2025-open-source-design-devroom-wrap-up/ /events/fosdem-2025/
check_redirect /articles/fossbackstage-2025-wrap-up/                  /events/foss-backstage-2025/

echo ""
echo "=== Resources: old Jekyll URLs → /resources/ ==="
check_redirect /2015/05/23/text-based-tools-for-designers/            /resources/text-based-tools-for-designers/
check_redirect /2015/11/21/5-steps-to-design-a-ux-that-people-love/  /resources/5-steps-to-design-a-ux-that-people-love/
check_redirect /2017/03/27/osd-needs-better-collaboration-tools/      /resources/osd-needs-better-collaboration-tools/
check_redirect /2020/08/13/Use-your-artistic-skills-to-help-open-source/ /resources/use-your-artistic-skills-to-help-open-source/
check_redirect /2020/08/13/beginners-guide-to-open-source-design-by-Victory-Brown/ /resources/beginners-guide/
check_redirect /2020/08/20/COVID19-Illustrations-2020/                /resources/covid19-illustrations-2020/

echo ""
echo "=== Resources: old Hugo /articles/ URLs → /resources/ ==="
check_redirect /articles/osd-needs-better-collaboration-tools/        /resources/osd-needs-better-collaboration-tools/
check_redirect /articles/use-your-artistic-skills-to-help-open-source/ /resources/use-your-artistic-skills-to-help-open-source/
check_redirect /articles/beginners-guide-to-open-source-design-by-victory-brown/ /resources/beginners-guide/
check_redirect /articles/covid19-illustrations-2020/                  /resources/covid19-illustrations-2020/

echo ""
echo "=== Resources: posts with explicit permalink ==="
# These had permalink: in front matter so their Hugo URL == old Jekyll URL
# Only one alias needed (the URL itself becomes the alias when moved)
check_redirect /2015/05/23/text-based-tools-for-designers/            /resources/text-based-tools-for-designers/
check_redirect /2015/11/21/5-steps-to-design-a-ux-that-people-love/  /resources/5-steps-to-design-a-ux-that-people-love/

echo ""
echo "=== Should return 404 (removed, no redirect) ==="
check_404 /people/
check_404 /people/jan-christoph-borchardt/
check_404 /people-form/
check_404 /logos/
check_404 /archive/

echo ""
echo "=== Summary ==="
echo "  Passed: $PASS"
echo "  Failed: $FAIL"
[[ $FAIL -eq 0 ]] && echo "  All checks passed." || echo "  FAILURES DETECTED - review output above."
```

---

## Manual checks (not scriptable)

Run these by hand in a browser or with `hugo server`.

### Navigation
- [ ] Header has exactly 5 items: About Us, Events, Resources, Jobs, Forum
- [ ] "About Us" links to `/about-us/` (not `/goals/`)
- [ ] "Forum" links to `/forum/` (internal page, not directly to Discourse)
- [ ] Active state highlights the correct item on each page
- [ ] Mobile nav (hamburger) shows the same 5 items

### Footer
- [ ] Social icons: GitHub, Mastodon, Open Collective, Forum - **no Twitter**
- [ ] Mastodon links to `https://fosstodon.org/@opensourcedesign` (not `mastodon.social`)
- [ ] Imprint link present and resolves
- [ ] "Brand Assets" link present and resolves to `/brand/`
- [ ] No "Edit this page" or "View source code" links
- [ ] No Code of Conduct link in footer (it's now under About Us)

### Content
- [ ] `/about-us/code-of-conduct/` body contains no Twitter/X links
- [ ] `hugo build` output contains zero `[WARN]` lines mentioning alias conflicts
- [ ] `hugo build` output contains zero `[WARN]` lines mentioning duplicate URLs

### RSS feed
- [ ] `/feed.xml` is reachable and valid XML
- [ ] Feed items link to `/events/` or `/resources/` URLs, not `/articles/` or `/YYYY/MM/DD/` URLs

---

## Per-article alias reference

Use this table when writing `aliases:` front matter in Tasks 3.6 and
3.7. Each row shows the two aliases required for articles without an
existing `permalink:` (the first is the current Hugo URL, the second
is the old Jekyll URL). Articles with an existing `permalink:` only
need the one alias shown.

### Event write-ups (move to `/events/`)

| File | New slug | Alias 1 (current Hugo) | Alias 2 (old Jekyll) |
|------|----------|------------------------|----------------------|
| `2017-10-30-osd-nyc-first-meetup.md` | `nyc-meetup-oct-2017` | `/articles/osd-nyc-first-meetup/` | `/2017/10/30/osd-nyc-first-meetup/` |
| `2017-11-09-osd-nyc-meetup-Recap.md` | `nyc-meetup-nov-2017` | `/articles/osd-nyc-meetup-recap/` | `/2017/11/09/osd-nyc-meetup-Recap/` |
| `2017-12-14-OSD-meetup-recap.md` ⚠️ | `nyc-meetup-dec-2017` | `/articles/osd-meetup-recap-dec-2017/`* | `/2017/12/14/OSD-meetup-recap/` |
| `2018-07-12-OSD-meetup-recap.md` ⚠️ | `nyc-meetup-jul-2018` | `/articles/osd-meetup-recap-jul-2018/`* | `/2018/07/12/OSD-meetup-recap/` |
| `2018-12-25-osd-summit-2018.md` | `osd-summit-2018` | `/articles/osd-summit-2018/` | `/2018/12/25/osd-summit-2018/` |
| `2019-05-31-libre-graphics-meeting-no-design-without-research.md` | `libre-graphics-meeting-2019` | `/articles/libre-graphics-meeting-no-design-without-research/` | `/2019/05/31/libre-graphics-meeting-no-design-without-research/` |
| `2020-02-01-fosdem-2020.md` | `fosdem-2020` | `/articles/fosdem-2020/` | `/2020/02/01/fosdem-2020/` |
| `2021-05-05-FOSDEM-2021-Open-Source-Design-Devroom-wrap-up.md` | `fosdem-2021` | `/articles/fosdem-2021-open-source-design-devroom-wrap-up/` | `/2021/05/05/FOSDEM-2021-Open-Source-Design-Devroom-wrap-up/` |
| `2021-07-05-FOSS-Backstage-2021-*.md` | `foss-backstage-2021` | `/articles/foss-backstage-2021-open-source-design-track-support-and-ux-clinic-wrap-up/` | `/2021/07/05/FOSS-Backstage-2021-Open-Source-Design-track-support-and-UX-Clinic-wrap-up/` |
| `2021-07-08-Mozfest-2021-*.md` | `mozfest-2021` | `/articles/mozfest-2021-open-source-design-helps-out-simply-secure-with-a-ux-clinic/` | `/2021/07/08/Mozfest-2021-Open-Source-Design-helps-out-Simply-Secure-with-a-UX-Clinic/` |
| `2025-02-05-FOSDEM-2025-*.md` | `fosdem-2025` | `/articles/fosdem-2025-open-source-design-devroom-wrap-up/` | `/2025/02/05/FOSDEM-2025-Open-Source-Design-Devroom-wrap-up/` |
| `2025-05-13-FOSSBACKSTAGE-2025-wrap-up.md` | `foss-backstage-2025` | `/articles/fossbackstage-2025-wrap-up/` | `/2025/05/13/FOSSBACKSTAGE-2025-wrap-up/` |

⚠️ These two files currently generate the same Hugo URL - a collision.
Fix by adding explicit `permalink:` to each before moving (see Pre-flight
section above). The "Alias 1" slugs above reflect the corrected state
after adding distinct permalinks.

### Resources (move to `/resources/`)

| File | New slug | Alias 1 (current Hugo or explicit permalink) | Alias 2 (old Jekyll, if different) |
|------|----------|----------------------------------------------|-------------------------------------|
| `2015-05-24-TextbasedToolsForDesigners.md` | `text-based-tools-for-designers` | `/2015/05/23/text-based-tools-for-designers/` *(has permalink)* | - |
| `2015-11-21-5-steps-to-design-a-ux-that-people-love.md` | `5-steps-to-design-a-ux-that-people-love` | `/2015/11/21/5-steps-to-design-a-ux-that-people-love/` *(has permalink)* | - |
| `2017-03-27-osd-needs-better-collaboration-tools.md` | `osd-needs-better-collaboration-tools` | `/articles/osd-needs-better-collaboration-tools/` | `/2017/03/27/osd-needs-better-collaboration-tools/` |
| `2020-08-13-Use-your-artistic-skills-to-help-open-source.md` | `use-your-artistic-skills-to-help-open-source` | `/articles/use-your-artistic-skills-to-help-open-source/` | `/2020/08/13/Use-your-artistic-skills-to-help-open-source/` |
| `2020-08-13-beginners-guide-to-open-source-design-by-Victory-Brown.md` | `beginners-guide` | `/articles/beginners-guide-to-open-source-design-by-victory-brown/` | `/2020/08/13/beginners-guide-to-open-source-design-by-Victory-Brown/` |
| `2020-08-20-COVID19-Illustrations-2020.md` | `covid19-illustrations-2020` | `/articles/covid19-illustrations-2020/` | `/2020/08/20/COVID19-Illustrations-2020/` |

### Posts being deleted (no redirect needed)

These are classified as `remove` in `docs/post-redirect-map.md`. Their
old Jekyll URLs will 404 after migration. No aliases needed.

| Old Jekyll URL |
|----------------|
| `/2015/04/25/welcome-to-open-source-design/` |
| `/2015/05/18/this-month-in-open-source-design/` |
| `/2015/07/10/this-month-in-open-source-design/` |
| `/2016/04/04/interview-with-julia/` |
| `/2021/07/11/Open-Source-Design-milestones-over-the-years/` |
| `/2024/05/09/oss-projects-here-is-how-to-make-a-successful-job-post/` *(unless moved to jobs)* |
