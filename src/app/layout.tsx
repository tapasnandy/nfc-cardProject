import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tapqori — Smart Digital Business Cards & NFC Lead Management",
  description:
    "Create, manage, and share your digital identity in 1 tap with Tapqori. Capture real client leads, scan visiting cards with AI, and track sales interactions effortlessly.",
  icons: {
    icon: [
      { url: "/tapqori-favicon.png", type: "image/png" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [
      { url: "/tapqori-favicon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/tapqori-favicon.png"],
  },
  openGraph: {
    title: "Tapqori — Smart NFC Business Cards & Lead Platform",
    description: "1-Tap contact sharing, instant lead capture, and AI card scanning for professionals and enterprise teams.",
    siteName: "Tapqori",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1934" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
