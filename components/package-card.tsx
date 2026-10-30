import { Leaf, Package } from 'lucide-react'
import { formatDate } from '@/lib/format'
import { isPackageActive, packageRemaining } from '@/lib/selectors'
import type { ClassPackage } from '@/lib/types'
import { cn } from '@/lib/utils'

interface PackageCardProps {
  pkg?: ClassPackage
  pending?: number
  className?: string
}

export function PackageCard({ pkg, pending = 0, className }: PackageCardProps) {
  if (!pkg) {
    return (
      <div className={cn('flex flex-col items-center gap-2 rounded-3xl border border-dashed bg-card p-6 text-center', className)}>
        <Package className="size-6 text-muted-foreground" aria-hidden />
        <p className="font-medium">Sin paquete activo</p>
        <p className="text-sm text-muted-foreground">Consultá con Andrea para adquirir un paquete de 10 clases.</p>
      </div>
    )
  }

  const remaining = packageRemaining(pkg)
  const active = isPackageActive(pkg)
  const reservedSlots = Math.min(pending, remaining)

  return (
    <div className={cn('relative overflow-hidden rounded-3xl bg-primary p-5 text-primary-foreground', className)}>
      <Leaf className="pointer-events-none absolute -top-6 -right-6 size-32 rotate-12 opacity-10" aria-hidden />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs tracking-wide uppercase opacity-80">Tarjeta digital</p>
          <p className="font-serif text-xl font-medium">Paquete de {pkg.total} clases</p>
        </div>
        <span className="shrink-0 whitespace-nowrap rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-medium">
          {active ? `Vence ${formatDate(pkg.expiresAt)}` : remaining === 0 ? 'Completado' : 'Vencido'}
        </span>
      </div>

      <ol className="relative mt-5 grid grid-cols-5 gap-2.5" aria-label={`${pkg.used} clases usadas de ${pkg.total}`}>
        {Array.from({ length: pkg.total }, (_, i) => {
          const used = i < pkg.used
          const reserved = !used && i < pkg.used + reservedSlots
          return (
            <li
              key={i}
              className={cn(
                'flex aspect-square items-center justify-center rounded-full border text-xs font-medium',
                used && 'border-transparent bg-primary-foreground text-primary',
                reserved && 'border-dashed border-primary-foreground/80 bg-primary-foreground/10',
                !used && !reserved && 'border-primary-foreground/35',
              )}
            >
              {used ? <Leaf className="size-4" aria-hidden /> : <span className="opacity-80">{i + 1}</span>}
              <span className="sr-only">{used ? 'usada' : reserved ? 'reservada' : 'disponible'}</span>
            </li>
          )
        })}
      </ol>

      <dl className="relative mt-5 grid grid-cols-3 gap-2 border-t border-primary-foreground/20 pt-4 text-center">
        <div>
          <dt className="text-xs opacity-80">Usadas</dt>
          <dd className="font-serif text-2xl tabular-nums">{pkg.used}</dd>
        </div>
        <div>
          <dt className="text-xs opacity-80">Reservadas</dt>
          <dd className="font-serif text-2xl tabular-nums">{reservedSlots}</dd>
        </div>
        <div>
          <dt className="text-xs opacity-80">Disponibles</dt>
          <dd className="font-serif text-2xl tabular-nums">{remaining - reservedSlots}</dd>
        </div>
      </dl>
    </div>
  )
}
