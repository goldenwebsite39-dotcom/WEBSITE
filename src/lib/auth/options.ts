import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        // For MVP: Simple admin authentication
        // In production, use a proper database with hashed passwords
        const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
        const adminPassword = process.env.ADMIN_PASSWORD;

        // Check if email is in admin list
        const isAdminEmail = adminEmails.some(
          adminEmail => adminEmail.trim().toLowerCase() === credentials.email.toLowerCase()
        );

        if (!isAdminEmail) {
          throw new Error('Not authorized');
        }

        // Check password
        if (credentials.password !== adminPassword) {
          throw new Error('Invalid password');
        }

        // Return user object
        return {
          id: credentials.email,
          email: credentials.email,
          name: credentials.email.split('@')[0],
          role: 'admin',
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.sub) {
          session.user.id = token.sub;
        }
        if (token.role) {
          session.user.role = token.role as string;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
