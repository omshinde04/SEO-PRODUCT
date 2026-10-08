import "./globals.css";

export const metadata = {
  title: "SEO Platform",
  description:
    "Discover businesses, places, tourism, guides and local information.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}