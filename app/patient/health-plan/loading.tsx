import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="container py-6">
      <header className="mb-6">
        <Skeleton className="h-8 w-[250px] mb-2" />
        <Skeleton className="h-4 w-[350px]" />
      </header>

      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-10 w-[300px]" />
        <Skeleton className="h-10 w-[150px]" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <Skeleton className="h-6 w-[200px] mb-2" />
                <Skeleton className="h-4 w-[300px]" />
              </div>
              <Skeleton className="h-6 w-[80px]" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[40px]" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>

            <Skeleton className="h-[150px] w-full" />

            <div className="space-y-2">
              <Skeleton className="h-6 w-[150px]" />
              {Array(4)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[150px] mb-2" />
              <Skeleton className="h-4 w-[200px]" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-5 rounded-full" />
                        <div>
                          <Skeleton className="h-5 w-[100px] mb-1" />
                          <Skeleton className="h-4 w-[150px]" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-[60px]" />
                    </div>
                  ))}
                <Skeleton className="h-10 w-full mt-4" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[150px] mb-2" />
              <Skeleton className="h-4 w-[200px]" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-5 w-[100px] mb-1" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                </div>
                <Skeleton className="h-[100px] w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <Skeleton className="h-6 w-[150px] mb-2" />
          <Skeleton className="h-4 w-[200px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(2)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-[100px] w-full" />
              ))}
            <div className="flex gap-2">
              <Skeleton className="h-[80px] w-full" />
              <Skeleton className="h-10 w-10" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
