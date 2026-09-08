import { Download, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
}

export function PwaPrompt() {
    const [deferredPrompt, setDeferredPrompt] =
        useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if app is already running in standalone mode (installed PWA)
        const isAppStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as unknown as { standalone?: boolean })
                .standalone === true ||
            document.referrer.includes('android-app://');

        setIsStandalone(isAppStandalone);

        if (isAppStandalone) {
            return;
        }

        // 1. Capture PWA Install Prompt
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            const promptEvent = e as BeforeInstallPromptEvent;
            setDeferredPrompt(promptEvent);

            // Check if dismissed in this session
            const isDismissed = sessionStorage.getItem(
                'honda_pwa_prompt_dismissed',
            );
            if (!isDismissed) {
                // Show banner with a smooth gentle delay so it does not interfere with page entry
                const timer = setTimeout(() => {
                    setShowBanner(true);
                }, 3000);
                return () => clearTimeout(timer);
            }
        };

        // 2. Allow other components to trigger the install prompt via custom event
        const handleManualInstallRequest = () => {
            if (deferredPrompt) {
                deferredPrompt.prompt().then(() => {
                    deferredPrompt.userChoice.then((choice) => {
                        if (choice.outcome === 'accepted') {
                            toast.success(
                                'Terima kasih telah memasang Honda Rewards!',
                            );
                            setShowBanner(false);
                            setDeferredPrompt(null);
                        }
                    });
                });
            } else if (!isAppStandalone) {
                toast.info(
                    'Buka menu browser Anda lalu pilih "Tambahkan ke Layar Utama" (Add to Home screen).',
                    {
                        duration: 5000,
                    },
                );
            }
        };

        // 3. Handle App Installed Event
        const handleAppInstalled = () => {
            setShowBanner(false);
            setDeferredPrompt(null);
            toast.success(
                'Aplikasi Honda Rewards berhasil dipasang di perangkat Anda!',
            );
        };

        // 4. Handle Service Worker Update Notification
        const handleUpdateAvailable = (e: Event) => {
            const customEvent = e as CustomEvent<{
                registration?: ServiceWorkerRegistration;
            }>;
            const reg = customEvent.detail?.registration;

            toast('Pembaruan Versi Baru Tersedia', {
                description:
                    'Versi terbaru sistem Honda Rewards siap digunakan.',
                action: {
                    label: 'Perbarui',
                    onClick: () => {
                        if (reg?.waiting) {
                            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                        }
                        window.location.reload();
                    },
                },
                duration: 10000,
            });
        };

        // 5. Online / Offline connection listeners
        const handleOnline = () => {
            toast.success('Koneksi internet terhubung kembali.');
        };

        const handleOffline = () => {
            toast.warning(
                'Anda sedang offline. Menampilkan data dari memori cache.',
            );
        };

        window.addEventListener(
            'beforeinstallprompt',
            handleBeforeInstallPrompt,
        );
        window.addEventListener(
            'pwa-install-requested',
            handleManualInstallRequest,
        );
        window.addEventListener('appinstalled', handleAppInstalled);
        window.addEventListener('pwa-update-available', handleUpdateAvailable);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener(
                'beforeinstallprompt',
                handleBeforeInstallPrompt,
            );
            window.removeEventListener(
                'pwa-install-requested',
                handleManualInstallRequest,
            );
            window.removeEventListener('appinstalled', handleAppInstalled);
            window.removeEventListener(
                'pwa-update-available',
                handleUpdateAvailable,
            );
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [deferredPrompt, isStandalone]);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            return;
        }

        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;

        if (choiceResult.outcome === 'accepted') {
            toast.success('Memasang Honda Rewards...');
            setShowBanner(false);
            setDeferredPrompt(null);
        } else {
            sessionStorage.setItem('honda_pwa_prompt_dismissed', 'true');
            setShowBanner(false);
        }
    };

    const handleDismiss = () => {
        sessionStorage.setItem('honda_pwa_prompt_dismissed', 'true');
        setShowBanner(false);
    };

    if (!showBanner || !deferredPrompt || isStandalone) {
        return null;
    }

    return (
        <aside
            aria-label="Pemasangan Aplikasi Honda Rewards"
            className="animate-smooth-up pointer-events-auto fixed right-4 bottom-20 left-4 z-[200] sm:right-6 sm:bottom-6 sm:left-auto sm:max-w-md"
        >
            <div className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-white/95 p-4 shadow-2xl shadow-red-500/10 backdrop-blur-xl sm:rounded-3xl dark:bg-zinc-900/95 dark:shadow-black/40">
                {/* Subtle top brand accent line */}
                <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-red-600 via-amber-500 to-red-600" />

                <div className="flex items-start gap-3.5">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white shadow-md shadow-red-600/30">
                        <img
                            src="/images/logo/anper_sartika_logo_white.png"
                            alt="Logo Anper"
                            className="size-8 object-contain"
                            onError={(e) => {
                                // Fallback icon if image fails
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    </div>

                    <div className="min-w-0 flex-1 pr-6">
                        <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-black tracking-tight text-zinc-900 sm:text-sm dark:text-white">
                                Pasang Aplikasi Honda Rewards
                            </h4>
                            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-red-200 bg-red-50 px-1.5 py-0.5 text-[9px] font-bold text-red-600 dark:border-red-900/50 dark:bg-red-950/60 dark:text-red-400">
                                <Sparkles className="size-2.5" />
                                PWA
                            </span>
                        </div>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                            Buka lebih cepat langsung dari layar utama HP atau
                            desktop tanpa perlu buka browser.
                        </p>

                        <div className="mt-3 flex items-center gap-2">
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleInstallClick}
                                className="h-8 cursor-pointer rounded-xl bg-red-600 px-3 text-xs font-bold text-white shadow-md shadow-red-600/20 transition-all hover:bg-red-700 active:scale-95"
                            >
                                <Download className="mr-1 size-3.5" />
                                Pasang Sekarang
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={handleDismiss}
                                className="h-8 cursor-pointer rounded-xl px-2.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                            >
                                Nanti Saja
                            </Button>
                        </div>
                    </div>

                    {/* Close button */}
                    <button
                        type="button"
                        onClick={handleDismiss}
                        className="absolute top-3 right-3 cursor-pointer rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                        title="Tutup banner"
                    >
                        <X className="size-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
