import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
    newUser: '/register',
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAuthPage = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register');
      const isOnHomePage = nextUrl.pathname === '/';
      
      // Handle auth pages
      if (isOnAuthPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL('/chat/new-chat', nextUrl));
        }
        return true; // Allow access to auth pages when not logged in
      }
      
      // Allow access to home page regardless of auth status
      // This prevents redirect loops during logout
      if (isOnHomePage) {
        return true;
      }
      
      // For all other pages, require authentication
      if (isLoggedIn) {
        return true; // Allow access to protected pages when logged in
      }
      
      // Redirect to login for all other pages when not logged in
      return false;
    },
  },
} satisfies NextAuthConfig;
