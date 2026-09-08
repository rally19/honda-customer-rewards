import { Link, usePage } from '@inertiajs/react';
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
import type { User } from '@/types';

export default function AuthCardLayout({
    children,
    title,
    description,
}: PropsWithChildren<{
    name?: string;
    title?: string;
    description?: string;
}>) {
    const page = usePage<{ auth?: { user?: User | null } }>();
    const user = page.props.auth?.user;
    const backUrl = user
        ? user.role === 'admin'
            ? '/admin/dashboard'
            : '/dashboard'
        : home();

    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center bg-zinc-50 p-4 transition-colors sm:p-6 md:p-10 dark:bg-zinc-950">
            {/* Ambient Red Glow */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-32 left-1/2 h-[350px] w-[550px] -translate-x-1/2 rounded-full bg-red-500/10 blur-[120px] dark:bg-red-600/15" />
            </div>

            {/* Top Navigation */}
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

            <div className="animate-smooth-in relative z-10 my-auto flex w-full max-w-md flex-col gap-6 pt-4 pb-8 sm:pt-20">
                <div className="flex flex-col items-center gap-2">
                    <Link
                        href={backUrl}
                        className="flex items-center gap-2 transition-transform hover:scale-105"
                        title={
                            user ? 'Ke Dashboard' : 'Honda Customer Rewards'
                        }
                    >
                        <img
                            src="/images/logo/anper_sartika_logo_red.png"
                            alt="Honda Customer Rewards"
                            className="h-12 w-auto object-contain dark:hidden"
                        />
                        <img
                            src="/images/logo/anper_sartika_logo_white.png"
                            alt="Honda Customer Rewards"
                            className="hidden h-12 w-auto object-contain dark:block"
                        />
                    </Link>
                </div>

                <Card className="overflow-hidden rounded-2xl border-zinc-200/80 bg-white/95 shadow-xl shadow-zinc-950/5 dark:border-zinc-800 dark:bg-zinc-900/95 dark:shadow-black/40">
                    <div className="h-1 w-full bg-gradient-to-r from-red-500 via-red-600 to-red-700" />
                    <CardHeader className="px-8 pt-8 pb-0 text-center">
                        <CardTitle className="text-xl font-bold">
                            {title}
                        </CardTitle>
                        <CardDescription className="text-sm">
                            {description}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-8 py-8">{children}</CardContent>
                </Card>
            </div>
        </div>
    );
}
