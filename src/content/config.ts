import { defineCollection, z } from 'astro:content';

const demos = defineCollection({
	// Type-check frontmatter using a schema
	schema: z.object({
		title: z.string(),
		// description: z.string(),
		// Transform string to Date object
		pubDate: z.coerce.date(),
		// updatedDate: z.coerce.date().optional(),
		heroImage: z.string().optional(),
		script: z.string().optional(),
	}),
});

export const collections = { demos };
