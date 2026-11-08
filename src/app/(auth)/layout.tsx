import Link from 'next/link';
import { Wallet } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-2">
      {/* Panel kiri: brand & value proposition (hanya desktop) */}
      <div className="relative hidden overflow-hidden bg-primary p-12 lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, #5eead4 0%, transparent 45%), radial-gradient(circle at 80% 70%, #99f6e4 0%, transparent 40%)',
          }}
        />
        <Link href="/" className="relative flex items-center gap-2.5 text-primary-foreground">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary-foreground/15">
            <Wallet className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">IndraTrackingMoney</span>
        </Link>

        <div className="relative max-w-md">
          <h1 className="text-3xl font-semibold leading-tight text-primary-foreground">
            Tahu ke mana uangmu pergi, tanpa ribet mencatat.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-primary-foreground/80">
            Catat pengeluaran dalam hitungan detik, lihat ringkasan bulanan secara otomatis, dan
            dapat peringatan sebelum anggaranmu jebol.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-primary-foreground/90">
            {[
              'Pencatatan cepat dengan 2 isian saja',
              'Grafik arus kas & kategori terbesar',
              'Anggaran harian/bulanan dengan peringatan',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-foreground/20 text-[11px]">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-primary-foreground/60">
          Data keuanganmu tersimpan privat dan bisa diekspor kapan saja.
        </p>
      </div>

      {/* Panel kanan: form */}
      <div className="flex min-h-dvh flex-col justify-center px-5 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-sm">
          <Link
            href="/"
            className="mb-8 flex items-center gap-2.5 text-foreground lg:hidden"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wallet className="size-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight">IndraTrackingMoney</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
