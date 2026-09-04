<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TwoFactorCodeNotification extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public string $code
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Kode Autentikasi 2FA - Honda Customer Rewards')
            ->greeting('Halo, '.$notifiable->name.'!')
            ->line('Kami mendeteksi permintaan masuk ke akun Honda Customer Rewards Anda.')
            ->line('Berikut adalah kode autentikasi dua faktor (2FA) Anda:')
            ->line('# **'.$this->code.'**')
            ->line('Kode ini berlaku selama 10 menit. Jangan bagikan kode ini kepada siapapun.')
            ->line('Jika Anda tidak mencoba masuk, segera amankan akun Anda.')
            ->salutation('Salam hormat,'."\n".'Tim Honda Customer Rewards');
    }
}
