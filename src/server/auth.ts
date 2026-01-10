import NextAuth, { type DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "~/server/db";
import { compare, hash } from "bcryptjs";
import { env } from "~/env";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

// Rate limiter configuration
const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 5;

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Pin",
      credentials: {
        userId: { label: "User ID", type: "text" },
        pin: { label: "Pin", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.userId || !credentials?.pin) {
          return null;
        }

        const userId = credentials.userId as string;
        const pin = credentials.pin as string;

        // 1. Rate Limiting Check (Database-backed for Vercel/Serverless)
        const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);
        const attempts = await db.loginAttempt.count({
          where: {
            userId: userId,
            createdAt: { gte: windowStart },
          },
        });

        if (attempts >= MAX_ATTEMPTS) {
          throw new Error("Too many attempts. Please try again later.");
        }

        const user = await db.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          return null;
        }

        // 2. First Login: User has no password set.
        if (!user.password) {
          // Trust on first use: Set the pin.
          const hashedPin = await hash(pin, 10);
          await db.user.update({
            where: { id: userId },
            data: { password: hashedPin },
          });
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          };
        }

        // 3. Normal Login: Verify pin.
        const isValid = await compare(pin, user.password);

        if (!isValid) {
          // Log failed attempt
          await db.loginAttempt.create({
            data: { userId: userId },
          });
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    session: ({ session, token }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub!,
        },
      };
    },
    jwt: ({ token, user }) => {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  secret: env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/",
    error: "/",
  },
});
