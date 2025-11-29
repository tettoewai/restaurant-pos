export default function Head() {
  const canonicalUrl = "/";

  return (
    <>
      <title>T-Restaurant POS | QR Ordering & Backoffice Suite</title>
      <meta
        name="description"
        content="Modern restaurant POS with QR code ordering, multi-location management, and warehouse-ready backoffice tools."
      />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content="T-Restaurant POS" />
      <meta property="og:site_name" content="T-Restaurant POS" />
      <meta
        property="og:description"
        content="Deliver a seamless dining experience with QR ordering and full backoffice control."
      />
      <meta property="og:url" content={canonicalUrl} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="T-Restaurant POS" />
      <meta
        name="twitter:description"
        content="Restaurant management made simple with QR ordering and warehouse tools."
      />
    </>
  );
}
