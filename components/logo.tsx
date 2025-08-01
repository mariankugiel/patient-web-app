import Link from "next/link"

type LogoProps = {
  size?: "sm" | "md" | "lg"
  showText?: boolean
  className?: string
  variant?: "default" | "sidebar" | "mobile" | "login"
}

export function Logo({ size = "md", showText = true, className = "", variant = "default" }: LogoProps) {
  // Define consistent sizes for all variants
  const sizes = {
    sm: { width: 156, height: 52 }, // Increased by 30% from 120x40
    md: { width: 195, height: 65 }, // Increased by 30% from 150x50
    lg: { width: 234, height: 78 }, // Increased by 30% from 180x60
  }

  const { width, height } = sizes[size]

  return (
    <Link href="/patient/dashboard" className={`inline-block ${className}`}>
      <img
        src="/images/saluso-logo-horizontal.png"
        alt="Saluso - Healthcare Platform"
        width={width}
        height={height}
        className="h-auto w-auto object-contain"
        style={{ maxWidth: width, maxHeight: height }}
      />
    </Link>
  )
}
