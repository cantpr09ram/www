import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			isdrift: z.boolean().optional().default(false),
			heroImage: image().optional(),
			series: z
				.object({
					title: z.string(),
					slug: z.string(),
					order: z.number(),
				})
				.optional(),
		}),
});

const pages = defineCollection({
	loader: glob({ base: "./src/content/pages", pattern: "*.{md,mdx}" }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
	}),
});

export const collections = { blog, pages };
