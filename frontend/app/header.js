'use client';

import Head from 'next/head';

const HomePage = () => {
  return (
    <>
      <Head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <link rel="icon" href={metadata.icons.icon} />
      </Head>
      <div>Home | revAMP</div>
    </>
  );
};

export default HomePage;
