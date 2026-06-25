import "@/app/globals.css";
import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, Great_Vibes } from "next/font/google";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});

const script = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script",
});

const body = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Date Planner",
  description: "Plan something special together",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${display.variable} ${body.variable} ${script.variable} antialiased`}
        suppressHydrationWarning
      >
        <div className="romantic-scene">{children}</div>
      </body>
    </html>
  );
}
