import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="size-8 rounded-lg" />
            </div>
            <Skeleton className="mt-3 h-6 w-28" />
            <Skeleton className="mt-2 h-3 w-24" />
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-1.5 h-3 w-40" />
          <Skeleton className="mt-5 h-56 w-full rounded-lg" />
        </Card>
        <Card className="p-5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mx-auto mt-5 size-40 rounded-full" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-full" />
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <Skeleton className="h-4 w-24" />
          <div className="mt-4 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="mt-2 h-1.5 w-full" />
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <Skeleton className="h-4 w-32" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
