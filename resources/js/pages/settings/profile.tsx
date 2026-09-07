import { Form, Head, usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/profile';
import type { Auth } from '@/types';
import { send } from '@/routes/verification';

type PageProps = {
    auth: Auth;
};

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<PageProps>().props;

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Profile"
                    description="Perbarui informasi data pribadi, kontak, dan alamat Anda"
                />

                <Form
                    {...ProfileController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nama Lengkap</Label>

                                <Input
                                    id="name"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.name}
                                    name="name"
                                    required
                                    autoComplete="name"
                                    placeholder="Nama Lengkap"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.name}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Alamat Email</Label>

                                <Input
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.email}
                                    name="email"
                                    required
                                    autoComplete="username"
                                    placeholder="Alamat Email"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.email}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phone_number">
                                    No. Telepon / WhatsApp
                                </Label>

                                <Input
                                    id="phone_number"
                                    type="tel"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.phone_number ?? ''}
                                    name="phone_number"
                                    autoComplete="tel"
                                    placeholder="Contoh: 081234567890"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.phone_number}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="address">Alamat Lengkap</Label>

                                <Input
                                    id="address"
                                    type="text"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.address ?? ''}
                                    name="address"
                                    autoComplete="street-address"
                                    placeholder="Contoh: Jl. Jenderal Sudirman No. 45, Jakarta"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.address}
                                />
                            </div>

                            <div className="grid gap-2 pt-1">
                                <Label>Tipe Akun (Role)</Label>
                                <div className="flex items-center gap-3">
                                    <Badge
                                        variant={
                                            auth.user.role === 'admin'
                                                ? 'destructive'
                                                : 'secondary'
                                        }
                                        className="font-medium capitalize"
                                    >
                                        {auth.user.role === 'admin'
                                            ? 'Administrator'
                                            : 'Member (User)'}
                                    </Badge>
                                    <span className="text-muted-foreground text-xs">
                                        ID: #{auth.user.id}
                                    </span>
                                </div>
                            </div>

                            {mustVerifyEmail &&
                                auth.user.email_verified_at === null && (
                                    <div>
                                        <p className="text-muted-foreground -mt-4 text-sm">
                                            Your email address is unverified.{' '}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                            >
                                                Click here to re-send the
                                                verification email.
                                            </Link>
                                        </p>

                                        {status ===
                                            'verification-link-sent' && (
                                            <div className="mt-2 text-sm font-medium text-green-600">
                                                A new verification link has been
                                                sent to your email address.
                                            </div>
                                        )}
                                    </div>
                                )}

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                >
                                    Save
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
