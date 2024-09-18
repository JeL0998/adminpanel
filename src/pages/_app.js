import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import '@/styles/globals.css';
import localFont from 'next/font/local';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Spinner from '@/components/Spinner';
import Head from 'next/head';

// Load local fonts with Next.js font loader
const robotoSans = localFont({
  src: '../fonts/RobotoRegular.ttf',
  variable: '--font-roboto-sans',
  weight: '100 900',
});
const robotoMono = localFont({
  src: '../fonts/RobotoMono.ttf',
  variable: '--font-roboto-mono',
  weight: '100 900',
});

function MyApp({ Component, pageProps }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleRouteChangeStart = () => setLoading(true);
    const handleRouteChangeComplete = () => setLoading(false);
    const handleRouteChangeError = () => setLoading(false);

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    router.events.on('routeChangeError', handleRouteChangeError);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
      router.events.off('routeChangeError', handleRouteChangeError);
    };
  }, [router]);

  return (
    <main className={`${robotoSans.variable} ${robotoMono.variable}`}>
      <Head>
        <title>Admin Panel</title>
      </Head>
      <Component {...pageProps} />
      <ToastContainer />
    </main>
  );
}

export default MyApp;
