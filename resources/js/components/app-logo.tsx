import { usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800/80 p-1 border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs">
                <AppLogoIcon className="size-7 w-auto max-h-7 object-contain" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm leading-tight min-w-0 group-data-[collapsible=icon]:hidden">
                <span className="truncate font-bold text-zinc-900 dark:text-zinc-100">
                    {name}
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium truncate">
                    Dealer & AHASS Resmi
                </span>
            </div>
        </>
    );
}
