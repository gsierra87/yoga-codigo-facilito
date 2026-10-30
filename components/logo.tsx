import { Sprout } from 'lucide-react'
import Link from 'next/link'

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Sprout className="size-5" aria-hidden />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-serif text-lg font-medium">Prana</span>
        <span className="text-[11px] tracking-wide text-muted-foreground">Estudio de yoga</span>
      </span>
    </Link>
  )
}
