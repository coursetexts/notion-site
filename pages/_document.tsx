import * as React from 'react'
import Document, { Head, Html, Main, NextScript } from 'next/document'

import { IconContext } from '@react-icons/all-files'

export default class MyDocument extends Document {
  render() {
    return (
      <IconContext.Provider value={{ style: { verticalAlign: 'middle' } }}>
        <Html lang='en'>
          <Head>
            <link rel='shortcut icon' href='/favicon.ico' />
            {/* <link
              rel='icon'
              type='image/png'
              sizes='32x32'
              href='favicon.png'
            /> */}

            <link rel='manifest' href='/manifest.json' />
            {/* FONT TEST: Fraunces (display) + Inter (text). Revert with git checkout. */}
            <link rel='preconnect' href='https://fonts.googleapis.com' />
            <link
              rel='preconnect'
              href='https://fonts.gstatic.com'
              crossOrigin='anonymous'
            />
            <link
              href='https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..600&family=Inter:wght@300..700&display=swap'
              rel='stylesheet'
            ></link>

            {/* Google Analytics */}
            {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
              <>
                <script
                  async
                  src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
                />
                <script
                  dangerouslySetInnerHTML={{
                    __html: `
                      window.dataLayer = window.dataLayer || [];
                      function gtag(){dataLayer.push(arguments);}
                      gtag('js', new Date());
                      gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
                        page_path: window.location.pathname,
                      });
                    `
                  }}
                />
              </>
            )}
          </Head>

          <body>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                /** Inlined version of noflash.js from use-dark-mode */
                ;(function () {
                  var storageKey = 'darkMode'
                  var classNameDark = 'dark-mode'
                  var classNameLight = 'light-mode'

                  // Always set to light mode
                  function setClassOnDocumentBody() {
                    document.body.classList.add(classNameLight)
                    document.body.classList.remove(classNameDark)
                  }

                  // Set the class on document body to light mode
                  setClassOnDocumentBody()
                  localStorage.setItem(storageKey, false) // Store light mode preference
                })();
                `
              }}
            />
            <Main />

            <NextScript />
          </body>
        </Html>
      </IconContext.Provider>
    )
  }
}
