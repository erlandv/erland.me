/**
 * Portfolio Content Configuration
 *
 * Defines the structure and data for portfolio project categories displayed on the homepage and portfolio index.
 * Centralizes category metadata including titles, links, icons, and technology tags to ensure consistency across pages.
 *
 * **Key Features:**
 * - `projectCategories`: Array of configured project categories (Web Dev, Cloud Infra, Personal Projects)
 * - `ProjectCategory`: Type definition for category objects
 * - `getProjectsByCategory()`: Helper to fetch and sort projects by category
 * - `getCategoryConfig()`: Helper to get category metadata by ID
 *
 * **Usage:**
 * ```typescript
 * import { projectCategories, getProjectsByCategory } from '@lib/content/portfolio';
 *
 * // Render category cards
 * projectCategories.map(category => (
 *   <Card title={category.title} icon={category.icon} tags={category.tags} />
 * ));
 *
 * // Get projects for a specific category
 * const projects = await getProjectsByCategory('web-development');
 * ```
 */

import { getCollection, type CollectionEntry } from 'astro:content';

type ProjectEntry = CollectionEntry<'portfolio'>;
export type ProjectData = ProjectEntry['data'];

/**
 * Configuration object for a portfolio project category
 * @property title - Display title of the category (e.g., "Web Development")
 * @property href - URL path to the category's detail page
 * @property icon - Icon name to be used with the Icon component
 * @property tags - Array of technology names/tools associated with this category
 * @property extraImageClass - Optional CSS class for specific image styling adjustments
 */
export interface ProjectCategory {
  title: string;
  href: string;
  icon: string;
  tags: string[];
  extraImageClass?: string;
}

/**
 * List of portfolio project categories
 * Contains configuration for Web Development, Cloud Infrastructure, and Personal Projects.
 * Used to generate project cards on the homepage (first 2) and portfolio page (all).
 */
export const projectCategories: ProjectCategory[] = [
  {
    title: 'Web Development',
    href: '/portfolio/web-development/',
    icon: 'portfolioWeb',
    tags: [
      'Node.js',
      'TypeScript',
      'Next.js',
      'React',
      'Tailwind CSS',
      'Vite',
      'PostgreSQL',
      'Git',
    ],
  },
  {
    title: 'Cloud Infra',
    href: '/portfolio/cloud-infra/',
    icon: 'portfolioInfra',
    extraImageClass: 'devops-img',
    tags: [
      'Terraform',
      'Docker',
      'Kubernetes',
      'Bash',
      'Github Actions',
      'AWS',
      'Azure',
      'GCP',
    ],
  },
  {
    title: 'Personal Projects',
    href: '/portfolio/personal-projects/',
    icon: 'portfolioPersonal',
    tags: [
      'Nginx',
      'Apache',
      'Redis',
      'PHP',
      'CSS',
      'JavaScript',
      'MySQL',
      'MariaDB',
      'Certbot',
    ],
  },
];

/**
 * Get category configuration by category ID
 * @param categoryId - Category identifier (e.g., 'web-development', 'cloud-infra', 'personal-projects')
 * @returns Category configuration object
 * @throws Error if category not found
 * @example
 * const config = getCategoryConfig('web-development');
 * console.log(config.title); // "Web Development"
 */
export function getCategoryConfig(categoryId: string): ProjectCategory {
  const category = projectCategories.find(c =>
    c.href.includes(`/${categoryId}/`),
  );

  if (!category) {
    throw new Error(
      `Category "${categoryId}" not found. Available categories: ${projectCategories.map(c => c.href).join(', ')}`,
    );
  }

  return category;
}

/**
 * Fetch and filter portfolio projects by category
 * Returns projects sorted by order field (ascending)
 * @param categoryId - Category identifier matching the category field in content collection
 * @returns Array of project data sorted by order
 * @example
 * const webProjects = await getProjectsByCategory('web-development');
 * webProjects.forEach(p => console.log(p.title));
 */
export async function getProjectsByCategory(
  categoryId: string,
): Promise<ProjectData[]> {
  const allProjects: ProjectEntry[] = await getCollection('portfolio');

  return allProjects
    .filter((p: ProjectEntry) => p.data.category === categoryId)
    .sort(
      (a: ProjectEntry, b: ProjectEntry) =>
        (a.data.order ?? 0) - (b.data.order ?? 0),
    )
    .map((p: ProjectEntry) => p.data);
}
