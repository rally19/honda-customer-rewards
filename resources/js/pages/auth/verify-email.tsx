// Components
import { Form, Head } from '@inertiajs/react';
import { MailCheck } from 'lucide-react';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { logout } from '@/routes';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <>
            <Head title="Verifikasi Email - Honda Customer Rewards" />

            {status === 'verification-link-sent' && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                    Tautan verifikasi baru telah dikirimkan ke alamat email
                    Anda.
                </div>
            )}

            <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="flex size-12 items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-600 dark:border-red-900/50 dark:bg-red-950/40">
                    <MailCheck className="size-6" />
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                    Kami telah mengirimkan tautan verifikasi ke email Anda.
                    Silakan periksa kotak masuk (atau folder spam) Anda dan klik
                    tombol verifikasi untuk mengaktifkan akun Anda.
                </p>
            </div>

            <Form {...send.form()} className="mt-6 space-y-4 text-center">
                {({ processing }) => (
                    <>
                        <Button
                            disabled={processing}
                            className="w-full bg-red-600 font-medium text-white hover:bg-red-700"
                        >
                            {processing && <Spinner />}
                            Kirim Ulang Email Verifikasi
                        </Button>

                        <TextLink
                            href={logout()}
                            className="text-muted-foreground hover:text-foreground mx-auto block text-sm"
                        >
                            Keluar dari Akun (Log out)
                        </TextLink>
                    </>
                )}
            </Form>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Verifikasi Alamat Email',
    description:
        'Satu langkah lagi! Konfirmasi email Anda untuk menikmati seluruh keuntungan Honda Customer Rewards.',
};
