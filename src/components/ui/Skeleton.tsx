import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200 dark:bg-gray-800", className)}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={cn(
            "h-4 w-full",
            i === lines - 1 && lines > 1 ? "w-2/3" : ""
          )} 
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col", className)}>
      <Skeleton className="w-full aspect-[4/3] md:aspect-[1/1] rounded-2xl mb-3" />
      <div className="space-y-1">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2 pt-1 mt-1" />
      </div>
    </div>
  );
}

export { SkeletonCard as VehicleCardSkeleton };

export function VehicleDetailSkeleton() {
  return (
    <div className="max-w-[1400px] mx-auto px-6 pt-32 pb-20 space-y-10">
      {/* Back button */}
      <Skeleton className="h-6 w-24 rounded-full" />
      
      {/* Top Image Hero & side details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="w-full aspect-[16/9] rounded-[2.5rem]" />
          <div className="grid grid-cols-4 gap-4">
            <Skeleton className="aspect-[4/3] rounded-2xl" />
            <Skeleton className="aspect-[4/3] rounded-2xl" />
            <Skeleton className="aspect-[4/3] rounded-2xl" />
            <Skeleton className="aspect-[4/3] rounded-2xl" />
          </div>
        </div>
        
        {/* Right Info Box */}
        <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-8 border border-gray-100 dark:border-gray-800 space-y-6 h-fit">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-12 w-full rounded-full" />
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
