import { usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200/80 bg-zinc-100 p-1 shadow-xs dark:border-zinc-700/60 dark:bg-zinc-800/80">
                <AppLogoIcon className="size-7 max-h-7 w-auto object-contain" />
            </div>
            <div className="ml-1 grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-bold text-zinc-900 dark:text-zinc-100">
                    {name}
                </span>
                <span className="truncate text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                    Dealer & AHASS Resmi
                </span>
            </div>
        </>
    );
}
