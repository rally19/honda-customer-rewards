import { Form, Head, router, setLayoutProps } from '@inertiajs/react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { Mail, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from '@/components/ui/input-otp';
import { OTP_MAX_LENGTH } from '@/hooks/use-two-factor-auth';
import { store } from '@/routes/two-factor/login';

type Props = {
    maskedEmail?: string | null;
    status?: string;
};

export default function TwoFactorChallenge({ maskedEmail, status }: Props) {
    const [showRecoveryInput, setShowRecoveryInput] = useState<boolean>(false);
    const [code, setCode] = useState<string>('');
    const [isResending, setIsResending] = useState<boolean>(false);

    const authConfigContent = useMemo<{
        title: string;
        description: string;
        toggleText: string;
    }>(() => {
        if (showRecoveryInput) {
            return {
                title: 'Recovery code',
                description:
                    'Konfirmasi akses akun Anda dengan memasukkan salah satu kode pemulihan darurat Anda.',
                toggleText: 'masuk menggunakan kode verifikasi / email',
            };
        }

        return {
            title: 'Verifikasi Dua Langkah (2FA)',
            description: maskedEmail
                ? `Kode 6-digit telah dikirim ke email ${maskedEmail}. Anda juga dapat memasukkan kode dari aplikasi Authenticator.`
                : 'Masukkan kode 6-digit dari email Anda atau aplikasi Authenticator.',
            toggleText: 'masuk menggunakan kode pemulihan',
        };
    }, [showRecoveryInput, maskedEmail]);

    setLayoutProps({
        title: authConfigContent.title,
        description: authConfigContent.description,
    });

    const toggleRecoveryMode = (clearErrors: () => void): void => {
        setShowRecoveryInput(!showRecoveryInput);
        clearErrors();
        setCode('');
    };

    return (
        <>
            <Head title="Two-factor authentication" />

            <div className="space-y-6">
                {status && (
                    <div className="p-3 text-xs font-medium text-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800 text-center">
                        {status}
                    </div>
                )}

                {maskedEmail && !showRecoveryInput && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800">
                        <span className="flex items-center gap-1.5">
                            <Mail className="size-3.5 text-red-600" />
                            Email: <strong className="font-semibold text-foreground">{maskedEmail}</strong>
                        </span>
                        <button
                            type="button"
                            disabled={isResending}
                            onClick={() => {
                                setIsResending(true);
                                router.post(
                                    '/two-factor-challenge/resend-email',
                                    {},
                                    {
                                        preserveScroll: true,
                                        onFinish: () => setIsResending(false),
                                    }
                                );
                            }}
                            className="text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 font-medium disabled:opacity-50 cursor-pointer"
                        >
                            <RefreshCw className={`size-3 ${isResending ? 'animate-spin' : ''}`} />
                            {isResending ? 'Mengirim...' : 'Kirim Ulang'}
                        </button>
                    </div>
                )}

                <Form
                    {...store.form()}
                    className="space-y-4"
                    resetOnError
                    resetOnSuccess={!showRecoveryInput}
                >
                    {({ errors, processing, clearErrors }) => (
                        <>
                            {showRecoveryInput ? (
                                <>
                                    <Input
                                        name="recovery_code"
                                        type="text"
                                        placeholder="Enter recovery code"
                                        autoFocus={showRecoveryInput}
                                        required
                                    />
                                    <InputError
                                        message={errors.recovery_code}
                                    />
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center space-y-3 text-center">
                                    <div className="flex w-full items-center justify-center">
                                        <InputOTP
                                            name="code"
                                            maxLength={OTP_MAX_LENGTH}
                                            value={code}
                                            onChange={(value) => setCode(value)}
                                            disabled={processing}
                                            pattern={REGEXP_ONLY_DIGITS}
                                            autoFocus
                                        >
                                            <InputOTPGroup>
                                                {Array.from(
                                                    { length: OTP_MAX_LENGTH },
                                                    (_, index) => (
                                                        <InputOTPSlot
                                                            key={index}
                                                            index={index}
                                                        />
                                                    ),
                                                )}
                                            </InputOTPGroup>
                                        </InputOTP>
                                    </div>
                                    <InputError message={errors.code} />
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={processing}
                            >
                                Continue
                            </Button>

                            <div className="text-muted-foreground text-center text-sm">
                                <span>or you can </span>
                                <button
                                    type="button"
                                    className="text-foreground cursor-pointer underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                    onClick={() =>
                                        toggleRecoveryMode(clearErrors)
                                    }
                                >
                                    {authConfigContent.toggleText}
                                </button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}
