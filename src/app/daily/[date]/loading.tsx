import { Skeleton } from "@/components/Skeleton";

export default function DailyLoading() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <Skeleton className="h-8 w-64 mb-6" />

      {/* Summary skeleton */}
      <div className="bg-surface border-l-4 border-primary rounded-lg p-6 mb-8">
        <Skeleton className="h-6 w-40 mb-3" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-2" />
        <Skeleton className="h-4 w-4/6" />
      </div>

      {/* Market indicators skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface rounded-lg p-4 border border-border">
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-6 w-24 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Articles skeleton */}
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface border border-border rounded-lg p-4">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </main>
  );
}
