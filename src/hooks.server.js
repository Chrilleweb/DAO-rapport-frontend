import { validateSession } from '$lib/utils/authentication';

export async function handle({ event, resolve }) {
  validateSession(event);
  return resolve(event);
}
