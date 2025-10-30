import type { APIRoute } from 'astro';

const FAVICON_PATH = '/assets/favicon/favicon.ico';

export const GET: APIRoute = ({ redirect }) => redirect(FAVICON_PATH, 308);
