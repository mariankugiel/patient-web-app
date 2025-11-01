"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"

type ProfilePictureUploadProps = {
  currentImage: string
  onImageChange: (src: string) => void
}

export function ProfilePictureUpload({ currentImage, onImageChange }: ProfilePictureUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  return (
    <div className="flex flex-col items-center gap-3">
      <img
        src={currentImage || "/placeholder-user.jpg"}
        alt="Profile"
        className="h-28 w-28 rounded-full object-cover border"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (!file) return
          const reader = new FileReader()
          reader.onload = () => {
            if (typeof reader.result === "string") onImageChange(reader.result)
          }
          reader.readAsDataURL(file)
        }}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        className="bg-transparent"
      >
        Change photo
      </Button>
    </div>
  )
}


