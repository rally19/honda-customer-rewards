<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    {{-- Inline script to detect system dark mode preference and apply it immediately --}}
    <script>
        (function () {
            const appearance = '{{ $appearance ?? "system" }}';

            if (appearance === 'system') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                if (prefersDark) {
                    document.documentElement.classList.add('dark');
                }
            }
        })();
    </script>

    {{-- Inline style to set the HTML background color based on our theme in app.css --}}
    <style>
        html {
            background-color: oklch(1 0 0);
        }

        html.dark {
            background-color: oklch(0.145 0 0);
        }

        @media (max-width: 767.98px) {
            html {
                zoom: 0.9;
            }
        }
    </style>

    {{-- PWA Manifest & App Identity --}}
    <link rel="manifest" href="/site.webmanifest">
    <meta name="theme-color" content="#DD0101" media="(prefers-color-scheme: light)">
    <meta name="theme-color" content="#DD0101" media="(prefers-color-scheme: dark)">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="Honda Rewards">
    <meta name="application-name" content="Honda Rewards">
    <meta name="msapplication-TileColor" content="#DD0101">

    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico">
    <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png">
    <link rel="icon" type="image/png" sizes="192x192" href="/icons/pwa-192x192.png">
    <link rel="icon" type="image/png" sizes="512x512" href="/images/logo/anper_sartika_logo_redbg_white_1x1_512.png">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

    {{-- PWA Service Worker Registration --}}
    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function () {
                navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(function (registration) {
                        registration.onupdatefound = function () {
                            var installingWorker = registration.installing;
                            if (installingWorker) {
                                installingWorker.onstatechange = function () {
                                    if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                        window.dispatchEvent(new CustomEvent('pwa-update-available', {
                                            detail: { registration: registration }
                                        }));
                                    }
                                };
                            }
                        };
                    })
                    .catch(function (err) {
                        console.debug('PWA ServiceWorker registration notice:', err);
                    });
            });
        }
    </script>

    @fonts

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
    <x-inertia::head>
        <title>{{ config('app.name', 'Laravel') }}</title>
    </x-inertia::head>
</head>

<body class="font-sans antialiased">
    <x-inertia::app />
</body>

</html>