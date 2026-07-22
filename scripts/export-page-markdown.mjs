/**
 * Static export cannot use Next.js rewrites at runtime (unlike docs' `next start`).
 * Copy each pre-rendered LLM markdown file to a page-relative `.md` URL so that
 * `/cn/foo/bar.md` works when serving the `out/` directory.
 *
 * Source : out/llms.mdx/docs/{locale}/.../content.md
 * Target : out/{page-path}.md  (en drops the locale prefix; cn keeps /cn)
 */
import { cpSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(import.meta.url), '..', '..');
const outDir = join(root, 'out');
const llmsNamespaceDir = join(outDir, 'llms.mdx');
const llmsDocsDir = join(llmsNamespaceDir, 'docs');

function walkContentFiles(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      walkContentFiles(path, files);
      continue;
    }
    if (entry === 'content.md') files.push(path);
  }
  return files;
}

function toPageMarkdownPath(contentPath) {
  const relative = contentPath
    .slice(llmsDocsDir.length + 1)
    .replace(/\/content\.md$/, '.md');

  const [locale, ...segments] = relative.replace(/\.md$/, '').split('/');
  const pagePath = locale === 'en' ? segments.join('/') : [locale, ...segments].join('/');
  return join(outDir, `${pagePath}.md`);
}

let exported = 0;

for (const contentPath of walkContentFiles(llmsDocsDir)) {
  const targetPath = toPageMarkdownPath(contentPath);
  mkdirSync(dirname(targetPath), { recursive: true });
  cpSync(contentPath, targetPath);
  exported += 1;
}

// The `/llms.mdx/...` route is only a build-time staging area for the pretty
// page-relative `.md` files; nothing links to it, so drop it from the shipped
// output to avoid duplicate files and a leaked ugly URL namespace.
rmSync(llmsNamespaceDir, { recursive: true, force: true });

console.log(`Exported ${exported} page markdown files next to doc routes.`);
