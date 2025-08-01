import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="flex flex-col space-y-6 p-6">
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      <div className="flex flex-col space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="flex justify-end">
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 p-4">
          <Skeleton className="h-10 w-full mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="md:col-span-2 p-4">
          <div className="flex flex-col h-[600px]">
            <div className="border-b pb-4 mb-4">
              <div className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                  {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full mr-2" />}
                  <Skeleton className={`h-20 ${i % 2 === 0 ? "w-2/3" : "w-1/2"} rounded-lg`} />
                  {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full ml-2" />}
                </div>
              ))}
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="flex gap-2">
                <Skeleton className="h-16 flex-1" />
                <Skeleton className="h-16 w-16" />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
