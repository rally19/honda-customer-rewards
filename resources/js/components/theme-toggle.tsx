import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
    className?: string;
    showLabel?: boolean;
}

export default function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
    const { resolvedAppearance, updateAppearance } = useAppearance();

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
                'relative text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer',
                className,
            )}
            title={resolvedAppearance === 'dark' ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
            aria-label="Toggle tema gelap/terang"
        >
            {resolvedAppearance === 'dark' ? (
                <Sun className="h-[1.2rem] w-[1.2rem] text-amber-400 transition-all rotate-0 scale-100" />
            ) : (
                <Moon className="h-[1.2rem] w-[1.2rem] text-zinc-700 transition-all rotate-0 scale-100" />
            )}
            {showLabel && (
                <span className="ml-2 text-xs font-medium">
                    {resolvedAppearance === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                </span>
            )}
        </Button>
    );
}
