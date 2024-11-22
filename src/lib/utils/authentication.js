import jwt from 'jsonwebtoken';
import { redirect } from '@sveltejs/kit';
import ipRangeCheck from 'ip-range-check';

const allowedIPs = (import.meta.env.VITE_ALLOWED_IPS || '').split(',');

export function validateSession(event) {
    let clientIP = event.getClientAddress();

  // If behind a proxy, use X-Forwarded-For
  const xForwardedFor = event.request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    clientIP = xForwardedFor.split(',')[0].trim();
  }

  const isAllowed = allowedIPs.some((range) => ipRangeCheck(clientIP, range));

  if (!isAllowed) {
    if (event.url.pathname !== '/not-allowed') {
      throw redirect(302, '/not-allowed');
    } else {
      return;
    }
  }

  if (isAllowed && event.url.pathname === '/not-allowed') {
    throw redirect(302, '/');
  }

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
