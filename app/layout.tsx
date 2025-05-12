import type { Metadata } from "next";
// import localFont from "next/font/local";
import "./globals.css";
import { Nunito } from "next/font/google";
import { Toaster } from "sonner";

// const geistSans = localFont({
//   src: "./fonts/GeistVF.woff",
//   variable: "--font-geist-sans",
//   weight: "100 900",
// });
// const geistMono = localFont({
//   src: "./fonts/GeistMonoVF.woff",
//   variable: "--font-geist-mono",
//   weight: "100 900",
// });
const nunito = Nunito({ subsets: ["latin"],weight:['1000','900','800','700','600','500','400','300','200'] });

export const metadata: Metadata = {
  title: "LOSO Analytics",
  description: "Advanced tools to assess Course Learning Outcomes (CLOs), Program Learning Outcomes (PLOs), and Student Outcomes (SOs). Perform KR20 Analysis and categorize questions by difficulty, from very easy to very difficult. Optimize educational outcomes today!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${nunito.className}  antialiased`}
      >
        <Toaster richColors />
        {children}
      </body>
    </html>
  );
}
