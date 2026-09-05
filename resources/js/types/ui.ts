import type { ReactNode } from 'react';
import type { BreadcrumbItem } from '@/types/navigation';

export type AppLayoutProps = {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
};

export type AppVariant = 'header' | 'sidebar';

export type FlashToast = {
    type: 'success' | 'info' | 'warning' | 'error';
    message: string;
};

export type AuthLayoutProps = {
    children?: ReactNode;
    name?: string;
    title?: string;
    description?: string;
};

export type NotificationItem = {
    id: string;
    type: 'activity' | 'reward' | 'welcome';
    title: string;
    description: string;
    time?: string;
    timestamp?: number;
    link?: string | null;
    points?: number | null;
    status?: string | null;
};

