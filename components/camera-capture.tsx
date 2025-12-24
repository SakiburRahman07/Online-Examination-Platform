"use client";

import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { Camera, RotateCcw, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export function CameraCapture({ onCapture, onCancel, isOpen }: CameraCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
    }
  }, []);

  const retake = () => {
    setCapturedImage(null);
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
            Take a photo of your written answer. Make sure the text is clearly visible.
          </DialogDescription>
        </DialogHeader>

        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-900">
          {capturedImage ? (
            <img
              src={capturedImage}
              alt="Captured answer"
              className="h-full w-full object-contain"
            />
          ) : (
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <div className="flex items-center justify-center gap-4">
          {capturedImage ? (
            <>
              <Button variant="outline" onClick={retake} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Retake
              </Button>
              <Button onClick={confirm} className="gap-2">
                <Check className="h-4 w-4" />
                Use This Photo
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel} className="gap-2">
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button variant="secondary" onClick={toggleCamera} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Switch Camera
              </Button>
              <Button onClick={capture} className="gap-2">
                <Camera className="h-4 w-4" />
                Capture
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Simple button to trigger camera
interface CaptureButtonProps {
  onCapture: (imageData: string) => void;
  capturedImage?: string | null;
}

export function CaptureButton({ onCapture, capturedImage }: CaptureButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsOpen(true)}
          className="w-full gap-2"
        >
          <Camera className="h-4 w-4" />
          {capturedImage ? "Retake Photo" : "Take Photo of Answer"}
        </Button>

        {capturedImage && (
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border-2 border-indigo-200">
            <img
              src={capturedImage}
              alt="Your answer"
              className="h-full w-full object-contain"
            />
            <div className="absolute bottom-2 right-2">
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
