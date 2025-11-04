import { createClient } from "@/lib/supabase-client"

/**
 * Get contact user's img_url from Supabase user_profiles table
 * @param contactSupabaseUserId - The Supabase UUID of the contact user
 * @returns The img_url from user_profiles, or null if not found
 */
export async function getContactImgUrl(contactSupabaseUserId: string): Promise<string | null> {
  console.log(`📋 getContactImgUrl called with contact user ID:`, contactSupabaseUserId)
  
  if (!contactSupabaseUserId) {
    console.warn('⚠️ getContactImgUrl: No contactSupabaseUserId provided')
    return null
  }

  try {
    const supabase = createClient()
    console.log(`🔍 Querying user_profiles table for contact user ID: ${contactSupabaseUserId}`)
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('img_url, avatar_url')
      .eq('id', contactSupabaseUserId)
      .single()

    if (error) {
      console.error(`❌ Error fetching contact img_url for contact user ID ${contactSupabaseUserId}:`, error)
      return null
    }

    console.log(`📄 Retrieved data from user_profiles for contact user ID ${contactSupabaseUserId}:`, {
      contact_user_id: contactSupabaseUserId,
      img_url: data?.img_url,
      avatar_url: data?.avatar_url,
      has_img_url: !!data?.img_url,
      has_avatar_url: !!data?.avatar_url
    })

    // Prioritize img_url, fall back to avatar_url
    const imgUrl = data?.img_url || data?.avatar_url
    if (imgUrl && imgUrl.trim() !== '' && imgUrl !== 'null') {
      console.log(`✅ Successfully got contact img_url for contact user ID ${contactSupabaseUserId}:`, imgUrl)
      console.log(`📋 Contact User ID: ${contactSupabaseUserId}, Contact User img_url: ${imgUrl}`)
      return imgUrl
    }

    console.log(`⚠️ No img_url found in user_profiles for contact user ID ${contactSupabaseUserId}`)
    console.log(`📋 Contact User ID: ${contactSupabaseUserId}, Contact User img_url: null`)
    return null
  } catch (error) {
    console.error(`❌ Exception in getContactImgUrl for contact user ID ${contactSupabaseUserId}:`, error)
    console.log(`📋 Contact User ID: ${contactSupabaseUserId}, Contact User img_url: error`)
    return null
  }
}

function extractUserIdFromToken(token: string): string | null {
  // Check if this looks like a JWT token (has 3 parts separated by dots)
  if (!token.includes('.') || token.split('.').length !== 3) {
    return null
  }
  
  try {
    // Decode JWT token without verification to get the 'sub' claim (user ID)
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    const decoded = JSON.parse(jsonPayload)
    return decoded.sub || null
  } catch (error) {
    console.error("Error decoding JWT token:", error)
    return null
  }
}

export async function uploadProfilePicture(file: File, userId: string): Promise<string> {
  const supabase = createClient()
  
  try {
    // If userId looks like a JWT token, extract the actual user ID from it
    let actualUserId = userId
    if (userId.includes('.') && userId.split('.').length === 3) {
      const extractedId = extractUserIdFromToken(userId)
      if (extractedId) {
        console.log("🔑 Extracted user ID from JWT token for upload:", extractedId)
        actualUserId = extractedId
      } else {
        console.warn("⚠️ Could not extract user ID from token for upload, using token as-is")
      }
    }
    
    // First, list all files in the user's folder to find existing avatars
    const { data: existingFiles, error: listError } = await supabase.storage
      .from('avatars')
      .list(actualUserId)
    
    if (!listError && existingFiles && existingFiles.length > 0) {
      // Find all avatar files (files that start with "avatar.")
      const avatarFiles = existingFiles
        .filter(file => file.name.startsWith('avatar.'))
        .map(file => `${actualUserId}/${file.name}`)
      
      if (avatarFiles.length > 0) {
        console.log("🗑️ Found existing avatar files to delete:", avatarFiles)
        
        // Delete all existing avatar files
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove(avatarFiles)
        
        if (deleteError) {
          console.log("⚠️ Could not delete old avatars:", deleteError.message)
          // Continue with upload even if delete fails
        } else {
          console.log("✅ Deleted old avatar files:", avatarFiles.length, "file(s)")
        }
      }
    } else if (listError) {
      console.log("⚠️ Could not list existing files (this is OK if folder doesn't exist yet):", listError.message)
    }
    
    // Create a unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `avatar.${fileExt}`
    const filePath = `${actualUserId}/${fileName}`
    
    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // Replace existing avatar
      })
    
    if (error) {
      console.error('❌ Error uploading profile picture:', error)
      throw new Error(`Failed to upload: ${error.message}`)
    }
    
    // Get Supabase URL from environment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
    
    if (!supabaseUrl) {
      console.error('❌ Supabase URL not configured')
      throw new Error(`Supabase URL not configured`)
    }
    
    // Get a signed URL to extract the token
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('avatars')
      .createSignedUrl(filePath, 31536000)
    
    if (signedUrlError || !signedUrlData) {
      console.error('❌ Error generating signed URL:', signedUrlError)
      throw new Error(`Failed to generate URL: ${signedUrlError?.message || 'Unknown error'}`)
    }
    
    // Extract token from signed URL
    const signedUrlObj = new URL(signedUrlData.signedUrl)
    const token = signedUrlObj.searchParams.get('token')
    
    if (!token) {
      console.error('❌ No token found in signed URL')
      throw new Error(`Failed to extract token from signed URL`)
    }
    
    // Construct signed URL: https://{project}.supabase.co/storage/v1/object/sign/avatars/{folder_name}/avatar.jpg?token={token}
    // Use the UUID (actualUserId) as the folder name in the URL
    const finalSignedUrl = `${supabaseUrl}/storage/v1/object/sign/avatars/${actualUserId}/${fileName}?token=${token}`
    
    console.log("🆔 Folder name (UUID):", actualUserId)
    console.log("🎫 Token:", token)
    console.log("🔗 Generated signed URL with token:", finalSignedUrl)
    
    // Save the URL to user_profiles table via backend API
    try {
      // Import the API service dynamically to avoid circular dependencies
      const { AuthApiService } = await import('@/lib/api/auth-api')
      
      console.log('🔐 Updating img_url via backend API:', actualUserId)
      
      // Update profile through backend API
      // The backend will handle updating user_profiles in Supabase
      // Note: We pass avatar_url, backend will map it to img_url
      await AuthApiService.updateProfile({
        avatar_url: finalSignedUrl
      } as any)  // Type assertion needed since avatar_url might not be in the interface yet
      
      console.log('✅ Successfully saved img_url via backend API')
    } catch (error: any) {
      console.warn('⚠️ Could not update img_url via backend API:', error?.message || error)
      // Continue even if update fails - the upload was successful
      // The image is uploaded to storage, just the database update failed
    }
    
    return finalSignedUrl
  } catch (error) {
    console.error('❌ Profile picture upload error:', error)
    throw error
  }
}

export async function getProfilePictureUrl(userId: string): Promise<string> {
  console.log("🚀 getProfilePictureUrl called with userId:", userId)
  const supabase = createClient()
  
  // Get Supabase URL from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  
  if (!supabaseUrl) {
    console.error('❌ Supabase URL not configured')
    return '/placeholder-user.jpg'
  }
  
  // Get the current session to get the access token
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError || !session) {
    console.error('❌ No active session found:', sessionError?.message)
    return '/placeholder-user.jpg'
  }
  
  // If userId looks like a JWT token, extract the actual user ID from it
  let actualUserId = userId
  let folderId = userId // Default to using userId as folder name
  const isJwtToken = userId.includes('.') && userId.split('.').length === 3
  
  if (isJwtToken) {
    const extractedId = extractUserIdFromToken(userId)
    if (extractedId) {
      console.log("🔑 Extracted user ID from JWT token:", extractedId)
      actualUserId = extractedId
      folderId = userId // Keep the JWT token as folder name if that's what's stored
    } else {
      console.warn("⚠️ Could not extract user ID from token, using token as-is")
      folderId = userId
    }
  } else {
    folderId = actualUserId
  }
  
  // First, try to get img_url from user_profiles table
  try {
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('img_url, avatar_url')
      .eq('id', actualUserId)
      .single()
    
    if (!profileError && profileData) {
      // Prioritize img_url, fall back to avatar_url
      const storedUrl = profileData.img_url || profileData.avatar_url
      if (storedUrl && storedUrl.trim() !== '' && storedUrl !== 'null') {
        console.log('✅ Found stored avatar URL in user_profiles:', storedUrl)
        return storedUrl
      }
    }
  } catch (error) {
    console.log('⚠️ Could not fetch img_url from user_profiles, will generate signed URL:', error)
  }
  
  console.log("🔍 Looking for avatar folder. UUID:", actualUserId, "Folder ID:", folderId)
  
  // Try to list files directly in the folder (try both UUID and JWT token as folder names)
  let files: any[] | null = null
  let filesError: any = null
  let actualFolderId = folderId
  
  // First try with the folderId (could be UUID or JWT)
  const { data: filesData1, error: error1 } = await supabase.storage
    .from('avatars')
    .list(folderId)
  
  if (!error1 && filesData1 && filesData1.length > 0) {
    files = filesData1
    actualFolderId = folderId
    console.log("✅ Found files in folder:", folderId)
  } else {
    // If that fails and we have a UUID, try with UUID
    if (actualUserId !== folderId) {
      const { data: filesData2, error: error2 } = await supabase.storage
        .from('avatars')
        .list(actualUserId)
      
      if (!error2 && filesData2 && filesData2.length > 0) {
        files = filesData2
        actualFolderId = actualUserId
        console.log("✅ Found files in folder:", actualUserId)
      } else {
        filesError = error2 || error1
      }
    } else {
      filesError = error1
    }
  }
  
  if (filesError || !files || files.length === 0) {
    console.log("⚠️ Error listing files or folder is empty:", filesError?.message)
    
    // List all folders to see what's available
    const { data: folders, error: foldersError } = await supabase.storage
      .from('avatars')
      .list('', { limit: 1000 })
    
    if (!foldersError && folders) {
      console.log("📁 Available folders:", folders.map(f => f.name).slice(0, 10))
    }
    
    return '/placeholder-user.jpg'
  }
  
  console.log("📄 Files in folder:", files.map(f => f.name))
  
  // Find avatar file (starts with "avatar.")
  const avatarFile = files.find(file => file.name.startsWith('avatar.'))
  
  if (!avatarFile) {
    console.log("ℹ️ No avatar file found. Available files:", files.map(f => f.name))
    return '/placeholder-user.jpg'
  }
  
  console.log("✅ Found avatar file:", avatarFile.name, "in folder:", actualFolderId)
  
  // Determine the correct folder name to use (should be UUID, not JWT token)
  // The folder name in the URL should be the actual user UUID
  const folderNameForUrl = actualUserId // Use UUID for the folder name in URL
  
  // Get the file path using the actual folder ID where the file is stored
  const filePath = `${actualFolderId}/${avatarFile.name}` // Use the folder that actually contains the file
  console.log("📁 File path for signed URL:", filePath)
  console.log("📁 Folder name for public URL:", folderNameForUrl)
  
  // Get a signed URL to extract the token
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from('avatars')
    .createSignedUrl(filePath, 31536000)
  
  if (signedUrlError || !signedUrlData) {
    console.error('❌ Error generating signed URL:', signedUrlError)
    console.error('❌ File path used:', filePath)
    return '/placeholder-user.jpg'
  }
  
  // Extract token from signed URL
  const signedUrlObj = new URL(signedUrlData.signedUrl)
  const token = signedUrlObj.searchParams.get('token')
  
  if (!token) {
    console.error('❌ No token found in signed URL')
    return '/placeholder-user.jpg'
  }
  
  // Construct signed URL: https://{project}.supabase.co/storage/v1/object/sign/avatars/{folder_name}/avatar.jpg?token={token}
  // Use the UUID (actualUserId) as the folder name, not the JWT token
  const finalSignedUrl = `${supabaseUrl}/storage/v1/object/sign/avatars/${folderNameForUrl}/${avatarFile.name}?token=${token}`
  
  console.log("🆔 Folder name (UUID):", folderNameForUrl)
  console.log("🆔 Actual folder ID (where file is stored):", actualFolderId)
  console.log("🎫 Token:", token)
  console.log("🔗 Signed URL with token:", finalSignedUrl)
  
  // Validate the URL is correct
  if (!finalSignedUrl || !finalSignedUrl.startsWith('http')) {
    console.error('❌ Invalid signed URL format:', finalSignedUrl)
    return '/placeholder-user.jpg'
  }
  
  console.log("✅ Returning signed URL with token:", finalSignedUrl)
  return finalSignedUrl
}

// Synchronous version that assumes jpg first
export function getProfilePictureUrlSync(userId: string): string {
  const supabase = createClient()
  const { data } = supabase.storage.from('avatars').getPublicUrl(`${userId}/avatar.jpg`)
  return data.publicUrl
}

