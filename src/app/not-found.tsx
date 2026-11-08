import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <FileQuestion className="size-6" />
      </div>
      <h1 className="mt-4 text-lg font-semibold">Halaman tidak ditemukan</h1>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        Tautan ini mungkin sudah dipindahkan atau tidak pernah ada.
      </p>
      <Button asChild className="mt-5">
        <Link href="/dashboard">Kembali ke dashboard</Link>
      </Button>
    </div>
  );
}
