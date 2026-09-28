/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ImageUploader } from './components/ImageUploader';
import { InvoiceEditor } from './components/InvoiceEditor';
import { SettingsView } from './components/SettingsView';
import { GasGuideView } from './components/GasGuideView';
import { HistoryView } from './components/HistoryView';
import { InvoiceData, GasSettings, ScanRecord } from './types/inventory';
import { SampleInvoice } from './utils/sampleInvoices';
import { AlertCircle, CheckCircle2, ExternalLink, X, Sparkles } from 'lucide-react';

const LOCAL_STORAGE_SETTINGS = 'inventory_ocr_gas_settings';
const LOCAL_STORAGE_HISTORY = 'inventory_ocr_history';

export default function App() {
  const [activeTab, setActiveTab] = useState<'scan' | 'history' | 'settings' | 'gas'>('scan');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [ocrError, setOcrError] = useState<string | null>(null);

  const [currentInvoice, setCurrentInvoice] = useState<InvoiceData | null>(null);
  const [currentDriveUrl, setCurrentDriveUrl] = useState<string | undefined>(undefined);
  const [currentSheetUrl, setCurrentSheetUrl] = useState<string | undefined>(undefined);

  const [isSavingGas, setIsSavingGas] = useState<boolean>(false);
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
    driveUrl?: string;
    sheetUrl?: string;
  } | null>(null);

  // Settings State from localStorage
  const [settings, setSettings] = useState<GasSettings>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      gasUrl: '',
      driveFolderId: '',
      sheetId: '',
      sheetName: 'บิล Inventory',
      lineNotifyToken: '',
    };
  });

  // History State from localStorage
  const [historyRecords, setHistoryRecords] = useState<ScanRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_HISTORY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Save settings to localStorage
  const handleSaveSettings = (newSettings: GasSettings) => {
    setSettings(newSettings);
    localStorage.setItem(LOCAL_STORAGE_SETTINGS, JSON.stringify(newSettings));
    showToast('success', 'บันทึกสำเร็จ', 'บันทึกข้อมูลการตั้งค่าเชื่อมต่อเรียบร้อยแล้ว');
  };

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_HISTORY, JSON.stringify(historyRecords));
    } catch {}
  }, [historyRecords]);

  const showToast = (
    type: 'success' | 'error' | 'info',
    title: string,
    message: string,
    driveUrl?: string,
    sheetUrl?: string
  ) => {
    setToast({ type, title, message, driveUrl, sheetUrl });
    if (type !== 'error') {
      setTimeout(() => setToast(null), 6000);
    }
  };

  // Run OCR on Image using Gemini 3.8 Flash backend API
  const handleRunOcr = async (base64Image: string, mimeType: string) => {
    setIsProcessing(true);
    setOcrError(null);

    try {
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Image,
          mimeType: mimeType || 'image/jpeg',
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'การประมวลผล OCR ล้มเหลว');
      }

      const extractedData: InvoiceData = result.data;
      setCurrentInvoice(extractedData);
      setCurrentDriveUrl(undefined);
      setCurrentSheetUrl(undefined);

      // Add to history as draft
      const newRecord: ScanRecord = {
        id: `scan-${Date.now()}`,
        timestamp: new Date().toLocaleString('th-TH'),
        imageUrl: base64Image,
        invoiceData: extractedData,
        syncStatus: 'draft',
      };
      setHistoryRecords((prev) => [newRecord, ...prev]);

      showToast(
        'success',
        'สกัดข้อมูล OCR สำเร็จ!',
        `พบข้อมูลบิล ${extractedData.companyName || ''} พร้อมสินค้า ${extractedData.items.length} รายการ`
      );
    } catch (err: any) {
      console.error('OCR Error:', err);
      setOcrError(err.message || 'เกิดข้อผิดพลาดในการประมวลผล OCR');
      showToast('error', 'OCR ไม่สำเร็จ', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Directly load sample data
  const handleSelectSampleDirectly = (sample: SampleInvoice, sampleImage: string) => {
    setCurrentInvoice(sample.data);
    setCurrentDriveUrl(undefined);
    setCurrentSheetUrl(undefined);
    const newRecord: ScanRecord = {
      id: `sample-${Date.now()}`,
      timestamp: new Date().toLocaleString('th-TH'),
      imageUrl: sampleImage,
      invoiceData: sample.data,
      syncStatus: 'draft',
    };
    setHistoryRecords((prev) => [newRecord, ...prev]);
    showToast('info', 'โหลดตัวอย่างสำเร็จ', `โหลดตัวอย่าง ${sample.name} เรียบร้อยแล้ว`);
  };

  // Save to Google Apps Script -> Google Drive, Google Sheets, Line Notify
  const handleSaveToGas = async (targetInvoice?: InvoiceData, targetRecordId?: string) => {
    const inv = targetInvoice || currentInvoice;
    if (!inv) return;

    if (!settings.gasUrl || settings.gasUrl.trim() === '') {
      showToast(
        'error',
        'ยังไม่ได้ระบุ Web App URL',
        'กรุณาไปที่แท็บ "ตั้งค่าเชื่อมต่อ" และระบุ Google Apps Script Web App URL ก่อนทำการบันทึก'
      );
      setActiveTab('settings');
      return;
    }

    setIsSavingGas(true);

    try {
      const payload = {
        invoiceData: inv,
        items: inv.items,
        imageBase64: imageSrc || '',
        imageName: `INV_${inv.invoiceNo || 'BILL'}_${Date.now()}.jpg`,
        mimeType: 'image/jpeg',
        driveFolderId: settings.driveFolderId,
        sheetId: settings.sheetId,
        sheetName: settings.sheetName || 'บิล Inventory',
        lineNotifyToken: settings.lineNotifyToken,
      };

      const response = await fetch('/api/sync-gas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gasUrl: settings.gasUrl,
          payload,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'ไม่สามารถบันทึกลง Google Sheets ได้');
      }

      const driveUrl = result.data?.driveFileUrl;
      const sheetUrl = result.data?.sheetUrl;
      setCurrentDriveUrl(driveUrl);
      setCurrentSheetUrl(sheetUrl);

      // Update history record
      setHistoryRecords((prev) =>
        prev.map((rec) => {
          if (
            (targetRecordId && rec.id === targetRecordId) ||
            rec.invoiceData.invoiceNo === inv.invoiceNo
          ) {
            return {
              ...rec,
              syncStatus: 'synced',
              driveFileUrl: driveUrl,
              lastSyncedAt: new Date().toLocaleString('th-TH'),
            };
          }
          return rec;
        })
      );

      const lineStatusMsg = result.data?.lineNotification === 'sent' ? ' และส่งการแจ้งเตือนเข้า Line Notify แล้ว' : '';

      showToast(
        'success',
        'บันทึกข้อมูลสำเร็จแล้ว!',
        `บันทึกข้อมูล ${inv.items.length} รายการลง Google Sheets, อัพโหลดไฟล์รูปภาพลง Google Drive${lineStatusMsg}`,
        driveUrl,
        sheetUrl
      );
    } catch (err: any) {
      console.error('GAS Save Error:', err);
      showToast('error', 'บันทึกลง Google Sheets ไม่สำเร็จ', err.message);
    } finally {
      setIsSavingGas(false);
    }
  };

  const handleSaveDraft = () => {
    if (!currentInvoice) return;
    showToast('success', 'บันทึกฉบับร่างแล้ว', 'ข้อมูลบิลถูกบันทึกลงในเครื่องและแถบประวัติเรียบร้อยแล้ว');
  };

  const handleSelectRecordFromHistory = (rec: ScanRecord) => {
    setCurrentInvoice(rec.invoiceData);
    setImageSrc(rec.imageUrl || null);
    setCurrentDriveUrl(rec.driveFileUrl);
    setActiveTab('scan');
  };

  const handleDeleteRecord = (id: string) => {
    setHistoryRecords((prev) => prev.filter((r) => r.id !== id));
    showToast('info', 'ลบรายการแล้ว', 'ลบรายการออกจากประวัติเรียบร้อยแล้ว');
  };

  const handleClearAllHistory = () => {
    if (confirm('คุณต้องการล้างประวัติการสแกนทั้งหมดใช่หรือไม่?')) {
      setHistoryRecords([]);
      showToast('info', 'ล้างประวัติแล้ว', 'ล้างข้อมูลประวัติการสแกนทั้งหมดเรียบร้อยแล้ว');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        historyCount={historyRecords.length}
        hasGasConfigured={!!settings.gasUrl}
        hasLineConfigured={!!settings.lineNotifyToken}
      />

      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-50">
          <div
            className={`p-4 rounded-2xl shadow-xl border flex items-start gap-3 transition-all ${
              toast.type === 'success'
                ? 'bg-slate-900 text-white border-slate-800'
                : toast.type === 'error'
                ? 'bg-rose-900 text-white border-rose-800'
                : 'bg-blue-900 text-white border-blue-800'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            )}

            <div className="flex-1 space-y-1">
              <h4 className="font-bold text-sm">{toast.title}</h4>
              <p className="text-xs text-slate-200 leading-relaxed">{toast.message}</p>

              {(toast.driveUrl || toast.sheetUrl) && (
                <div className="flex items-center gap-3 pt-2 text-xs">
                  {toast.driveUrl && toast.driveUrl.startsWith('http') && (
                    <a
                      href={toast.driveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 underline font-medium flex items-center gap-1"
                    >
                      <span>เปิดดูใน Drive</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {toast.sheetUrl && (
                    <a
                      href={toast.sheetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-300 hover:text-sky-200 underline font-medium flex items-center gap-1"
                    >
                      <span>เปิด Google Sheets</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* TAB 1: Scan & Edit View */}
        {activeTab === 'scan' && (
          <div className="space-y-6">
            {/* Image Uploader & Camera */}
            <ImageUploader
              imageSrc={imageSrc}
              setImageSrc={setImageSrc}
              onRunOcr={handleRunOcr}
              isProcessing={isProcessing}
              onSelectSampleDirectly={handleSelectSampleDirectly}
            />

            {/* Error Message if OCR fails */}
            {ocrError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 flex items-start gap-3 text-sm">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold">เกิดข้อผิดพลาดในการประมวลผล OCR</h4>
                  <p className="text-xs text-rose-700 mt-0.5">{ocrError}</p>
                </div>
              </div>
            )}

            {/* Extracted Invoice Editor */}
            {currentInvoice && (
              <InvoiceEditor
                invoiceData={currentInvoice}
                onChange={setCurrentInvoice}
                onSaveToGas={() => handleSaveToGas()}
                isSavingGas={isSavingGas}
                onSaveDraft={handleSaveDraft}
                gasConfigured={!!settings.gasUrl}
                onOpenSettings={() => setActiveTab('settings')}
                driveFileUrl={currentDriveUrl}
                sheetUrl={currentSheetUrl}
              />
            )}
          </div>
        )}

        {/* TAB 2: History & Queue View */}
        {activeTab === 'history' && (
          <HistoryView
            records={historyRecords}
            onSelectRecord={handleSelectRecordFromHistory}
            onDeleteRecord={handleDeleteRecord}
            onClearAll={handleClearAllHistory}
            onSyncRecordToGas={(rec) => handleSaveToGas(rec.invoiceData, rec.id)}
            isSavingGas={isSavingGas}
          />
        )}

        {/* TAB 3: Google Apps Script Code & Guide */}
        {activeTab === 'gas' && <GasGuideView />}

        {/* TAB 4: Settings View */}
        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onSave={handleSaveSettings}
            onOpenGasCode={() => setActiveTab('gas')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            Inventory OCR &amp; Google Sheets Sync • ขับเคลื่อนด้วย Gemini 3.8 Flash Vision, Google Apps Script &amp; Line Notify
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('gas')}
              className="text-blue-600 hover:underline"
            >
              คู่มือ Google Apps Script
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="text-blue-600 hover:underline"
            >
              ตั้งค่าระบบ
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
