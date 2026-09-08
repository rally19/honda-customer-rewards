import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import ThemeToggle from '@/components/theme-toggle';
import { home } from '@/routes';
import type { AuthLayoutProps, User } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const page = usePage<{ auth?: { user?: User | null } }>();
    const user = page.props.auth?.user;
    const backUrl = user
        ? user.role === 'admin'
            ? '/admin/dashboard'
            : '/dashboard'
        : home();

    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center bg-zinc-50 p-4 transition-colors sm:p-6 md:p-10 dark:bg-zinc-950">
            {/* Ambient Red Glow Background */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-32 left-1/2 h-[350px] w-[550px] -translate-x-1/2 rounded-full bg-red-500/10 blur-[120px] dark:bg-red-600/15" />
                <div className="absolute right-10 -bottom-32 h-[250px] w-[350px] rounded-full bg-red-600/10 blur-[100px] dark:bg-red-600/10" />
            </div>

            {/* Top Navigation Bar */}
            <header className="pointer-events-auto relative top-0 right-0 left-0 z-30 mx-auto flex w-full max-w-6xl shrink-0 items-center justify-between px-4 py-3 sm:absolute sm:px-6 sm:py-5">
                <Link
                    href={backUrl}
                    className="-ml-2 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-red-400"
                >
                    <ArrowLeft className="size-4" />
                    <span>
                        {user ? 'Kembali ke Dashboard' : 'Kembali ke Beranda'}
                    </span>
                </Link>

                <div className="flex items-center gap-3">
                    <ThemeToggle />
                </div>
            </header>

            {/* Main Auth Container */}
            <main className="animate-smooth-in relative z-10 my-auto w-full max-w-md pt-4 pb-8 sm:pt-20">
                <div className="flex flex-col gap-6">
                    {/* Brand Header */}
                    <div className="flex flex-col items-center gap-3 text-center">
                        <Link
                            href={backUrl}
                            className="group flex flex-col items-center gap-2 transition-transform hover:scale-105"
                            title={
                                user
                                    ? 'Ke Dashboard'
                                    : 'Honda Customer Rewards'
                            }
                        >
                            {/* Logo Anper - Auto switch on light / dark mode */}
                            <div className="relative flex h-14 items-center justify-center">
                                <img
                                    src="/images/logo/anper_sartika_logo_red.png"
                                    alt="Honda Customer Rewards Logo"
                                    className="h-12 w-auto object-contain dark:hidden"
                                />
                                <img
                                    src="/images/logo/anper_sartika_logo_white.png"
                                    alt="Honda Customer Rewards Logo"
                                    className="hidden h-12 w-auto object-contain dark:block"
                                />
                            </div>
                        </Link>

                        <div className="space-y-1">
                            <span className="inline-block rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-red-600 uppercase dark:border-red-900/50 dark:bg-red-950/60 dark:text-red-400">
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
                    <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/90 p-6 shadow-xl shadow-zinc-950/5 backdrop-blur-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900/90 dark:shadow-black/40">
                        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-red-500 via-red-600 to-red-700" />
                        {children}
                    </div>

                    {/* Footer text */}
                    <p className="text-center text-xs text-zinc-500 dark:text-zinc-500">
                        &copy; {new Date().getFullYear()} Honda Customer Rewards
                        &bull; Dealer & AHASS Resmi
                    </p>
                </div>
            </main>
        </div>
    );
}
