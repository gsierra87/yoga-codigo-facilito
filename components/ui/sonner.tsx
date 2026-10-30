'use client'

import { Toaster as Sonner, type ToasterProps } from 'sonner'

const Toaster = (props: ToasterProps) => (
  <Sonner
    theme="light"
    className="toaster group"
    toastOptions={{
      classNames: {
        toast: 'rounded-2xl! border-border! bg-card! text-foreground! font-sans! shadow-lg!',
        description: 'text-muted-foreground!',
      },
    }}
    {...props}
  />
)

export { Toaster }
