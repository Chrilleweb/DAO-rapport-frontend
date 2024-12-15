import { validateSession } from '$lib/utils/authentication';

export async function handle({ event, resolve }) {
	validateSession(event);

	const response = await resolve(event);

	// Tilføj X-Frame-options header
	response.headers.set('X-Frame-options', 'DENY');
	// Tilføj X-Content-Type-Options header
	response.headers.set('X-Content-Type-Options', 'nosniff');

	return response;
}
