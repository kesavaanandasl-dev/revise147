import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Revise147 - Spaced Repetition Revision Brain",
  description: "Never forget what you've studied. Adaptive 1-4-7 spaced repetition system designed for tech placement preparation: DSA, DBMS, OS, Networks, and interview preparation.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Revise147",
  },
  formatDetection: {
    telephone: false,
  },
  themeColor: "#0f172a", // Dark mode background color
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
      <body className="min-h-full flex flex-col md:flex-row bg-background text-foreground transition-colors duration-200">
        <ThemeProvider>
          <Sidebar />
          <main className="flex-1 overflow-y-auto px-4 py-6 md:p-8 lg:p-10">
            <div className="max-w-6xl mx-auto w-full">
              {children}
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
