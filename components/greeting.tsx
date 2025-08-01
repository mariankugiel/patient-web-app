import type { ReactNode } from "react"

interface GreetingProps {
  name: string
  children?: ReactNode
}

export function Greeting({ name, children }: GreetingProps) {
  // Get current time of day for greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  return (
    <div>
      <p className="text-2xl font-bold text-primary">
        {getGreeting()}, {name}!
      </p>
      {children && <p className="text-muted-foreground">{children}</p>}
    </div>
  )
}
