import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Resizes and compresses an uploaded image file client-side.
 */
export async function compressImage(file: File, maxDimension = 400, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return resolve(file);
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image for compression'));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a profile photo to Supabase Storage bucket 'avatars'.
 * Returns the public URL or data URI.
 */
export async function uploadProfilePhoto(file: File, pathFolder = 'students'): Promise<string> {
  try {
    const compressedBlob = await compressImage(file);
    const fileName = `${pathFolder}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;

    if (!isSupabaseConfigured) {
      // In demo mode without live Supabase, return a Data URL so image previews instantly work!
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(compressedBlob);
      });
    }

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, compressedBlob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw error;
    }

    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('Error uploading photo:', err);
    throw err;
  }
}
