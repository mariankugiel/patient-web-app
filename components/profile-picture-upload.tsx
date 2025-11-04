"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { uploadProfilePicture, getProfilePictureUrl } from "@/lib/profile-utils"
import { toast } from "react-toastify"

type ProfilePictureUploadProps = {
  currentImage: string
  onImageChange: (src: string) => void
  userId: string
}

export function ProfilePictureUpload({ currentImage, onImageChange, userId }: ProfilePictureUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error("Profile picture must be less than 5MB")
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select a valid image file")
      return
    }

    setIsUploading(true)
    
    try {
      // Upload to Supabase first
      const imageUrl = await uploadProfilePicture(file, userId)
      console.log("✅ Uploaded profile picture, URL:", imageUrl)
      
      // Validate the URL
      if (!imageUrl || !imageUrl.startsWith('http')) {
        throw new Error("Invalid image URL returned from upload")
      }
      
      // Add cache-busting timestamp to force reload
      const urlWithCacheBust = `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}t=${Date.now()}`
      
      // Update with the actual URL from Supabase
      onImageChange(urlWithCacheBust)
      console.log("✅ Called onImageChange with:", urlWithCacheBust)
      
      toast.success("Profile picture updated successfully")
    } catch (error: any) {
      console.error("❌ Error uploading profile picture:", error)
      toast.error(error.message || "Failed to upload profile picture")
      
      // Revert on error - keep the preview shown initially
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <img
        key={currentImage} // Force re-render when image changes
        src={currentImage || "/placeholder-user.jpg"}
        alt="Profile"
        className="h-28 w-28 rounded-full object-cover border"
        onError={(e) => {
          console.error("❌ Image failed to load:", currentImage)
          // Fallback to placeholder if image fails to load
          if (currentImage && currentImage !== "/placeholder-user.jpg") {
            e.currentTarget.src = "/placeholder-user.jpg"
          }
        }}
        onLoad={() => {
          console.log("✅ Image loaded successfully:", currentImage)
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        className="bg-transparent"
        disabled={isUploading}
      >
        {isUploading ? "Uploading..." : "Change photo"}
      </Button>
    </div>
  )
}


