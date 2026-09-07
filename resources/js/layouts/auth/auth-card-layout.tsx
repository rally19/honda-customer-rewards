import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { ArrowLeft } from 'lucide-react';
import ThemeToggle from '@/components/theme-toggle';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { home } from '@/routes';

export default function AuthCardLayout({
    children,
    title,
    description,
}: PropsWithChildren<{
    name?: string;
    title?: string;
    description?: string;
}>) {
    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-6 md:p-10 transition-colors">
            {/* Ambient Red Glow */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[550px] h-[350px] bg-red-500/10 dark:bg-red-600/15 blur-[120px] rounded-full" />
            </div>

            {/* Top Navigation */}
            <header className="relative sm:absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-5 max-w-6xl mx-auto w-full shrink-0 pointer-events-auto">
                <Link
                    href={home()}
                    className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors py-1.5 px-2 -ml-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                    <ArrowLeft className="size-4" />
                    <span>Kembali ke Beranda</span>
                </Link>

                <div className="flex items-center gap-3">
                    <ThemeToggle />
                </div>
            </header>

            <div className="relative z-10 flex w-full max-w-md flex-col gap-6 my-auto pt-4 sm:pt-20 pb-8 animate-smooth-in">
                <div className="flex flex-col items-center gap-2">
                    <Link href={home()} className="flex items-center gap-2 transition-transform hover:scale-105">
                        <img
                            src="/images/logo/anper_logo_red.png"
                            alt="Honda Customer Rewards"
                            className="h-12 w-auto object-contain dark:hidden"
                        />
                        <img
                            src="/images/logo/anper_sartika_logo_white.png"
                            alt="Honda Customer Rewards"
                            className="h-12 w-auto object-contain hidden dark:block"
                        />
                    </Link>
                </div>

                <Card className="rounded-2xl border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 shadow-xl shadow-zinc-950/5 dark:shadow-black/40 overflow-hidden">
                    <div className="h-1 w-full bg-gradient-to-r from-red-500 via-red-600 to-red-700" />
                    <CardHeader className="px-8 pt-8 pb-0 text-center">
                        <CardTitle className="text-xl font-bold">{title}</CardTitle>
                        <CardDescription className="text-sm">{description}</CardDescription>
                    </CardHeader>
                    <CardContent className="px-8 py-8">
                        {children}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
