"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type Language, getTranslation } from "@/lib/translations"

interface FormData {
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  height: string
  weight: string
  waistDiameter: string
  location: string
  country: string
  phone: string
  email: string
  emergencyContactName: string
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

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="height">{getTranslation(language, "fields.height")}</Label>
          <Input
            id="height"
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
            value={formData.waistDiameter}
            onChange={(e) => updateFormData("waistDiameter", e.target.value)}
            placeholder={getTranslation(language, "placeholders.enterWaist")}
            className="border-2 border-gray-300"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="location">{getTranslation(language, "fields.location")}</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => updateFormData("location", e.target.value)}
            placeholder={getTranslation(language, "placeholders.enterLocation")}
            className="border-2 border-gray-300"
          />
        </div>
        <div>
          <Label htmlFor="country">{getTranslation(language, "fields.country")}</Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) => updateFormData("country", e.target.value)}
            placeholder={getTranslation(language, "placeholders.enterCountry")}
            className="border-2 border-gray-300"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">{getTranslation(language, "fields.phone")} *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => updateFormData("phone", e.target.value)}
            placeholder={getTranslation(language, "placeholders.enterPhone")}
            className={`border-2 ${fieldErrors.phone ? 'border-red-500' : 'border-gray-300'}`}
          />
          {fieldErrors.phone && (
            <p className="text-red-500 text-sm mt-1">{fieldErrors.phone}</p>
          )}
        </div>
        <div>
          <Label htmlFor="email">{getTranslation(language, "fields.email")}</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData("email", e.target.value)}
            placeholder={getTranslation(language, "placeholders.enterEmail")}
            className={`border-2 ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'}`}
          />
          {fieldErrors.email && (
            <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
          )}
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">{getTranslation(language, "sections.emergencyContact")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <Input
              id="emergencyContactPhone"
              value={formData.emergencyContactPhone}
              onChange={(e) => updateFormData("emergencyContactPhone", e.target.value)}
              placeholder={getTranslation(language, "placeholders.enterPhone")}
              className={`border-2 ${fieldErrors.emergencyContactPhone ? 'border-red-500' : 'border-gray-300'}`}
            />
            {fieldErrors.emergencyContactPhone && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.emergencyContactPhone}</p>
            )}
          </div>
          <div>
            <Label htmlFor="emergencyContactRelationship">{getTranslation(language, "fields.emergencyContactRelationship")}</Label>
            <Input
              id="emergencyContactRelationship"
              value={formData.emergencyContactRelationship}
              onChange={(e) => updateFormData("emergencyContactRelationship", e.target.value)}
              placeholder={getTranslation(language, "placeholders.enterRelationship")}
              className={`border-2 ${fieldErrors.emergencyContactRelationship ? 'border-red-500' : 'border-gray-300'}`}
            />
            {fieldErrors.emergencyContactRelationship && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.emergencyContactRelationship}</p>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}


