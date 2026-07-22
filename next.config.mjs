import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  reactStrictMode: true,
  // Static export cannot use the Next.js image optimizer.
  images: {
    unoptimized: true,
  },
  // Pin the workspace root: the repo has sibling lockfiles, and Next would
  // otherwise infer the wrong root directory.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default withMDX(config);
