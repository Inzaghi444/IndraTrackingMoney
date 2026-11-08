import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, Wallet, PieChart, Target, Zap } from 'lucide-react';
import { getSession } from '@/lib/session';
import { Button } from '@/components/ui/button';

export default async function LandingPage() {
  const session = await getSession();
  if (session?.user) redirect('/dashboard');

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wallet className="size-4" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Duitrack</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Masuk</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/register">Daftar</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-20 pt-12 sm:pt-20">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-foreground">
            <Zap className="size-3" />
            Catat dalam hitungan detik
          </span>

          <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Tahu ke mana uangmu pergi, tanpa ribet mencatat.
          </h1>

          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Duitrack membantu kamu mencatat pengeluaran harian, memantau saldo, dan mengevaluasi
            kondisi keuangan lewat dashboard yang sederhana.
          </p>

          <div className="mt-7 flex flex-wrap gap-2.5">
            <Button size="lg" asChild>
              <Link href="/register">
                Mulai gratis
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sudah punya akun</Link>
            </Button>
          </div>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Zap,
              title: 'Pencatatan cepat',
              body: 'Hanya nominal dan kategori. Tanggal terisi otomatis, deskripsi opsional.',
            },
            {
              icon: PieChart,
              title: 'Laporan otomatis',
              body: 'Grafik arus kas, kategori terbesar, dan perbandingan bulanan tanpa hitung manual.',
            },
            {
              icon: Target,
              title: 'Anggaran & peringatan',
              body: 'Tetapkan batas pengeluaran dan dapat peringatan sebelum anggaranmu jebol.',
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-primary">
                <Icon className="size-4.5" />
              </span>
              <p className="mt-3 text-sm font-semibold">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
