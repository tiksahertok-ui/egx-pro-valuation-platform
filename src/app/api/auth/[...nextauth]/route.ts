import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

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
        // Single-user admin mode: validate against env vars
        const validEmail = process.env.ADMIN_EMAIL
        const validPassword = process.env.ADMIN_PASSWORD
        if (
          credentials.email === validEmail &&
          credentials.password === validPassword
        ) {
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
