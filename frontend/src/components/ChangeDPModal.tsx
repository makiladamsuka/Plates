import { useState, useRef } from 'react';
import { X, Upload, RefreshCw, Trash2, Camera, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ChangeDPModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: any;
  currentAvatarUrl?: string | null;
  onAvatarUpdated: (newAvatarUrl: string | null) => void;
}

export function ChangeDPModal({
  isOpen,
  onClose,
  session,
  currentAvatarUrl,
  onAvatarUpdated,
}: ChangeDPModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const user = session?.user;
  const googlePhoto = user?.user_metadata?.picture || user?.user_metadata?.avatar_url;
  const fullName = user?.user_metadata?.full_name || user?.email || 'User';
  const initial = (fullName || 'U').trim()[0].toUpperCase();

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const size = 256;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(img.src);

          // Center-crop to square
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const saveAvatar = async (avatarUrlToSave: string | null) => {
    if (!user?.id) return;
    setIsProcessing(true);
    setSuccessMessage(null);

    try {
      // 1. Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrlToSave })
        .eq('id', user.id);

      if (profileError) {
        console.warn('Profile update notice:', profileError);
      }

      // 2. Update Supabase Auth user metadata
      await supabase.auth.updateUser({
        data: {
          avatar_url: avatarUrlToSave || googlePhoto || null,
          custom_avatar: avatarUrlToSave ? true : false,
        },
      });

      setPreviewUrl(avatarUrlToSave);
      onAvatarUpdated(avatarUrlToSave);
      setSuccessMessage('Profile picture updated successfully!');

      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
      }, 700);
    } catch (err: any) {
      console.error('Error saving avatar:', err);
      alert('Failed to update profile picture. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const compressedDataUrl = await compressImage(file);
      await saveAvatar(compressedDataUrl);
    } catch (err) {
      console.error('Error processing image:', err);
      alert('Could not process this image file. Please try another image.');
      setIsProcessing(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUseGooglePhoto = async () => {
    if (!googlePhoto) return;
    await saveAvatar(googlePhoto);
  };

  const handleRemovePhoto = async () => {
    await saveAvatar(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-['Sora']">
      <div className="bg-white dark:bg-zinc-900 rounded-[35px] max-w-sm w-full p-6 relative shadow-2xl border border-black/5 dark:border-white/5 flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-black/60 dark:text-zinc-400 cursor-pointer transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold font-display text-zinc-900 dark:text-zinc-100 mb-5">
          Change Profile Picture
        </h2>

        {/* Current Avatar Preview */}
        <div className="relative mb-6">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Profile preview"
              className="w-28 h-28 rounded-full object-cover shadow-md border-2 border-black/10 dark:border-white/10"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-4xl font-bold shadow-md">
              {initial}
            </div>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            title="Upload from Device"
            className="absolute bottom-0 right-0 bg-[#1A1A1A] dark:bg-zinc-100 text-white dark:text-zinc-900 p-2.5 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          >
            <Camera size={16} />
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {successMessage && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400 mb-4 bg-green-50 dark:bg-green-950/40 px-3 py-1.5 rounded-full">
            <Check size={14} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="w-full py-3.5 px-4 bg-[#1A1A1A] dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-[24px] font-semibold text-sm flex items-center justify-center gap-2.5 active:scale-[0.98] transition-transform cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Upload size={16} />
            <span>{isProcessing ? 'Updating...' : 'Upload from Device'}</span>
          </button>

          {googlePhoto && (
            <button
              onClick={handleUseGooglePhoto}
              disabled={isProcessing}
              className="w-full py-3 px-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-[24px] font-medium text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} />
              <span>Use Google Profile Photo</span>
            </button>
          )}

          {previewUrl && (
            <button
              onClick={handleRemovePhoto}
              disabled={isProcessing}
              className="w-full py-3 px-4 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-[24px] font-medium text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={14} />
              <span>Remove Photo (Use Initials)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
