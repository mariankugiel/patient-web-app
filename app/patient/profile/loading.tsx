import { Skeleton } from "@/components/ui/skeleton"

export default function ProfileLoading() {
  return (
    <div className="container py-6">
      <div className="flex flex-col items-center text-center mb-6">
        <Skeleton className="h-24 w-24 rounded-full" />
        <Skeleton className="h-8 w-48 mt-4" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>

      <Skeleton className="h-12 w-full mb-6" />

      <Skeleton className="h-[600px] w-full" />
    </div>
  )
}
