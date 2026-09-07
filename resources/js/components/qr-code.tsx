import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
} from 'react';
import QRCodeStyling, {
    type CornerDotType,
    type CornerSquareType,
    type DotType,
    type FileExtension,
    type Options,
} from 'qr-code-styling';

export interface QrCodeHandle {
    download: (name?: string, extension?: FileExtension) => void;
}

interface QrCodeProps {
    data: string;
    width?: number;
    height?: number;
    image?: string;
    className?: string;
    dotsColor?: string;
    dotsType?: DotType;
    cornersSquareType?: CornerSquareType;
    cornersDotType?: CornerDotType;
    backgroundColor?: string;
}

const QrCode = forwardRef<QrCodeHandle, QrCodeProps>(function QrCode(
    {
        data,
        width = 220,
        height = 220,
        image = '/images/logo/honda_logo_red.png',
        className = '',
        dotsColor = '#DC2626',
        dotsType = 'rounded',
        cornersSquareType = 'extra-rounded',
        cornersDotType = 'dot',
        backgroundColor = '#ffffff',
    },
    ref,
) {
    const containerRef = useRef<HTMLDivElement>(null);
    const qrCodeRef = useRef<QRCodeStyling | null>(null);

    useImperativeHandle(ref, () => ({
        download: (name = 'honda-member-qr', extension: FileExtension = 'png') => {
            if (qrCodeRef.current) {
                qrCodeRef.current.download({ name, extension });
            }
        },
    }));

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const options: Options = {
            width,
            height,
            type: 'svg',
            data,
            image,
            margin: 4,
            qrOptions: {
                typeNumber: 0,
                mode: 'Byte',
                errorCorrectionLevel: 'Q',
            },
            imageOptions: {
                hideBackgroundDots: true,
                imageSize: 0.32,
                margin: 4,
                crossOrigin: 'anonymous',
            },
            dotsOptions: {
                color: dotsColor,
                type: dotsType,
            },
            backgroundOptions: {
                color: backgroundColor,
            },
            cornersSquareOptions: {
                color: '#B91C1C',
                type: cornersSquareType,
            },
            cornersDotOptions: {
                color: '#18181B',
                type: cornersDotType,
            },
        };

        if (!qrCodeRef.current) {
            qrCodeRef.current = new QRCodeStyling(options);
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
                qrCodeRef.current.append(containerRef.current);
            }
        } else {
            qrCodeRef.current.update(options);
        }
    }, [
        data,
        width,
        height,
        image,
        dotsColor,
        dotsType,
        cornersSquareType,
        cornersDotType,
        backgroundColor,
    ]);

    return (
        <div
            ref={containerRef}
            className={`flex items-center justify-center overflow-hidden [&_svg]:w-full [&_svg]:h-full [&_svg]:max-w-full [&_svg]:aspect-square ${className}`}
        />
    );
});

export default QrCode;
