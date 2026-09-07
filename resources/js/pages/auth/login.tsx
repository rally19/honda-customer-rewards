import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasskeyVerify from '@/components/passkey-verify';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    return (
        <>
            <Head title="Masuk - Honda Customer Rewards" />

            {status && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-2.5 text-center text-sm font-medium text-green-600 dark:border-green-900 dark:bg-green-950/50 dark:text-green-400">
                    {status}
                </div>
            )}

            <PasskeyVerify
                label="Masuk dengan Passkey"
                separator="Atau lanjutkan dengan email"
            />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-5">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Alamat Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="nama@email.com"
                                    className="focus-visible:ring-red-500"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                            tabIndex={5}
                                        >
                                            Lupa password?
                                        </TextLink>
                                    )}
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />
                                <Label
                                    htmlFor="remember"
                                    className="cursor-pointer text-xs text-zinc-600 dark:text-zinc-400"
                                >
                                    Ingat saya di perangkat ini
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full cursor-pointer bg-red-600 py-2.5 font-semibold text-white shadow-md shadow-red-600/25 transition-all hover:bg-red-700 active:scale-[0.99]"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Masuk ke Akun
                            </Button>
                        </div>

                        <div className="text-muted-foreground border-t border-zinc-100 pt-1 text-center text-sm dark:border-zinc-800">
                            Belum memiliki ID MEMBER?{' '}
                            <TextLink
                                href={register()}
                                data-test="register-link"
                                tabIndex={5}
                                className="font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                                Daftar Sekarang
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Login.layout = {
    title: 'Masuk ke Akun',
    description: 'Akses ID MEMBER dan kumpulkan keuntungan eksklusif Anda',
};
