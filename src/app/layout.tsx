import "./globals.css"; 

// RootLayout as an async server component with params as a Promise
export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>; // Updated type for Next.js 15
}) {
  return (
    <html lang="en">
      <head>
        <title>Family Tree</title>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}