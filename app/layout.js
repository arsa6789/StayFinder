import "./globals.css";

export const metadata = {
  title: "StayFinder – Hotel Search",
  description: "Search hotels by destination, dates and guests, with price, star and free-cancellation filters.",
  openGraph: {
    title: "StayFinder – Hotel Search",
    description: "Find a hotel for your trip and jump straight to booking.",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f766e",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
