"use client";

import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { Camera, RotateCcw, Check, X, Upload, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

      // Start with original dimensions
      let quality = 0.9;
      const maxDimension = 1600;

      // Scale down if too large
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

      // Reduce quality until file size is under maxSizeKB
      let result = canvas.toDataURL("image/jpeg", quality);
      while (result.length > maxSizeKB * 1024 * 1.37 && quality > 0.1) {
        quality -= 0.1;
        result = canvas.toDataURL("image/jpeg", quality);
      }

      // If still too large, reduce dimensions
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

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export function CameraCapture({ onCapture, onCancel, isOpen }: CameraCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [processing, setProcessing] = useState(false);

  const capture = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setProcessing(true);
      const compressed = await compressImage(imageSrc);
      setCapturedImage(compressed);
      setProcessing(false);
    }
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProcessing(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        const compressed = await compressImage(dataUrl);
        setCapturedImage(compressed);
        setProcessing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const retake = () => {
    setCapturedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const confirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      setCapturedImage(null);
    }
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const handleCancel = () => {
    setCapturedImage(null);
    onCancel();
  };

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode,
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Capture Written Answer
          </DialogTitle>
          <DialogDescription>
            Take a photo or upload an image of your written answer. Images are automatically compressed.
          </DialogDescription>
        </DialogHeader>

        {capturedImage ? (
          <>
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900">
              <img
                src={capturedImage}
                alt="Captured answer"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" onClick={retake} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Retake
              </Button>
              <Button onClick={confirm} className="gap-2">
                <Check className="h-4 w-4" />
                Use This Photo
              </Button>
            </div>
          </>
        ) : (
          <Tabs defaultValue="camera" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="camera" className="gap-2">
                <Camera className="h-4 w-4" />
                Camera
              </TabsTrigger>
              <TabsTrigger value="upload" className="gap-2">
                <Upload className="h-4 w-4" />
                Upload File
              </TabsTrigger>
            </TabsList>

            <TabsContent value="camera" className="space-y-4">
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-900">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex items-center justify-center gap-4">
                <Button variant="outline" onClick={handleCancel} className="gap-2">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button variant="secondary" onClick={toggleCamera} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Switch Camera
                </Button>
                <Button onClick={capture} disabled={processing} className="gap-2">
                  <Camera className="h-4 w-4" />
                  {processing ? "Processing..." : "Capture"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <div
                className="relative aspect-video w-full overflow-hidden rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <ImageIcon className="h-12 w-12 text-slate-400 mb-4" />
                <p className="text-slate-600 dark:text-slate-400 font-medium">
                  Click to upload an image
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                  JPG, PNG or WebP (max 200KB after compression)
                </p>
              </div>
              <div className="flex items-center justify-center">
                <Button variant="outline" onClick={handleCancel} className="gap-2">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {processing && (
          <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Compressing image...</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Simple button to trigger camera/upload
interface CaptureButtonProps {
  onCapture: (imageData: string) => void;
  capturedImage?: string | null;
}

export function CaptureButton({ onCapture, capturedImage }: CaptureButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        const compressed = await compressImage(dataUrl);
        onCapture(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(true)}
            className="flex-1 gap-2"
          >
            <Camera className="h-4 w-4" />
            {capturedImage ? "Retake" : "Camera"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleQuickUpload}
            className="hidden"
          />
        </div>

        {capturedImage && (
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-slate-50 dark:bg-slate-900">
            <img
              src={capturedImage}
              alt="Your answer"
              className="h-full w-full object-contain"
            />
            <div className="absolute bottom-2 right-2 flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setIsOpen(true)}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Retake
              </Button>
            </div>
          </div>
        )}
      </div>

      <CameraCapture
        isOpen={isOpen}
        onCapture={(data) => {
          onCapture(data);
          setIsOpen(false);
        }}
        onCancel={() => setIsOpen(false)}
      />
    </>
  );
}
