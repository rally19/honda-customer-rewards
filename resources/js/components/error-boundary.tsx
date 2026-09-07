import { AlertCircle, RefreshCw } from 'lucide-react';
import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
    children: ReactNode;
    fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
    name?: string;
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.warn(
            `[ErrorBoundary caught in ${this.props.name || 'Component'}]:`,
            error,
            errorInfo,
        );
    }

    resetErrorBoundary = (): void => {
        this.props.onReset?.();
        this.setState({
            hasError: false,
            error: null,
        });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            if (typeof this.props.fallback === 'function') {
                return this.props.fallback(
                    this.state.error || new Error('Unknown error'),
                    this.resetErrorBoundary,
                );
            }

            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="space-y-3 rounded-2xl border border-red-200 bg-red-50/70 p-5 text-center dark:border-red-900/50 dark:bg-red-950/30">
                    <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400">
                        <AlertCircle className="size-5" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-sm font-bold text-red-900 dark:text-red-200">
                            Terjadi Kendala pada {this.props.name || 'Komponen'}
                        </h4>
                        <p className="mx-auto max-w-sm text-xs leading-relaxed text-red-700 dark:text-red-400">
                            {this.state.error?.message ||
                                'Komponen tidak dapat dimuat dengan baik.'}
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={this.resetErrorBoundary}
                        className="gap-1.5 rounded-xl border-red-300 text-xs text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/50"
                    >
                        <RefreshCw className="size-3.5" />
                        Coba Lagi
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
