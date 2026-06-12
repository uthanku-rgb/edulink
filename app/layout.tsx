import type { Metadata } from "next";
import "./globals.css";
import ToastProvider from "../components/ToastProvider";

export const metadata: Metadata = {
  title: "에듀링크 · 매니저 포털",
  description: "정연학원 에듀링크 매니저 단독 운영 콘솔",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
