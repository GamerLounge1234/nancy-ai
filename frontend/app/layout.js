import "./globals.css";

export const metadata = {
  title: "NANCY AI - The Entity's Analyst",
  description: "Dead by Daylight Intelligence System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}