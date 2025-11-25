import { config } from "@/config";
import { prisma } from "@/db";
import { ensureDefaultTenant } from "@/lib/default-tenant";
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: config.googleClientId,
      clientSecret: config.googleClientSecret,
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user.email) return;
      try {
        await ensureDefaultTenant({
          prisma,
          user: {
            email: user.email,
            name: user.name,
            image: user.image,
          },
        });
      } catch (error) {
        console.error("Failed to ensure default tenant:", error);
        throw error;
      }
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
