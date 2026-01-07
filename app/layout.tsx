import { ThemeProvider } from "@/components/contexts/ThemeProvider"
import { AuthProvider } from "@/components/providers/AuthProvider"
import type { Metadata } from "next"
import "@/styles/global.css"


export const metadata: Metadata = {
  title: "Smartchain ERP Software",
  
  description:
    "Starting something new!",
};

export default function RootLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body>

          <ThemeProvider attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange>
          <AuthProvider>
          <main>{children}</main>
          </AuthProvider>
          </ThemeProvider>
        </body>
      </html>
    )
  }