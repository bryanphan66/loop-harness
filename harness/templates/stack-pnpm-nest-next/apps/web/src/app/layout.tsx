import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '__PROJECT_SLUG__',
  description: 'Walking-skeleton app: auth, users, health',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/*
          Web fonts: loaded via a runtime <link>, NOT `next/font/google`.
          The web Dockerfile's build stage (apps/web/Dockerfile) has no
          network egress to fonts.googleapis.com, so `next/font/google`
          throws at `next build` time and fails the container build.
          A runtime <link> fetches the font in the browser after the page
          loads instead — works the same in a Docker build, CI, or an
          offline dev machine.

          To adopt a Google Font for this project:
          1. Uncomment + swap the stylesheet <link> below for your family
             (pick one at https://fonts.google.com).
          2. Apply it via Tailwind, e.g. a `--font-sans` CSS var in
             globals.css `@theme` (keeps `font-sans` below as the class
             that resolves to it), or an inline `style={{ fontFamily }}`.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        /> */}
      </head>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
