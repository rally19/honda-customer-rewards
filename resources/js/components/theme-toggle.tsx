import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
    className?: string;
    showLabel?: boolean;
}

export default function ThemeToggle({
    className,
    showLabel = false,
}: ThemeToggleProps) {
    const [mounted, setMounted] = useState(false);
    const { resolvedAppearance, updateAppearance } = useAppearance();

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = mounted ? resolvedAppearance === 'dark' : false;

    const toggleTheme = () => {
        const nextTheme = resolvedAppearance === 'dark' ? 'light' : 'dark';
        updateAppearance(nextTheme);
    };

    return (
        <Button
            type="button"
            variant="ghost"
            size={showLabel ? 'default' : 'icon'}
            onClick={toggleTheme}
            className={cn(
                'text-muted-foreground hover:text-foreground relative cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/10',
                className,
            )}
            title={isDark ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
            aria-label="Toggle tema gelap/terang"
            suppressHydrationWarning
        >
            {isDark ? (
                <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 text-amber-400 transition-all" />
            ) : (
                <Moon className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 text-zinc-700 transition-all" />
            )}
            {showLabel && (
                <span className="ml-2 text-xs font-medium">
                    {isDark ? 'Mode Terang' : 'Mode Gelap'}
                </span>
            )}
        </Button>
    );
}
