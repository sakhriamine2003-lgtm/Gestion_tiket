import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getSession } from "@backend/auth/session";
import { AppNavigation } from "@frontend/components/AppNavigation";
const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});
const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});
export const metadata = {
    title: "SOFIMED | Gestion SAV",
    description: "Application de gestion du service après-vente SOFIMED.",
};
export default async function RootLayout({ children }) {
    const user = await getSession();
    return (<html lang="fr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-screen flex bg-[#f7f9fc] text-slate-900">
        {user ? <AppNavigation user={user}/> : null}
        <div className="min-w-0 flex-1">{children}</div>
      </body>
    </html>);
}
