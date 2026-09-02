#!/usr/bin/env bash
# Compile Tailwind and optionally install Pagefind. Expects version vars from
# .github/versions.env (loaded into the environment by CI).
set -euo pipefail

: "${TAILWIND_VERSION:?TAILWIND_VERSION must be set}"

npm install --no-save "tailwindcss@${TAILWIND_VERSION}" "@tailwindcss/cli@${TAILWIND_VERSION}"
npx @tailwindcss/cli -i assets/css/main.css -o assets/css/compiled.css --minify

if [[ "${INSTALL_PAGEFIND:-false}" == "true" ]]; then
  : "${PAGEFIND_VERSION:?PAGEFIND_VERSION must be set}"
  : "${PAGEFIND_SHA256:?PAGEFIND_SHA256 must be set}"
  curl -fsSL -o pagefind.tar.gz \
    "https://github.com/Pagefind/pagefind/releases/download/v${PAGEFIND_VERSION}/pagefind-v${PAGEFIND_VERSION}-x86_64-unknown-linux-musl.tar.gz"
  echo "${PAGEFIND_SHA256}  pagefind.tar.gz" | sha256sum --check
  tar -xzf pagefind.tar.gz
  rm pagefind.tar.gz
  chmod +x pagefind
fi
