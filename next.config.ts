import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  // The design samples are plain static files in public/. Next serves a file
  // at its exact path, so /design alone would fall through to the app's 404.
  async redirects() {
    return [
      { source: "/design", destination: "/design/index.html", permanent: false },
    ];
  },
};

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [["remark-gfm"]],
    rehypePlugins: [],
  },
});

export default withMDX(nextConfig);
