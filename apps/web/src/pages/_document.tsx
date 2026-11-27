import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="description" content="MobCheck - Check Before You Buy. Professional mobile phone inspection marketplace." />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="theme-color" content="#0b1220" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
