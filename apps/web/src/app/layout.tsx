import type { Metadata } from "next";
import { AuthProvider } from "../contexts/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "KinyoziHub",
  description: "Barber booking platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="font-body-lg bg-background min-h-screen text-on-surface">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
