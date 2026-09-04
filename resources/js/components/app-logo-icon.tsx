import type { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    const { className = 'h-9 w-auto object-contain', alt = 'Anper Honda Logo', ...rest } = props;
    return (
        <img
            src="/images/logo/anper_logo_red.png"
            alt={alt}
            className={`${className} dark:hidden`}
            {...rest}
        />
    );
}

