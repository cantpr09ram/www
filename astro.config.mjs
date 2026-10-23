// @ts-check

import mdx from "@astrojs/mdx";
import { unified } from "@astrojs/markdown-remark";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import rehypeCallouts from "rehype-callouts";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { rehypePele } from "./src/lib/rehype-pele.ts";

// https://astro.build/config
export default defineConfig({
	site: "https://cantpr09ram.cc",
	integrations: [mdx(), sitemap(), react()],
	markdown: {
		processor: unified({
			gfm: true,
			remarkPlugins: [remarkMath],
			rehypePlugins: [
				rehypePele,
				rehypeKatex,
				[rehypeCallouts, { theme: "github" }],
			],
		}),
		syntaxHighlight: {
			type: "shiki",
			excludeLangs: ["math", "mermaid"],
		},
		shikiConfig: {
			themes: {
				light: "github-light",
				dark: "github-dark",
			},
		},
	},
	vite: {
		plugins: [tailwindcss()],
	},
});
