import type { APIRoute } from 'astro';
import { getSite } from '../lib/content';
export const GET: APIRoute = () => new Response(getSite().settings.preview ? 'User-agent: *\nDisallow: /\n' : 'User-agent: *\nAllow: /\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
