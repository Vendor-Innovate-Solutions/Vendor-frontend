"use client";
import React from 'react';
import { Navbar } from '@/components/manufacturer/nav_bar';
import { Toaster } from 'sonner';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <Navbar />
      <main>{children}</main>
      <Toaster position="top-right" richColors />
    </div>
  );
}