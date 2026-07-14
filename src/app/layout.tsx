import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Our Creative Catalyst",
  description: "소규모 공연 예매 및 QR 체크인 운영 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
