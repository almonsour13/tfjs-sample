import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ModelProvider } from "@/context/model-context";
import { MetaData } from "@/constant/metaData";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});
export const metadata: Metadata = {
    title: MetaData.title,
    description:
        "A web-based application for managing mango tree health and diagnosing diseases using leaf image analysis.",
    category: "website",
    generator: "Next.js", // framework used
    icons: {
        icon: MetaData.icons.icon,
    },
    manifest: "/manifest.json",
};
export const viewport: Viewport = {
    themeColor: "#FFFFFF",
    userScalable: false,
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
};
export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background`}
            >
                <ModelProvider>
                    {children}
                    <Toaster />
                </ModelProvider>
            </body>
        </html>
    );
}
