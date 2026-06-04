import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // 1. Try User model with hashed passwords first
        const user = await db.user.findUnique({
          where: { email: credentials.email },
        })

        if (user) {
          const passwordMatch = await bcrypt.compare(credentials.password, user.passwordHash)
          if (passwordMatch) {
            return { id: user.id, email: user.email, name: user.name ?? 'Admin' }
          }
          return null
        }

        // 2. Fallback: single-user admin mode via env vars (for initial setup / migration)
        const validEmail = process.env.ADMIN_EMAIL
        const validPassword = process.env.ADMIN_PASSWORD

        if (credentials.email === validEmail && credentials.password === validPassword) {
          // Auto-create the User record with a hashed password for future logins
          try {
            const salt = await bcrypt.genSalt(12)
            const hash = await bcrypt.hash(validPassword!, salt)
            await db.user.upsert({
              where: { email: validEmail! },
              update: { passwordHash: hash },
              create: {
                email: validEmail!,
                name: 'Admin',
                passwordHash: hash,
                role: 'admin',
              },
            })
          } catch (err) {
            console.error('Failed to auto-create user record:', err)
          }

          return { id: '1', email: validEmail ?? '', name: 'Admin' }
        }

        return null
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/auth/signin' },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
