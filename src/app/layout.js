import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "CHATFLIX",
  description: "당신의 영화 덕질메이트, 챗플릭스",
  icons: {
    icon: "/chatflix2.ico"
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
