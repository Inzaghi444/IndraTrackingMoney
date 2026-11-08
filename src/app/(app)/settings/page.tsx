import { requireUser } from '@/lib/session';
import { listWalletsWithBalance } from '@/server/queries/wallets';
import { formatRupiah } from '@/lib/money';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet } from 'lucide-react';

export const metadata = { title: 'Pengaturan' };

export default async function SettingsPage() {
  const user = await requireUser();
  const wallets = await listWalletsWithBalance(user.id);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Pengaturan</h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Profil, dompet, dan preferensi aplikasi.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Nama" value={user.name} />
          <Row label="Email" value={user.email} />
          <Row label="Mata uang" value={user.currency ?? 'IDR'} />
          <Row label="Zona waktu" value={user.timezone ?? 'Asia/Jakarta'} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dompet</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {wallets.map((w) => (
              <li key={w.id} className="flex items-center gap-3 py-2.5">
                <span
                  className="flex size-9 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${w.color}1F`, color: w.color }}
                  aria-hidden
                >
                  <Wallet className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium">{w.name}</span>
                    {w.isDefault && <Badge tone="primary">utama</Badge>}
                  </div>
                  <p className="text-[11px] capitalize text-muted-foreground">{w.type}</p>
                </div>
                <span className="tabular shrink-0 text-sm font-medium">
                  {formatRupiah(w.balance)}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            Multi-dompet penuh (tambah, ubah, transfer antar dompet) tersedia di fase berikutnya.
            Saat ini setiap akun memiliki satu dompet default agar pencatatan bisa langsung dipakai.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-medium">{value}</span>
    </div>
  );
}
