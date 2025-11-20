/**
 * Portfolio Content Configuration
 *
 * Defines the structure and data for portfolio project categories displayed on the homepage and portfolio index.
 * Centralizes category metadata including titles, links, icons, and technology tags to ensure consistency across pages.
 *
 * **Key Features:**
 * - `projectCategories`: Array of configured project categories (Web Dev, Cloud Infra, Personal Projects)
 * - `ProjectCategory`: Type definition for category objects
 *
 * **Usage:**
 * ```typescript
 * import { projectCategories } from '@lib/content/portfolio';
 *
 * // Render category cards
 * projectCategories.map(category => (
 *   <Card title={category.title} icon={category.icon} tags={category.tags} />
 * ));
 * ```
 */

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
