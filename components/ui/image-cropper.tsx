"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Area, Point } from "react-easy-crop";

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onClose: () => void;
  aspect?: number;
}

function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("No 2d context"));
        return;
      }

      // pixelCrop is already in natural image coordinates from react-easy-crop
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Canvas is empty"));
          }
        },
        "image/jpeg",
        0.95
      );
    };
    image.onerror = reject;
  });
}

export function ImageCropper({
  imageSrc,
  onCropComplete,
  onClose,
  aspect = 1,
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = useCallback((crop: Point) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteCallback = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedImageBlob = await getCroppedImg(
        imageSrc,
        croppedAreaPixels
      );
      onCropComplete(croppedImageBlob);
      onClose();
    } catch (error) {
      console.error("Error cropping image:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-50 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-slate-50">
            Crop Photo
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative w-full h-[400px] bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropCompleteCallback}
              cropShape="round"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-700 dark:text-slate-300">
              Zoom: {Math.round(zoom * 100)}%
            </label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isProcessing || !croppedAreaPixels}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? "Processing..." : "Save Cropped Image"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

