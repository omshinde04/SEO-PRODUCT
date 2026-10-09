import "./globals.css";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "nearfolk — Good things, close by",
    template: "%s | nearfolk",
  },
  description:
    "Discover trusted local businesses, hidden gems, places to stay, food spots and experiences around Ghoti, Igatpuri and Nashik.",
  applicationName: "nearfolk",
  openGraph: {
    title: "nearfolk — Good things, close by",
    description:
      "A more thoughtful way to discover the businesses, people and places that make a place feel like home.",
    type: "website",
    locale: "en_IN",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-IN">
      <body>{children}</body>
    </html>
  );
}
