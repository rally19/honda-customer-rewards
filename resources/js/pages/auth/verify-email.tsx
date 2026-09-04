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
                <div className="mb-4 text-center text-sm font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    Tautan verifikasi baru telah dikirimkan ke alamat email Anda.
                </div>
            )}

            <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="size-12 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-red-600 border border-red-100 dark:border-red-900/50">
                    <MailCheck className="size-6" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Kami telah mengirimkan tautan verifikasi ke email Anda. Silakan periksa kotak masuk (atau folder spam) Anda dan klik tombol verifikasi untuk mengaktifkan akun Anda.
                </p>
            </div>

            <Form {...send.form()} className="space-y-4 text-center mt-6">
                {({ processing }) => (
                    <>
                        <Button
                            disabled={processing}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium"
                        >
                            {processing && <Spinner />}
                            Kirim Ulang Email Verifikasi
                        </Button>

                        <TextLink
                            href={logout()}
                            className="mx-auto block text-sm text-muted-foreground hover:text-foreground"
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
