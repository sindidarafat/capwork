import './globals.css';

export const metadata = {
  title: 'CAP Task Board',
  description: 'What the CAP team is working on, what is due, and what is stuck.',
};

export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#1F2D5A' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
