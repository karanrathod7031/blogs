import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse bg-slate-200 dark:bg-slate-800 rounded-md", className)} />
  );
}

export function BlogCardSkeleton() {
  return (
    <div className="premium-card overflow-hidden flex flex-col h-full opacity-60">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="p-5 md:p-6 space-y-4 flex flex-col flex-grow">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-20 rounded-lg" />
          <Skeleton className="h-3 w-12 rounded-sm" />
        </div>
        <Skeleton className="h-7 w-full rounded-md" />
        <Skeleton className="h-7 w-2/3 rounded-md" />
        <div className="space-y-2 mt-2">
          <Skeleton className="h-4 w-full rounded-sm" />
          <Skeleton className="h-4 w-full rounded-sm" />
        </div>
        <div className="pt-4 mt-auto border-t border-border/50 flex items-center gap-2">
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="h-3 w-24 rounded-sm" />
        </div>
      </div>
    </div>
  );
}

export function FeaturedBlogSkeleton() {
  return (
    <div className="premium-card overflow-hidden opacity-60">
      <div className="grid md:grid-cols-2 md:h-[400px] lg:h-[450px]">
        <Skeleton className="md:h-full aspect-video md:aspect-auto" />
        <div className="p-6 md:p-8 lg:p-12 flex flex-col justify-center space-y-6">
          <div className="flex gap-3 items-center">
            <Skeleton className="h-5 w-24 rounded-lg" />
            <Skeleton className="h-3 w-20 rounded-sm" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-3/4 rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full rounded-sm" />
            <Skeleton className="h-4 w-full rounded-sm" />
            <Skeleton className="h-4 w-1/2 rounded-sm" />
          </div>
          <div className="pt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-20 rounded-sm" />
                <Skeleton className="h-2 w-16 rounded-sm" />
              </div>
            </div>
            <Skeleton className="h-4 w-20 rounded-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
