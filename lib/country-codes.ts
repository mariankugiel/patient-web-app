export type CountryCode = {
  code: string // dial code like +1
  country: string // country name
  flag: string // emoji flag
}

export const countryCodes: CountryCode[] = [
  { code: "+1", country: "United States", flag: "🇺🇸" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+34", country: "Spain", flag: "🇪🇸" },
  { code: "+351", country: "Portugal", flag: "🇵🇹" },
  { code: "+55", country: "Brazil", flag: "🇧🇷" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+52", country: "Mexico", flag: "🇲🇽" },
  { code: "+1-809", country: "Dominican Republic", flag: "🇩🇴" },
]


