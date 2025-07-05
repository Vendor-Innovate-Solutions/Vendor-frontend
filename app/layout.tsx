import { ThemeProvider } from "@/components/contexts/ThemeProvider";
import type { Metadata } from "next";
import "@/styles/global.css";

export const metadata: Metadata = {
  title: "Vendor",
  description: "Starting something new!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
        
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
