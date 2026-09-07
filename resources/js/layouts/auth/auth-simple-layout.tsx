import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import ThemeToggle from '@/components/theme-toggle';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-6 md:p-10 transition-colors">
            {/* Ambient Red Glow Background */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[550px] h-[350px] bg-red-500/10 dark:bg-red-600/15 blur-[120px] rounded-full" />
                <div className="absolute -bottom-32 right-10 w-[350px] h-[250px] bg-red-600/10 dark:bg-red-600/10 blur-[100px] rounded-full" />
            </div>

            {/* Top Navigation Bar */}
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

            {/* Main Auth Container */}
            <main className="relative z-10 w-full max-w-md my-auto pt-4 sm:pt-20 pb-8 animate-smooth-in">
                <div className="flex flex-col gap-6">
                    {/* Brand Header */}
                    <div className="flex flex-col items-center text-center gap-3">
                        <Link
                            href={home()}
                            className="group flex flex-col items-center gap-2 transition-transform hover:scale-105"
                            title="Honda Customer Rewards"
                        >
                            {/* Logo Anper - Auto switch on light / dark mode */}
                            <div className="relative flex items-center justify-center h-14">
                                <img
                                    src="/images/logo/anper_logo_red.png"
                                    alt="Honda Customer Rewards Logo"
                                    className="h-12 w-auto object-contain dark:hidden"
                                />
                                <img
                                    src="/images/logo/anper_sartika_logo_white.png"
                                    alt="Honda Customer Rewards Logo"
                                    className="h-12 w-auto object-contain hidden dark:block"
                                />
                            </div>
                        </Link>

                        <div className="space-y-1">
                            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-2.5 py-0.5 rounded-full border border-red-200 dark:border-red-900/50">
                                Honda Customer Rewards
                            </span>
                            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                                {title}
                            </h1>
                            {description && (
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Card Wrapper with Red Top Accent */}
                    <div className="relative rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 shadow-xl shadow-zinc-950/5 dark:shadow-black/40 backdrop-blur-sm p-6 sm:p-8 overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-red-600 to-red-700" />
                        {children}
                    </div>

                    {/* Footer text */}
                    <p className="text-center text-xs text-zinc-500 dark:text-zinc-500">
                        &copy; {new Date().getFullYear()} Honda Customer Rewards &bull; Dealer & AHASS Resmi
                    </p>
                </div>
            </main>
        </div>
    );
}
