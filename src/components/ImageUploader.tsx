import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload, RotateCw, Trash2, Sparkles, FileText, Image as ImageIcon, Zap, Check, Eye } from 'lucide-react';
import { SAMPLE_INVOICES, generateSampleInvoiceImage, SampleInvoice } from '../utils/sampleInvoices';

interface ImageUploaderProps {
  imageSrc: string | null;
  setImageSrc: (src: string | null) => void;
  onRunOcr: (base64: string, mimeType: string) => void;
  isProcessing: boolean;
  onSelectSampleDirectly?: (sample: SampleInvoice, sampleImage: string) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  imageSrc,
  setImageSrc,
  onRunOcr,
  isProcessing,
  onSelectSampleDirectly,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [detectedMime, setDetectedMime] = useState<string>('image/jpeg');

  // Handle paste image from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, WEBP, HEIC)');
      return;
    }
    setDetectedMime(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImageSrc(result);
      setRotation(0);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const rotateImage = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleSampleClick = (sample: SampleInvoice) => {
    const sampleImg = generateSampleInvoiceImage(sample);
    setImageSrc(sampleImg);
    setDetectedMime('image/jpeg');
    setRotation(0);
    if (onSelectSampleDirectly) {
      onSelectSampleDirectly(sample, sampleImg);
    }
  };

  const handleStartOcr = () => {
    if (!imageSrc) return;
    onRunOcr(imageSrc, detectedMime);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            <span>ถ่ายรูปหรืออัพโหลดบิล Inventory</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            รองรับไฟล์รูปถ่ายจากมือถือ ใบเสร็จ ใบส่งของ ใบกำกับภาษี พร้อมรหัส GPU/TPU
          </p>
        </div>

        {/* Quick sample chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">ตัวอย่างบิลทดสอบ:</span>
          {SAMPLE_INVOICES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => handleSampleClick(sample)}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 transition-colors whitespace-nowrap flex items-center gap-1"
              title={sample.description}
            >
              <FileText className="w-3 h-3 text-blue-600" />
              <span>{sample.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      {/* Camera capture input with environment (back) camera preference */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {/* Upload Zone / Image Display */}
      {!imageSrc ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all ${
            isDragOver ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 hover:border-slate-400 bg-slate-50/60'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Upload className="w-8 h-8" />
          </div>

          <p className="text-base font-semibold text-slate-800">
            ลากและวางรูปภาพบิลที่นี่ หรือกดปุ่มด้านล่างเพื่อถ่ายรูป
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            รองรับ JPG, PNG, WEBP หรือกดปุ่ม &quot;กล้องถ่ายภาพ&quot; บนมือถือ/แท็บเล็ตเพื่อถ่ายรูปบิลได้ทันที
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
            >
              <Camera className="w-4 h-4" />
              <span>ถ่ายรูปด้วยกล้อง</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-700 font-medium text-sm border border-slate-300 hover:bg-slate-50 shadow-xs active:scale-95 transition-all"
            >
              <ImageIcon className="w-4 h-4 text-slate-500" />
              <span>เลือกไฟล์จากเครื่อง</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Action Toolbar on Top of Preview */}
          <div className="flex items-center justify-between bg-slate-100 rounded-xl px-3 py-2 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Eye className="w-4 h-4 text-blue-600" />
              <span className="font-medium">รูปภาพบิลพร้อมประมวลผล</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={rotateImage}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
                title="หมุนภาพ 90 องศา"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">หมุนภาพ</span>
              </button>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
                title="ถ่ายใหม่"
              >
                <Camera className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ถ่ายใหม่</span>
              </button>
              <button
                type="button"
                onClick={() => setImageSrc(null)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
                title="ลบรูปภาพ"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ลบ</span>
              </button>
            </div>
          </div>

          {/* Image Container with rotation */}
          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-900/5 max-h-[460px] flex items-center justify-center p-2">
            <img
              src={imageSrc}
              alt="บิล Inventory ที่จะทำการ OCR"
              style={{ transform: `rotate(${rotation}deg)` }}
              className="max-h-[440px] max-w-full object-contain rounded-lg shadow-sm transition-transform duration-300"
            />
          </div>

          {/* Process Button */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleStartOcr}
              className={`w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all shadow-md ${
                isProcessing
                  ? 'bg-blue-400 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/25 active:scale-98'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังสกัดข้อมูล OCR &amp; วิเคราะห์รหัส GPU/TPU และ VAT 7%...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>เริ่มสกัดข้อมูล OCR ด้วย AI (วิเคราะห์รหัส GPU, TPU, VAT 7%)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
