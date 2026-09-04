import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';

type Props = {
    passwordRules: string;
};

export default function Register({ passwordRules }: Props) {
    return (
        <>
            <Head title="Daftar ID Member - Honda Customer Rewards" />
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nama Lengkap</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Contoh: Budi Santoso"
                                    className="focus-visible:ring-red-500"
                                />
                                <InputError
                                    message={errors.name}
                                    className="mt-1"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Alamat Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="nama@email.com"
                                    className="focus-visible:ring-red-500"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phone_number">
                                    No. Telepon / WhatsApp
                                </Label>
                                <Input
                                    id="phone_number"
                                    type="tel"
                                    tabIndex={3}
                                    autoComplete="tel"
                                    name="phone_number"
                                    placeholder="Contoh: 081234567890"
                                    className="focus-visible:ring-red-500"
                                />
                                <InputError message={errors.phone_number} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="address">Alamat Lengkap</Label>
                                <Input
                                    id="address"
                                    type="text"
                                    tabIndex={4}
                                    autoComplete="street-address"
                                    name="address"
                                    placeholder="Contoh: Jl. Jenderal Sudirman No. 45, Jakarta"
                                    className="focus-visible:ring-red-500"
                                />
                                <InputError message={errors.address} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={5}
                                    autoComplete="new-password"
                                    placeholder="Minimal 8 karakter"
                                    passwordrules={passwordRules}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    Konfirmasi Password
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    required
                                    tabIndex={6}
                                    autoComplete="new-password"
                                    placeholder="Ulangi password"
                                    passwordrules={passwordRules}
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 shadow-md shadow-red-600/25 active:scale-[0.99] transition-all cursor-pointer"
                                tabIndex={7}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                Daftar & Dapatkan ID MEMBER
                            </Button>
                        </div>

                        <div className="text-muted-foreground text-center text-sm pt-1 border-t border-zinc-100 dark:border-zinc-800">
                            Sudah memiliki akun?{' '}
                            <TextLink
                                href={login()}
                                data-test="login-link"
                                tabIndex={8}
                                className="font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                            >
                                Masuk ke Akun
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Register.layout = {
    title: 'Daftar ID MEMBER',
    description: 'Buat akun Anda sekarang untuk mendapatkan ID MEMBER dan nikmati keuntungan eksklusif',
};
