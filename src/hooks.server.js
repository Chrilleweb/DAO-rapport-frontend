import jwt from 'jsonwebtoken';
import { redirect } from '@sveltejs/kit';

export async function handle({ event, resolve }) {
  const token = event.cookies.get('token'); // Hent token fra cookies

  // Hvis der ikke er en token og brugeren ikke allerede er på login-siden
  if (!token && event.url.pathname !== '/login') {
    throw redirect(302, '/login');
  }

  // Hvis der er en token, verificer den
  if (token) {
    try {
      // Verificér tokenet
      const decoded = jwt.verify(token, import.meta.env.VITE_JWT_SECRET);

      // Hvis token er gyldigt, tilføj brugerdata til event.locals
      event.locals.user = {
        id: decoded.userId,
        firstname: decoded.firstname,
        lastname: decoded.lastname,
        role: decoded.role,
      };

    } catch (err) {
      console.error('Token validation failed:', err);
      // Hvis token er ugyldig, fjern den og redirect til login
      if (event.url.pathname !== '/login') {
        event.cookies.delete('token', { path: '/' }); // Fjern ugyldig token
        throw redirect(302, '/login');
      }
    }
  }

  const requiresPasswordChange = event.cookies.get('requiresPasswordChange');
    if (requiresPasswordChange === 'true' && event.url.pathname !== '/change-password') {
        throw redirect(302, '/change-password');
    } else if (requiresPasswordChange !== 'true' && event.url.pathname === '/change-password') {
        throw redirect(302, '/');
    }

  // Hvis alt er i orden, lad anmodningen fortsætte
  return resolve(event);
}
