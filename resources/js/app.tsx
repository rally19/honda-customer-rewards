import { createInertiaApp } from '@inertiajs/react';
import type { ReactNode } from 'react';
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
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#DC2626', // Honda Racing Red
    },
});

// This will set light / dark mode on load...
initializeTheme();
