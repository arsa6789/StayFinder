import "./globals.css";

export const metadata = {
  title: "StayFinder – Find your next escape",
  description: "Search hotels by destination, dates and guests, with price, star and free-cancellation filters.",
  openGraph: {
    title: "StayFinder – Find your next escape",
    description: "Search stays and jump straight to booking.",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f2ed" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1019" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
