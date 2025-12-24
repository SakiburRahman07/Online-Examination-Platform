"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";

// Image compression utility
async function compressImage(
  dataUrl: string,
  maxSizeKB: number = 200
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      let quality = 0.9;
      const maxDimension = 1600;

      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      let result = canvas.toDataURL("image/jpeg", quality);
      while (result.length > maxSizeKB * 1024 * 1.37 && quality > 0.1) {
        quality -= 0.1;
        result = canvas.toDataURL("image/jpeg", quality);
      }

      if (result.length > maxSizeKB * 1024 * 1.37) {
        const scale = 0.7;
        canvas.width = width * scale;
        canvas.height = height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        result = canvas.toDataURL("image/jpeg", 0.7);
      }

      resolve(result);
    };
    img.src = dataUrl;
  });
}

interface QuestionImageUploadProps {
  imageUrl: string | null | undefined;
  onImageChange: (url: string | null) => void;
  questionIndex: number;
}

export function QuestionImageUpload({
  imageUrl,
  onImageChange,
  questionIndex,
}: QuestionImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(imageUrl || null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      // Read and compress the image
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        const compressed = await compressImage(dataUrl);
        
        // Convert to blob
        const base64Response = await fetch(compressed);
        const blob = await base64Response.blob();

        // Upload to Supabase
        const supabase = createClient();
        const timestamp = Date.now();
        const fileName = `question_${questionIndex}_${timestamp}.jpg`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("question-images")
          .upload(fileName, blob, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          setUploading(false);
          return;
        }

        if (uploadData) {
          const { data: urlData } = supabase.storage
            .from("question-images")
            .getPublicUrl(fileName);
          
          setPreviewUrl(urlData.publicUrl);
          onImageChange(urlData.publicUrl);
        }

        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload failed:", error);
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Question Image (optional)</label>
      
      {previewUrl ? (
        <div className="relative rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <img
            src={previewUrl}
            alt="Question"
            className="max-h-48 w-full object-contain"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`
            relative flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed
            ${uploading 
              ? "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 cursor-wait" 
              : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Uploading...</p>
            </>
          ) : (
            <>
              <ImageIcon className="h-8 w-8 text-slate-400 mb-2" />
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                Click to upload an image
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                JPG, PNG (auto-compressed to 200KB)
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
