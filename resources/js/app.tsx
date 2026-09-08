import { createInertiaApp } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { createRoot, hydrateRoot, type Root } from 'react-dom/client';
import { NavigationProgress } from '@/components/navigation-progress';
import { PwaPrompt } from '@/components/pwa-prompt';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import CustomerLayout from '@/layouts/customer-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'Honda Customer Rewards';

function CustomerSettingsWrapper({ children }: { children: ReactNode }) {
    return <CustomerLayout activeTab="profile">{children}</CustomerLayout>;
}

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
            case name.startsWith('customer/'):
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('admin/'):
                return AppLayout;
            case name.startsWith('settings/'):
                return [CustomerSettingsWrapper, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    setup({ el, App, props }) {
        const appElement = (
            <TooltipProvider delayDuration={0}>
                <NavigationProgress />
                <App {...props} />
                <Toaster />
                <PwaPrompt />
            </TooltipProvider>
        );

        if (!el) {
            return appElement;
        }

        if (el.hasAttribute('data-server-rendered')) {
            hydrateRoot(el, appElement);
            el.removeAttribute('data-server-rendered');
            return;
        }

        const container = el as HTMLElement & { __reactRoot?: Root };
        if (!container.__reactRoot) {
            container.__reactRoot = createRoot(el);
        }
        container.__reactRoot.render(appElement);
    },
    progress: false,
});

// This will set light / dark mode on load...
initializeTheme();
