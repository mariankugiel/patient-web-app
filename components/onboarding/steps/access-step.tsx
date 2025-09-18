"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, User, Shield, Eye, Edit } from "lucide-react"
import { type Language, getTranslation } from "@/lib/translations"

interface HealthProfessional {
  id: string
  name: string
  email: string
  specialty: string
  organization: string
  permissions: AccessPermission[]
}

interface FamilyFriend {
  id: string
  name: string
  email: string
  relationship: string
  permissions: AccessPermission[]
}

interface AccessPermission {
  area: string
  view: boolean
  download: boolean
  edit: boolean
}

interface AccessData {
  healthProfessionals: HealthProfessional[]
  familyFriends: FamilyFriend[]
}

interface AccessStepProps {
  formData: { access: AccessData }
  updateFormData: (data: Partial<AccessData>) => void
  language: Language
}

const specialties = [
  "General Practice",
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gastroenterology",
  "Gynecology",
  "Neurology",
  "Oncology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "Radiology",
  "Urology",
  "Other"
]

const accessAreas = [
  "Medical History",
  "Health Records",
  "Health Plan", 
  "Medications",
  "Appointments",
  "Messages"
]

const relationshipOptions = [
  "Spouse",
  "Parent",
  "Child",
  "Sibling",
  "Grandparent",
  "Grandchild",
  "Friend",
  "Caregiver",
  "Other"
]

export function AccessStep({ formData, updateFormData, language }: AccessStepProps) {
  const t = getTranslation(language, "steps.access")

  // Health Professionals functions
  const addHealthProfessional = () => {
    const initialPermissions = accessAreas.map(area => ({
      area,
      view: false,
      download: false,
      edit: false
    }))
    
    const newProfessional: HealthProfessional = {
      id: `professional-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: "",
      email: "",
      specialty: "",
      organization: "",
      permissions: initialPermissions
    }
    updateFormData({
      healthProfessionals: [...(formData.access?.healthProfessionals || []), newProfessional]
    })
  }

  const removeHealthProfessional = (professionalId: string) => {
    updateFormData({
      healthProfessionals: (formData.access?.healthProfessionals || []).filter(professional => professional.id !== professionalId)
    })
  }

  const updateHealthProfessional = (professionalId: string, field: keyof HealthProfessional, value: string) => {
    updateFormData({
      healthProfessionals: (formData.access?.healthProfessionals || []).map(professional => 
        professional.id === professionalId ? { ...professional, [field]: value } : professional
      )
    })
  }

  // Family/Friends functions
  const addFamilyFriend = () => {
    const initialPermissions = accessAreas.map(area => ({
      area,
      view: false,
      download: false,
      edit: false
    }))
    
    const newFamilyFriend: FamilyFriend = {
      id: `family-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: "",
      email: "",
      relationship: "",
      permissions: initialPermissions
    }
    updateFormData({
      familyFriends: [...(formData.access?.familyFriends || []), newFamilyFriend]
    })
  }

  const removeFamilyFriend = (familyFriendId: string) => {
    updateFormData({
      familyFriends: (formData.access?.familyFriends || []).filter(familyFriend => familyFriend.id !== familyFriendId)
    })
  }

  const updateFamilyFriend = (familyFriendId: string, field: keyof FamilyFriend, value: string) => {
    updateFormData({
      familyFriends: (formData.access?.familyFriends || []).map(familyFriend => 
        familyFriend.id === familyFriendId ? { ...familyFriend, [field]: value } : familyFriend
      )
    })
  }

  // Access Permissions functions
  const updateHealthProfessionalPermission = (professionalId: string, area: string, field: 'view' | 'download' | 'edit', value: boolean) => {
    updateFormData({
      healthProfessionals: (formData.access?.healthProfessionals || []).map(professional => 
        professional.id === professionalId 
          ? {
              ...professional,
              permissions: professional.permissions.map(permission => 
                permission.area === area ? { ...permission, [field]: value } : permission
              )
            }
          : professional
      )
    })
  }

  const updateFamilyFriendPermission = (familyFriendId: string, area: string, field: 'view' | 'download' | 'edit', value: boolean) => {
    updateFormData({
      familyFriends: (formData.access?.familyFriends || []).map(familyFriend => 
        familyFriend.id === familyFriendId 
          ? {
              ...familyFriend,
              permissions: familyFriend.permissions.map(permission => 
                permission.area === area ? { ...permission, [field]: value } : permission
              )
            }
          : familyFriend
      )
    })
  }

  return (
    <div className="space-y-8">
      {/* Health Professionals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5" />
            Health Professionals
            <span className="text-sm font-normal text-gray-500">
              ({(formData.access?.healthProfessionals || []).length} professionals)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {(formData.access?.healthProfessionals || []).map((professional) => (
            <div key={professional.id} className="border rounded-lg p-6 space-y-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`professionalName-${professional.id}`}>Name</Label>
                    <Input
                      id={`professionalName-${professional.id}`}
                      value={professional.name}
                      onChange={(e) => updateHealthProfessional(professional.id, 'name', e.target.value)}
                      placeholder="e.g., Dr. Johnson"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`professionalSpecialty-${professional.id}`}>Specialty</Label>
                    <Select
                      value={professional.specialty}
                      onValueChange={(value) => updateHealthProfessional(professional.id, 'specialty', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="e.g., Cardiologist" />
                      </SelectTrigger>
                      <SelectContent>
                        {specialties.map((specialty) => (
                          <SelectItem key={specialty} value={specialty.toLowerCase().replace(' ', '-')}>
                            {specialty}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor={`professionalEmail-${professional.id}`}>Email</Label>
                  <Input
                    id={`professionalEmail-${professional.id}`}
                    type="email"
                    value={professional.email}
                    onChange={(e) => updateHealthProfessional(professional.id, 'email', e.target.value)}
                    placeholder="doctor@hospital.com"
                  />
                </div>
              </div>

              {/* Permissions Table */}
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Update what this contact can access and what actions they can perform.
                </p>
                
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 border-b">
                    <div className="grid grid-cols-4 gap-4 p-4 font-medium text-sm">
                      <div>Category</div>
                      <div className="text-center">View</div>
                      <div className="text-center">Download</div>
                      <div className="text-center">Edit</div>
                    </div>
                  </div>
                  <div className="divide-y">
                    {accessAreas.map((area) => {
                      const permission = professional.permissions?.find(p => p.area === area)
                      const canDownload = area !== "Appointments" && area !== "Messages"
                      return (
                        <div key={area} className="grid grid-cols-4 gap-4 p-4 items-center">
                          <div className="font-medium text-sm">{area}</div>
                          <div className="flex justify-center">
                            <Checkbox
                              id={`view-${professional.id}-${area}`}
                              checked={permission?.view || false}
                              onCheckedChange={(checked) => updateHealthProfessionalPermission(professional.id, area, 'view', checked as boolean)}
                            />
                          </div>
                          <div className="flex justify-center">
                            {canDownload ? (
                              <Checkbox
                                id={`download-${professional.id}-${area}`}
                                checked={permission?.download || false}
                                onCheckedChange={(checked) => updateHealthProfessionalPermission(professional.id, area, 'download', checked as boolean)}
                              />
                            ) : (
                              <span className="text-gray-400 text-lg">—</span>
                            )}
                          </div>
                          <div className="flex justify-center">
                            <Checkbox
                              id={`edit-${professional.id}-${area}`}
                              checked={permission?.edit || false}
                              onCheckedChange={(checked) => updateHealthProfessionalPermission(professional.id, area, 'edit', checked as boolean)}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Remove Button */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeHealthProfessional(professional.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Professional
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addHealthProfessional}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Health Professional
          </Button>
        </CardContent>
      </Card>

      {/* Family & Friends */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5" />
            Authorized Family & Friends
            <span className="text-sm font-normal text-gray-500">
              ({(formData.access?.familyFriends || []).length} contacts)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {(formData.access?.familyFriends || []).map((familyFriend) => (
            <div key={familyFriend.id} className="border rounded-lg p-6 space-y-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`familyName-${familyFriend.id}`}>Name</Label>
                    <Input
                      id={`familyName-${familyFriend.id}`}
                      value={familyFriend.name}
                      onChange={(e) => updateFamilyFriend(familyFriend.id, 'name', e.target.value)}
                      placeholder="e.g., John Smith"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`familyRelationship-${familyFriend.id}`}>Relationship</Label>
                    <Select
                      value={familyFriend.relationship}
                      onValueChange={(value) => updateFamilyFriend(familyFriend.id, 'relationship', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        {relationshipOptions.map((relationship) => (
                          <SelectItem key={relationship} value={relationship.toLowerCase()}>
                            {relationship}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor={`familyEmail-${familyFriend.id}`}>Email</Label>
                  <Input
                    id={`familyEmail-${familyFriend.id}`}
                    type="email"
                    value={familyFriend.email}
                    onChange={(e) => updateFamilyFriend(familyFriend.id, 'email', e.target.value)}
                    placeholder="family@email.com"
                  />
                </div>
              </div>

              {/* Permissions Table */}
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Update what this contact can access and what actions they can perform.
                </p>
                
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 border-b">
                    <div className="grid grid-cols-4 gap-4 p-4 font-medium text-sm">
                      <div>Category</div>
                      <div className="text-center">View</div>
                      <div className="text-center">Download</div>
                      <div className="text-center">Edit</div>
                    </div>
                  </div>
                  <div className="divide-y">
                    {accessAreas.map((area) => {
                      const permission = familyFriend.permissions?.find(p => p.area === area)
                      const canDownload = area !== "Appointments" && area !== "Messages"
                      return (
                        <div key={area} className="grid grid-cols-4 gap-4 p-4 items-center">
                          <div className="font-medium text-sm">{area}</div>
                          <div className="flex justify-center">
                            <Checkbox
                              id={`view-family-${familyFriend.id}-${area}`}
                              checked={permission?.view || false}
                              onCheckedChange={(checked) => updateFamilyFriendPermission(familyFriend.id, area, 'view', checked as boolean)}
                            />
                          </div>
                          <div className="flex justify-center">
                            {canDownload ? (
                              <Checkbox
                                id={`download-family-${familyFriend.id}-${area}`}
                                checked={permission?.download || false}
                                onCheckedChange={(checked) => updateFamilyFriendPermission(familyFriend.id, area, 'download', checked as boolean)}
                              />
                            ) : (
                              <span className="text-gray-400 text-lg">—</span>
                            )}
                          </div>
                          <div className="flex justify-center">
                            <Checkbox
                              id={`edit-family-${familyFriend.id}-${area}`}
                              checked={permission?.edit || false}
                              onCheckedChange={(checked) => updateFamilyFriendPermission(familyFriend.id, area, 'edit', checked as boolean)}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Remove Button */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeFamilyFriend(familyFriend.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Contact
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addFamilyFriend}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Family/Friend
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
