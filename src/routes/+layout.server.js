import { validateSession } from '$lib/utils/authentication';

export async function load(event) {
  validateSession(event);
  return {
    user: event.locals.user,
  };
}
