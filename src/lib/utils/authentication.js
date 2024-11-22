import jwt from 'jsonwebtoken';
import { redirect } from '@sveltejs/kit';

export function validateSession(event) {
  const token = event.cookies.get('token');
  const requiresPasswordChange = event.cookies.get('requiresPasswordChange');

  if (!token && event.url.pathname !== '/login') {
    throw redirect(302, '/login');
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, import.meta.env.VITE_JWT_SECRET);

      // Tilføj brugerdata til event.locals
      event.locals.user = {
        id: decoded.userId,
        firstname: decoded.firstname,
        lastname: decoded.lastname,
        role: decoded.role,
      };
    } catch (err) {
      console.error('Token validation failed:', err);
      event.cookies.delete('token', { path: '/' });
      throw redirect(302, '/login');
    }
  }

  if (requiresPasswordChange === 'true' && event.url.pathname !== '/change-password') {
    throw redirect(302, '/change-password');
  } else if (requiresPasswordChange !== 'true' && event.url.pathname === '/change-password') {
    throw redirect(302, '/');
  }
}
