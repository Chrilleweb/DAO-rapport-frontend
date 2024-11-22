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
      // Check if the token is not empty or malformed
      if (!token || token === 'undefined') {
        throw new Error('Invalid token');
      }

      const decoded = jwt.verify(token, import.meta.env.VITE_JWT_SECRET);

      // Add user data to event.locals
      event.locals.user = {
        id: decoded.userId,
        firstname: decoded.firstname,
        lastname: decoded.lastname,
        role: decoded.role,
      };
    } catch (err) {
      console.error('Token validation failed:', err);
      event.cookies.delete('token', { path: '/' });
      if (event.url.pathname !== '/login') {
        throw redirect(302, '/login');
      } else {
        return;
      }
    }
  }

  if (
    requiresPasswordChange === 'true' &&
    event.url.pathname !== '/change-password'
  ) {
    throw redirect(302, '/change-password');
  } else if (
    requiresPasswordChange !== 'true' &&
    event.url.pathname === '/change-password'
  ) {
    throw redirect(302, '/');
  }
}
