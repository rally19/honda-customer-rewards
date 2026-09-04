import { Head } from '@inertiajs/react';
import AppearanceTabs from '@/components/appearance-tabs';
import Heading from '@/components/heading';
import { edit as editAppearance } from '@/routes/appearance';

export default function Appearance() {
    return (
        <>
            <Head title="Tampilan Tema - Honda Customer Rewards" />

            <h1 className="sr-only">Tampilan Tema</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Tampilan Tema"
                    description="Pilih mode tampilan tema sesuai kenyamanan Anda (Terang, Gelap, atau Sistem)"
                />
                <AppearanceTabs />
            </div>
        </>
    );
}

Appearance.layout = {
    breadcrumbs: [
        {
            title: 'Appearance settings',
            href: editAppearance(),
        },
    ],
};
