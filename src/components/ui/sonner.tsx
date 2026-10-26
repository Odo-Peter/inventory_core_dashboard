import { AlertTriangle, CheckCircle2, Info, Loader2, XCircle } from 'lucide-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

const base = 'group toast flex w-full items-start gap-3 rounded-lg border border-l-4 p-4 shadow-lg';

function Toaster({ toastOptions, ...props }: ToasterProps) {
  return (
    <Sonner
      data-slot="toaster"
      theme="light"
      className="toaster group"
      closeButton
      duration={5000}
      icons={{
        success: <CheckCircle2 className="size-5 text-emerald-600" />,
        error: <XCircle className="size-5 text-red-600" />,
        warning: <AlertTriangle className="size-5 text-amber-600" />,
        info: <Info className="size-5 text-sky-600" />,
        loading: <Loader2 className="text-muted-foreground size-5 animate-spin" />,
      }}
      toastOptions={{
        ...toastOptions,
        classNames: {
          toast: base,
          title: 'text-sm font-semibold',
          description: '!text-muted-foreground text-sm',
          actionButton: '!bg-primary !text-primary-foreground',
          cancelButton: '!bg-muted !text-muted-foreground',
          closeButton: '!bg-background !border-border',

          default: '!bg-background !text-foreground !border-border !border-l-border',
          success: '!bg-emerald-50 !text-emerald-950 !border-emerald-200 !border-l-emerald-600',
          error: '!bg-red-50 !text-red-950 !border-red-200 !border-l-red-600',
          warning: '!bg-amber-50 !text-amber-950 !border-amber-200 !border-l-amber-500',
          info: '!bg-sky-50 !text-sky-950 !border-sky-200 !border-l-sky-600',
          loading: '!bg-background !text-foreground !border-border !border-l-muted-foreground',
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
