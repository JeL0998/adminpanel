import { Html, Head, Main, NextScript } from 'next/document';

export default function MyDocument() {
  return (
    <Html>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Admin Panel for managing the application." />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
