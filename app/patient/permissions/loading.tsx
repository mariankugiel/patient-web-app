import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-4 w-[350px] mt-2" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />

        <div className="space-y-4">
          <Skeleton className="h-[150px] w-full" />
          <Skeleton className="h-[250px] w-full" />
        </div>
      </div>
    </div>
  )
}
