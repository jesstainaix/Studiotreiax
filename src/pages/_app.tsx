import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import Head from 'next/head'

const inter = Inter({ subsets: ['latin'] })

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <SessionProvider session={session}>
      <Head>
        <title>Estúdio IA de Vídeos - Treinamentos de Segurança</title>
        <meta name="description" content="Plataforma de criação de vídeos de treinamento em segurança do trabalho com IA" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={inter.className}>
        <Component {...pageProps} />
        <Toaster position="top-right" richColors />
      </div>
    </SessionProvider>
  )
}