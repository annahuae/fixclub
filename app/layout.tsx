import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fixclub — repair reviews in the UAE',
  description:
    'A private community for trusted repair specialist and shop reviews in the UAE',
  robots: 'noindex, nofollow'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const ymId = process.env.NEXT_PUBLIC_YM_ID;
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        {children}
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
        {ymId && (
          <>
            <Script id="ym-init" strategy="afterInteractive">
              {`
                (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                m[i].l=1*new Date();
                for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
                k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
                (window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=${ymId}', 'ym');
                ym(${ymId}, 'init', {ssr:true, webvisor:true, clickmap:true, accurateTrackBounce:true, trackLinks:true});
              `}
            </Script>
            <noscript>
              <div>
                <img
                  src={`https://mc.yandex.ru/watch/${ymId}`}
                  style={{ position: 'absolute', left: '-9999px' }}
                  alt=""
                />
              </div>
            </noscript>
          </>
        )}
      </body>
    </html>
  );
}
