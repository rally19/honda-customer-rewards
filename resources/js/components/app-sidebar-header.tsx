import { router } from '@inertiajs/react';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const [isReloading, setIsReloading] = useState(false);

    const handleReload = () => {
        if (isReloading) return;
        setIsReloading(true);

        router.reload({
            onSuccess: () => {
                toast.success('Data berhasil dimuat ulang', {
                    duration: 2000,
                });
            },
            onError: () => {
                toast.error('Gagal memuat ulang data');
            },
            onFinish: () => {
                setIsReloading(false);
            },
        });
    };

    return (
        <header className="app-header-sticky border-sidebar-border/50 bg-background sticky top-0 z-[60] flex h-16 shrink-0 items-center justify-between gap-2 border-b px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            <div className="flex items-center gap-2">
                <TooltipProvider delayDuration={200}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={handleReload}
                                disabled={isReloading}
                                className="relative size-9 cursor-pointer rounded-xl text-zinc-500 transition-all hover:bg-zinc-100 hover:text-zinc-900 active:scale-95 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                                aria-label="Muat ulang data tanpa refresh halaman"
                            >
                                <RefreshCw
                                    className={cn(
                                        'size-4 transition-transform duration-500',
                                        isReloading &&
                                            'animate-spin text-red-600 dark:text-red-500',
                                    )}
                                />
                                <span className="sr-only">
                                    Muat Ulang Data
                                </span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent
                            side="bottom"
                            align="end"
                            className="text-xs"
                        >
                            Muat ulang data (tanpa refresh)
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </header>
    );
}
