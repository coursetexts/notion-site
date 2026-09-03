import Head from 'next/head'
import React from 'react'

const CourseMaterialsLicense = () => {
  return (
    <>
      <Head>
        <title>Coursetexts Course Materials License 1.0</title>
        <meta
          name='description'
          content='Terms for reusing Coursetexts course materials, including the paid-license requirement for AI training.'
        />
      </Head>
      <div className='notion notion-app'>
        <div className='notion-frame'>
          <header className='notion-header'>
            <div className='notion-nav-header'>
              <div className='breadcrumbs'>
                <div className='breadcrumb active'>
                  <span className='title'>Coursetexts</span>
                </div>
                <nav className='nav-container'>
                  <a href='/' className='nav-link'>
                    Coursetexts
                  </a>
                  <a
                    href='/about-9a2ace4be0dc4d928e7d304a44a6afe8'
                    className='nav-link'
                  >
                    About
                  </a>
                </nav>
              </div>
            </div>
          </header>
          <div className='notion-page-scroller'>
            <main
              style={{ marginBottom: '2rem' }}
              className='notion-page notion-page-no-cover notion-page-has-icon notion-page-has-text-icon notion-full-page'
            >
              <h1 className='notion-title'>
                Coursetexts Course Materials License 1.0
              </h1>
              <p style={{ marginBottom: '1rem' }} className='notion-text'>
                Effective September 3, 2026
              </p>
              <p style={{ marginBottom: '2rem' }} className='notion-text'>
                This is a custom license. It is not a Creative Commons license.
              </p>

              <h2 style={{ marginBottom: '1rem' }}>1. Scope</h2>
              <p style={{ marginBottom: '2rem' }} className='notion-text'>
                This license applies to course materials that Coursetexts makes
                available with a notice referring to this license (the{' '}
                <span>&quot;Course Materials&quot;</span>), but only to the
                extent that Coursetexts or the identified content provider has
                the legal right to license them. Material identified as
                belonging to a third party remains subject to that third
                party&apos;s terms.
              </p>

              <h2 style={{ marginBottom: '1rem' }}>
                2. Permission for uses other than AI Training
              </h2>
              <p style={{ marginBottom: '1rem' }} className='notion-text'>
                Except for AI Training as defined below, you may share and adapt
                the Course Materials for non-commercial purposes under the same
                permissions and conditions as the Creative Commons
                Attribution-NonCommercial-ShareAlike 4.0 International license
                (CC BY-NC-SA 4.0). In particular, you must:
              </p>
              <ul
                style={{ marginBottom: '1rem' }}
                className='notion-list notion-list-disc'
              >
                <li>
                  give appropriate credit, provide a link to this license, and
                  indicate if you made changes;
                </li>
                <li>
                  not use the Course Materials for commercial purposes; and
                </li>
                <li>distribute adaptations under this same license.</li>
              </ul>
              <p style={{ marginBottom: '2rem' }} className='notion-text'>
                The{' '}
                <a
                  href='https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode.en'
                  target='_blank'
                  rel='noreferrer'
                >
                  CC BY-NC-SA 4.0 license text
                </a>{' '}
                supplies the baseline permissions and conditions only where this
                custom license does not state otherwise.
              </p>

              <h2 style={{ marginBottom: '1rem' }}>
                3. Paid license required for AI Training
              </h2>
              <p style={{ marginBottom: '1rem' }} className='notion-text'>
                The permission in Section 2 does not include AI Training,
                whether commercial or non-commercial. You may use any Course
                Materials for AI Training only after:
              </p>
              <ol
                style={{
                  marginBottom: '1rem',
                  listStyle: 'decimal',
                  paddingLeft: '1.7em'
                }}
                className='notion-list'
              >
                <li>
                  obtaining a separate written license from Coursetexts; and
                </li>
                <li>
                  paying Coursetexts the fee agreed in that written license.
                </li>
              </ol>
              <p style={{ marginBottom: '1rem' }} className='notion-text'>
                <span>&quot;AI Training&quot;</span> means using any Course
                Materials, in whole or in part, as data to train, pre-train,
                fine-tune, retrain, distill, or otherwise adjust the weights or
                parameters of an artificial-intelligence or machine-learning
                model, including placing the Course Materials in a dataset
                intended for any of those purposes.
              </p>
              <p style={{ marginBottom: '2rem' }} className='notion-text'>
                To request an AI Training license, contact{' '}
                <a href='mailto:coursetexts@mit.edu'>coursetexts@mit.edu</a>.
                Payment is required for every AI Training use.
              </p>

              <h2 style={{ marginBottom: '1rem' }}>
                4. Exceptions and limitations
              </h2>
              <p style={{ marginBottom: '2rem' }} className='notion-text'>
                This license does not restrict any use that does not require
                permission under applicable copyright or similar law, including
                applicable fair-use, fair-dealing, or other statutory
                exceptions.
              </p>

              <h2 style={{ marginBottom: '1rem' }}>
                5. Previously granted licenses
              </h2>
              <p style={{ marginBottom: '2rem' }} className='notion-text'>
                This license applies prospectively to Course Materials made
                available with notice of this license on or after September 3,
                2026. It does not revoke any Creative Commons license or other
                permission validly granted before that date.
              </p>

              <h2 style={{ marginBottom: '1rem' }}>6. Disclaimer</h2>
              <p style={{ marginBottom: '2rem' }} className='notion-text'>
                The Course Materials are provided{' '}
                <span>&quot;as is,&quot;</span> without warranties of any kind.
                To the fullest extent permitted by law, Coursetexts and the
                content providers will not be liable for claims or damages
                arising from their use.
              </p>

              <p style={{ marginBottom: '2rem' }} className='notion-text'>
                This license forms part of the Coursetexts{' '}
                <a href='/terms-of-service'>Terms of Service</a>.
              </p>
            </main>
          </div>
        </div>
      </div>
    </>
  )
}

export default CourseMaterialsLicense
