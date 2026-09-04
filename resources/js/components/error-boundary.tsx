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
        console.warn(`[ErrorBoundary caught in ${this.props.name || 'Component'}]:`, error, errorInfo);
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
                return this.props.fallback(this.state.error || new Error('Unknown error'), this.resetErrorBoundary);
            }

            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/70 dark:bg-red-950/30 p-5 text-center space-y-3">
                    <div className="size-10 rounded-xl bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                        <AlertCircle className="size-5" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-sm font-bold text-red-900 dark:text-red-200">
                            Terjadi Kendala pada {this.props.name || 'Komponen'}
                        </h4>
                        <p className="text-xs text-red-700 dark:text-red-400 max-w-sm mx-auto leading-relaxed">
                            {this.state.error?.message || 'Komponen tidak dapat dimuat dengan baik.'}
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={this.resetErrorBoundary}
                        className="rounded-xl text-xs gap-1.5 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50"
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
