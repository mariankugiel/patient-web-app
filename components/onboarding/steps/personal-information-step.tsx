"use client"

import { useState, useMemo } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LocationSearch } from "@/components/ui/location-search"
import { type Language, getTranslation } from "@/lib/translations"

const COUNTRY_CODES = [
  { code: "AF", dial: "+93", name: "Afghanistan" },
  { code: "AL", dial: "+355", name: "Albania" },
  { code: "DZ", dial: "+213", name: "Algeria" },
  { code: "AD", dial: "+376", name: "Andorra" },
  { code: "AO", dial: "+244", name: "Angola" },
  { code: "AR", dial: "+54", name: "Argentina" },
  { code: "AM", dial: "+374", name: "Armenia" },
  { code: "AU", dial: "+61", name: "Australia" },
  { code: "AT", dial: "+43", name: "Austria" },
  { code: "AZ", dial: "+994", name: "Azerbaijan" },
  { code: "BH", dial: "+973", name: "Bahrain" },
  { code: "BD", dial: "+880", name: "Bangladesh" },
  { code: "BY", dial: "+375", name: "Belarus" },
  { code: "BE", dial: "+32", name: "Belgium" },
  { code: "BZ", dial: "+501", name: "Belize" },
  { code: "BJ", dial: "+229", name: "Benin" },
  { code: "BT", dial: "+975", name: "Bhutan" },
  { code: "BO", dial: "+591", name: "Bolivia" },
  { code: "BA", dial: "+387", name: "Bosnia and Herzegovina" },
  { code: "BW", dial: "+267", name: "Botswana" },
  { code: "BR", dial: "+55", name: "Brazil" },
  { code: "BN", dial: "+673", name: "Brunei" },
  { code: "BG", dial: "+359", name: "Bulgaria" },
  { code: "BF", dial: "+226", name: "Burkina Faso" },
  { code: "BI", dial: "+257", name: "Burundi" },
  { code: "KH", dial: "+855", name: "Cambodia" },
  { code: "CM", dial: "+237", name: "Cameroon" },
  { code: "CA", dial: "+1", name: "Canada" },
  { code: "CV", dial: "+238", name: "Cape Verde" },
  { code: "CF", dial: "+236", name: "Central African Republic" },
  { code: "TD", dial: "+235", name: "Chad" },
  { code: "CL", dial: "+56", name: "Chile" },
  { code: "CN", dial: "+86", name: "China" },
  { code: "CO", dial: "+57", name: "Colombia" },
  { code: "KM", dial: "+269", name: "Comoros" },
  { code: "CG", dial: "+242", name: "Congo" },
  { code: "CR", dial: "+506", name: "Costa Rica" },
  { code: "HR", dial: "+385", name: "Croatia" },
  { code: "CU", dial: "+53", name: "Cuba" },
  { code: "CY", dial: "+357", name: "Cyprus" },
  { code: "CZ", dial: "+420", name: "Czech Republic" },
  { code: "DK", dial: "+45", name: "Denmark" },
  { code: "DJ", dial: "+253", name: "Djibouti" },
  { code: "DO", dial: "+1-809", name: "Dominican Republic" },
  { code: "EC", dial: "+593", name: "Ecuador" },
  { code: "EG", dial: "+20", name: "Egypt" },
  { code: "SV", dial: "+503", name: "El Salvador" },
  { code: "GQ", dial: "+240", name: "Equatorial Guinea" },
  { code: "ER", dial: "+291", name: "Eritrea" },
  { code: "EE", dial: "+372", name: "Estonia" },
  { code: "ET", dial: "+251", name: "Ethiopia" },
  { code: "FJ", dial: "+679", name: "Fiji" },
  { code: "FI", dial: "+358", name: "Finland" },
  { code: "FR", dial: "+33", name: "France" },
  { code: "GA", dial: "+241", name: "Gabon" },
  { code: "GM", dial: "+220", name: "Gambia" },
  { code: "GE", dial: "+995", name: "Georgia" },
  { code: "DE", dial: "+49", name: "Germany" },
  { code: "GH", dial: "+233", name: "Ghana" },
  { code: "GR", dial: "+30", name: "Greece" },
  { code: "GT", dial: "+502", name: "Guatemala" },
  { code: "GN", dial: "+224", name: "Guinea" },
  { code: "GW", dial: "+245", name: "Guinea-Bissau" },
  { code: "GY", dial: "+592", name: "Guyana" },
  { code: "HT", dial: "+509", name: "Haiti" },
  { code: "HN", dial: "+504", name: "Honduras" },
  { code: "HK", dial: "+852", name: "Hong Kong" },
  { code: "HU", dial: "+36", name: "Hungary" },
  { code: "IS", dial: "+354", name: "Iceland" },
  { code: "IN", dial: "+91", name: "India" },
  { code: "ID", dial: "+62", name: "Indonesia" },
  { code: "IR", dial: "+98", name: "Iran" },
  { code: "IQ", dial: "+964", name: "Iraq" },
  { code: "IE", dial: "+353", name: "Ireland" },
  { code: "IL", dial: "+972", name: "Israel" },
  { code: "IT", dial: "+39", name: "Italy" },
  { code: "JM", dial: "+1-876", name: "Jamaica" },
  { code: "JP", dial: "+581", name: "Japan" },
  { code: "JO", dial: "+962", name: "Jordan" },
  { code: "KZ", dial: "+7", name: "Kazakhstan" },
  { code: "KE", dial: "+254", name: "Kenya" },
  { code: "KW", dial: "+965", name: "Kuwait" },
  { code: "KG", dial: "+996", name: "Kyrgyzstan" },
  { code: "LA", dial: "+856", name: "Laos" },
  { code: "LV", dial: "+371", name: "Latvia" },
  { code: "LB", dial: "+961", name: "Lebanon" },
  { code: "LS", dial: "+266", name: "Lesotho" },
  { code: "LR", dial: "+231", name: "Liberia" },
  { code: "LY", dial: "+218", name: "Libya" },
  { code: "LI", dial: "+423", name: "Liechtenstein" },
  { code: "LT", dial: "+370", name: "Lithuania" },
  { code: "LU", dial: "+352", name: "Luxembourg" },
  { code: "MO", dial: "+853", name: "Macau" },
  { code: "MK", dial: "+389", name: "Macedonia" },
  { code: "MG", dial: "+261", name: "Madagascar" },
  { code: "MW", dial: "+265", name: "Malawi" },
  { code: "MY", dial: "+60", name: "Malaysia" },
  { code: "MV", dial: "+960", name: "Maldives" },
  { code: "ML", dial: "+223", name: "Mali" },
  { code: "MT", dial: "+356", name: "Malta" },
  { code: "MR", dial: "+222", name: "Mauritania" },
  { code: "MU", dial: "+230", name: "Mauritius" },
  { code: "MX", dial: "+52", name: "Mexico" },
  { code: "MD", dial: "+373", name: "Moldova" },
  { code: "MC", dial: "+377", name: "Monaco" },
  { code: "MN", dial: "+976", name: "Mongolia" },
  { code: "ME", dial: "+382", name: "Montenegro" },
  { code: "MA", dial: "+212", name: "Morocco" },
  { code: "MZ", dial: "+258", name: "Mozambique" },
  { code: "MM", dial: "+95", name: "Myanmar" },
  { code: "NA", dial: "+264", name: "Namibia" },
  { code: "NP", dial: "+977", name: "Nepal" },
  { code: "NL", dial: "+31", name: "Netherlands" },
  { code: "NZ", dial: "+64", name: "New Zealand" },
  { code: "NI", dial: "+505", name: "Nicaragua" },
  { code: "NE", dial: "+227", name: "Niger" },
  { code: "NG", dial: "+234", name: "Nigeria" },
  { code: "NO", dial: "+47", name: "Norway" },
  { code: "OM", dial: "+968", name: "Oman" },
  { code: "PK", dial: "+92", name: "Pakistan" },
  { code: "PS", dial: "+970", name: "Palestine" },
  { code: "PA", dial: "+507", name: "Panama" },
  { code: "PG", dial: "+675", name: "Papua New Guinea" },
  { code: "PY", dial: "+595", name: "Paraguay" },
  { code: "PE", dial: "+51", name: "Peru" },
  { code: "PH", dial: "+63", name: "Philippines" },
  { code: "PL", dial: "+48", name: "Poland" },
  { code: "PT", dial: "+351", name: "Portugal" },
  { code: "QA", dial: "+974", name: "Qatar" },
  { code: "RO", dial: "+40", name: "Romania" },
  { code: "RU", dial: "+7", name: "Russia" },
  { code: "RW", dial: "+250", name: "Rwanda" },
  { code: "SA", dial: "+966", name: "Saudi Arabia" },
  { code: "SN", dial: "+221", name: "Senegal" },
  { code: "RS", dial: "+381", name: "Serbia" },
  { code: "SC", dial: "+248", name: "Seychelles" },
  { code: "SL", dial: "+232", name: "Sierra Leone" },
  { code: "SG", dial: "+65", name: "Singapore" },
  { code: "SK", dial: "+421", name: "Slovakia" },
  { code: "SI", dial: "+386", name: "Slovenia" },
  { code: "SO", dial: "+252", name: "Somalia" },
  { code: "ZA", dial: "+27", name: "South Africa" },
  { code: "KR", dial: "+82", name: "South Korea" },
  { code: "SS", dial: "+211", name: "South Sudan" },
  { code: "ES", dial: "+34", name: "Spain" },
  { code: "LK", dial: "+94", name: "Sri Lanka" },
  { code: "SD", dial: "+249", name: "Sudan" },
  { code: "SR", dial: "+597", name: "Suriname" },
  { code: "SZ", dial: "+268", name: "Swaziland" },
  { code: "SE", dial: "+46", name: "Sweden" },
  { code: "CH", dial: "+41", name: "Switzerland" },
  { code: "SY", dial: "+963", name: "Syria" },
  { code: "TW", dial: "+886", name: "Taiwan" },
  { code: "TJ", dial: "+992", name: "Tajikistan" },
  { code: "TZ", dial: "+255", name: "Tanzania" },
  { code: "TH", dial: "+66", name: "Thailand" },
  { code: "TG", dial: "+228", name: "Togo" },
  { code: "TO", dial: "+676", name: "Tonga" },
  { code: "TT", dial: "+1-868", name: "Trinidad and Tobago" },
  { code: "TN", dial: "+216", name: "Tunisia" },
  { code: "TR", dial: "+90", name: "Turkey" },
  { code: "TM", dial: "+993", name: "Turkmenistan" },
  { code: "UG", dial: "+256", name: "Uganda" },
  { code: "UA", dial: "+380", name: "Ukraine" },
  { code: "AE", dial: "+971", name: "United Arab Emirates" },
  { code: "GB", dial: "+44", name: "United Kingdom" },
  { code: "US", dial: "+1", name: "United States" },
  { code: "UY", dial: "+598", name: "Uruguay" },
  { code: "UZ", dial: "+998", name: "Uzbekistan" },
  { code: "VU", dial: "+678", name: "Vanuatu" },
  { code: "VE", dial: "+58", name: "Venezuela" },
  { code: "VN", dial: "+84", name: "Vietnam" },
  { code: "YE", dial: "+967", name: "Yemen" },
  { code: "ZM", dial: "+260", name: "Zambia" },
  { code: "ZW", dial: "+263", name: "Zimbabwe" },
]

interface LocationDetails {
  display_name: string
  address: {
    city?: string
    state?: string
    country?: string
    country_code?: string
  }
  lat: string
  lon: string
}

interface FormData {
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  height: string
  weight: string
  waistDiameter: string
  location: string
  locationDetails?: LocationDetails
  phoneCountryCode: string
  phone: string
  emergencyContactName: string
  emergencyContactCountryCode: string
  emergencyContactPhone: string
  emergencyContactRelationship: string
}

interface PersonalInformationStepProps {
  formData: FormData
  updateFormData: (field: string, value: any) => void
  language: Language
  fieldErrors?: Record<string, string>
}

export function PersonalInformationStep({ formData, updateFormData, language, fieldErrors = {} }: PersonalInformationStepProps) {
  const [phoneCountrySearch, setPhoneCountrySearch] = useState("")
  const [emergencyCountrySearch, setEmergencyCountrySearch] = useState("")

  const filteredPhoneCountries = COUNTRY_CODES;

  const filteredEmergencyCountries = COUNTRY_CODES;

  return (
    <div className="space-y-6">
      {/* Personal Information Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">{getTranslation(language, "fields.firstName")} *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => updateFormData("firstName", e.target.value)}
            placeholder={getTranslation(language, "placeholders.enterName")}
            className={`border-2 ${fieldErrors.firstName ? 'border-red-500' : 'border-gray-300'}`}
          />
          {fieldErrors.firstName && (
            <p className="text-red-500 text-sm mt-1">{fieldErrors.firstName}</p>
          )}
        </div>
        <div>
          <Label htmlFor="lastName">{getTranslation(language, "fields.lastName")} *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => updateFormData("lastName", e.target.value)}
            placeholder={getTranslation(language, "placeholders.enterName")}
            className={`border-2 ${fieldErrors.lastName ? 'border-red-500' : 'border-gray-300'}`}
          />
          {fieldErrors.lastName && (
            <p className="text-red-500 text-sm mt-1">{fieldErrors.lastName}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dateOfBirth">{getTranslation(language, "fields.dateOfBirth")} *</Label>
          <Input
            type="date"
            id="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={(e) => updateFormData("dateOfBirth", e.target.value)}
            className={`border-2 ${fieldErrors.dateOfBirth ? 'border-red-500' : 'border-gray-300'}`}
          />
          {fieldErrors.dateOfBirth && (
            <p className="text-red-500 text-sm mt-1">{fieldErrors.dateOfBirth}</p>
          )}
        </div>
        <div>
          <Label htmlFor="gender">{getTranslation(language, "fields.gender")}</Label>
          <Select value={formData.gender} onValueChange={(value) => updateFormData("gender", value)}>
            <SelectTrigger className={`border-2 ${fieldErrors.gender ? 'border-red-500' : 'border-gray-300'}`}>
              <SelectValue placeholder={getTranslation(language, "placeholders.selectGender")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">{getTranslation(language, "options.male")}</SelectItem>
              <SelectItem value="female">{getTranslation(language, "options.female")}</SelectItem>
              <SelectItem value="other">{getTranslation(language, "options.other")}</SelectItem>
              <SelectItem value="preferNotToSay">{getTranslation(language, "options.preferNotToSay")}</SelectItem>
            </SelectContent>
          </Select>
          {fieldErrors.gender && (
            <p className="text-red-500 text-sm mt-1">{fieldErrors.gender}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="height">{getTranslation(language, "fields.height")}</Label>
          <Input
            id="height"
            type="number"
            step="0.1"
            min="0"
            value={formData.height}
            onChange={(e) => updateFormData("height", e.target.value)}
            placeholder={getTranslation(language, "placeholders.enterHeight")}
            className="border-2 border-gray-300"
          />
        </div>
        <div>
          <Label htmlFor="weight">{getTranslation(language, "fields.weight")}</Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            min="0"
            value={formData.weight}
            onChange={(e) => updateFormData("weight", e.target.value)}
            placeholder={getTranslation(language, "placeholders.enterWeight")}
            className="border-2 border-gray-300"
          />
        </div>
        <div>
          <Label htmlFor="waistDiameter">{getTranslation(language, "fields.waistDiameter")}</Label>
          <Input
            id="waistDiameter"
            type="number"
            step="0.1"
            min="0"
            value={formData.waistDiameter}
            onChange={(e) => updateFormData("waistDiameter", e.target.value)}
            placeholder={getTranslation(language, "placeholders.enterWaist")}
            className="border-2 border-gray-300"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LocationSearch
          value={formData.location}
          onChange={(location, details) => {
            updateFormData("location", location)
            if (details) {
              updateFormData("locationDetails", details)
            }
          }}
          placeholder={getTranslation(language, "placeholders.enterLocation")}
          label={getTranslation(language, "fields.location")}
          error={fieldErrors.location}
          required={true}
        />

        <div>
          <Label htmlFor="phone">{getTranslation(language, "fields.phone")} *</Label>
          <div className="flex gap-2">
            <Select
              value={formData.phoneCountryCode}
              onValueChange={(value) => updateFormData("phoneCountryCode", value)}
            >
              <SelectTrigger className="w-[70px] border-2 border-gray-300">
                <SelectValue>
                  {COUNTRY_CODES.find((c) => c.dial === formData.phoneCountryCode)?.code || "PT"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <Input
                    placeholder="Search country..."
                    value={phoneCountrySearch}
                    onChange={(e) => setPhoneCountrySearch(e.target.value)}
                    className="mb-2"
                  />
                </div>
                <div className="max-h-[200px] overflow-y-auto">
                  {filteredPhoneCountries.map((country) => (
                    <SelectItem key={country.code} value={country.dial}>
                      <span className="font-medium">{country.code}</span>{" "}
                      <span className="text-xs text-muted-foreground">{country.dial}</span>
                    </SelectItem>
                  ))}
                </div>
              </SelectContent>
            </Select>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => updateFormData("phone", e.target.value)}
              placeholder={getTranslation(language, "placeholders.enterPhone")}
              className={`flex-1 border-2 ${fieldErrors.phone ? 'border-red-500' : 'border-gray-300'}`}
            />
          </div>
          {fieldErrors.phone && (
            <p className="text-red-500 text-sm mt-1">{fieldErrors.phone}</p>
          )}
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="mt-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
          {getTranslation(language, "sections.emergencyContact")}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_2fr_1.2fr] gap-4">
          <div>
            <Label htmlFor="emergencyContactName">{getTranslation(language, "fields.emergencyContactName")}</Label>
            <Input
              id="emergencyContactName"
              value={formData.emergencyContactName}
              onChange={(e) => updateFormData("emergencyContactName", e.target.value)}
              placeholder={getTranslation(language, "placeholders.enterName")}
              className={`border-2 ${fieldErrors.emergencyContactName ? 'border-red-500' : 'border-gray-300'}`}
            />
            {fieldErrors.emergencyContactName && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.emergencyContactName}</p>
            )}
          </div>
          <div>
            <Label htmlFor="emergencyContactPhone">{getTranslation(language, "fields.emergencyContactPhone")}</Label>
            <div className="flex gap-2">
              <Select
                value={formData.emergencyContactCountryCode || "+351"}
                onValueChange={(value) => updateFormData("emergencyContactCountryCode", value)}
              >
                <SelectTrigger className="w-[70px] border-2 border-gray-300">
                  <SelectValue>
                    {COUNTRY_CODES.find((c) => c.dial === formData.emergencyContactCountryCode)?.code || "PT"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Search country..."
                      value={emergencyCountrySearch}
                      onChange={(e) => setEmergencyCountrySearch(e.target.value)}
                      className="mb-2"
                    />
                  </div>
                  <div className="max-h-[200px] overflow-y-auto">
                    {/* {filteredEmergencyCountries.map((country) => (
                      <SelectItem key={country.code} value={country.dial}>
                        <span className="font-medium">{country.code}</span>{" "}
                        <span className="text-xs text-muted-foreground">{country.dial}</span>
                      </SelectItem>
                    ))} */}
                  </div>
                </SelectContent>
              </Select>
              <Input
                id="emergencyContactPhone"
                value={formData.emergencyContactPhone}
                onChange={(e) => updateFormData("emergencyContactPhone", e.target.value)}
                placeholder={getTranslation(language, "placeholders.enterPhone")}
                className={`flex-1 border-2 ${fieldErrors.emergencyContactPhone ? 'border-red-500' : 'border-gray-300'}`}
              />
            </div>
            {fieldErrors.emergencyContactPhone && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.emergencyContactPhone}</p>
            )}
          </div>
          <div>
            <Label htmlFor="emergencyContactRelationship">{getTranslation(language, "fields.emergencyContactRelationship")}</Label>
            <Select
              value={formData.emergencyContactRelationship}
              onValueChange={(value) => updateFormData("emergencyContactRelationship", value)}
            >
              <SelectTrigger className={`border-2 ${fieldErrors.emergencyContactRelationship ? 'border-red-500' : 'border-gray-300'}`}>
                <SelectValue placeholder={getTranslation(language, "placeholders.selectRelationship")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spousePartner">{getTranslation(language, "options.spousePartner")}</SelectItem>
                <SelectItem value="parent">{getTranslation(language, "options.parent")}</SelectItem>
                <SelectItem value="sibling">{getTranslation(language, "options.sibling")}</SelectItem>
                <SelectItem value="child">{getTranslation(language, "options.child")}</SelectItem>
                <SelectItem value="friend">{getTranslation(language, "options.friend")}</SelectItem>
                <SelectItem value="other">{getTranslation(language, "options.other")}</SelectItem>
              </SelectContent>
            </Select>
            {fieldErrors.emergencyContactRelationship && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.emergencyContactRelationship}</p>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}


