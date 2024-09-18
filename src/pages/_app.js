// src/pages/_app.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth } from '@/lib/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import '@/styles/globals.css';
import localFont from 'next/font/local';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Spinner from '@/components/Spinner';
import ProtectedRoute from '@/components/ProtectedRoute';

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

// Define routes that do not require authentication
const noAuthRequired = ['/', '/register', '/forgot-password'];

function MyApp({ Component, pageProps }) {
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleRouteChangeStart = () => setLoading(true);
    const handleRouteChangeComplete = () => setLoading(false);
    const handleRouteChangeError = () => setLoading(false);

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    router.events.on('routeChangeError', handleRouteChangeError);

    const checkAuth = async () => {
      return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          setAuthChecked(true);
          if (!user && !noAuthRequired.includes(router.pathname)) {
            router.push('/'); // Redirect to login if not authenticated
          }
          unsubscribe();
          resolve();
        });
      });
    };

    checkAuth();

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
      router.events.off('routeChangeError', handleRouteChangeError);
    };
  }, [router]);

  if (!authChecked) {
    return <Spinner />;
  }

  return (
    <main className={`${robotoSans.variable} ${robotoMono.variable}`}>
      {noAuthRequired.includes(router.pathname) ? (
        <Component {...pageProps} />
      ) : (
        <ProtectedRoute>
          <Component {...pageProps} />
        </ProtectedRoute>
      )}
      <ToastContainer />
    </main>
  );
}

export default MyApp;
