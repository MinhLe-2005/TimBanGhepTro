import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, ZoomIn, ZoomOut } from 'lucide-react';
import getCroppedImg from '../utils/cropImage';

interface ImageCropperModalProps {
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedImage: Blob) => void;
  aspectRatio?: number;
  circularCrop?: boolean;
}

export default function ImageCropperModal({
  imageSrc,
  onClose,
  onCropComplete,
  aspectRatio = 1,
  circularCrop = false,
}: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteHandler = useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleSave = async () => {
    try {
      setIsProcessing(true);
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, 0);
      if (croppedImage) {
        onCropComplete(croppedImage);
      }
    } catch (e) {
      console.error(e);
      alert('Đã có lỗi xảy ra khi cắt ảnh.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Căn chỉnh hình ảnh</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cropper Container */}
        <div className="relative w-full h-80 sm:h-96 bg-slate-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            cropShape={circularCrop ? 'round' : 'rect'}
            showGrid={!circularCrop}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteHandler}
            onZoomChange={onZoomChange}
          />
        </div>

        {/* Controls */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex items-center gap-4">
            <ZoomOut className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#006590]"
            />
            <ZoomIn className="w-5 h-5 text-slate-400 shrink-0" />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={isProcessing}
              className="flex-1 py-3 px-4 bg-[#006590] hover:bg-[#004e70] text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check className="w-5 h-5" />
              )}
              {isProcessing ? 'Đang xử lý...' : 'Cắt ảnh'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
