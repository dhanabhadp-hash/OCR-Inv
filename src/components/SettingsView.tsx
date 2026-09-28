import React, { useState } from 'react';
import { 
  Settings, 
  Link2, 
  FolderGit2, 
  FileSpreadsheet, 
  Bell, 
  Check, 
  AlertCircle, 
  ExternalLink, 
  Code, 
  Send,
  HelpCircle,
  Save,
  CheckCircle2
} from 'lucide-react';
import { GasSettings } from '../types/inventory';

interface SettingsViewProps {
  settings: GasSettings;
  onSave: (settings: GasSettings) => void;
  onOpenGasCode: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSave,
  onOpenGasCode,
}) => {
  const [formData, setFormData] = useState<GasSettings>(settings);
  const [isTestingGas, setIsTestingGas] = useState(false);
  const [gasTestResult, setGasTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [isTestingLine, setIsTestingLine] = useState(false);
  const [lineTestResult, setLineTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleInputChange = (field: keyof GasSettings, val: string) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Test GAS Web App Connection
  const handleTestGas = async () => {
    if (!formData.gasUrl) {
      setGasTestResult({
        success: false,
        message: 'กรุณากรอก Google Apps Script Web App URL ก่อนทดสอบ',
      });
      return;
    }

    setIsTestingGas(true);
    setGasTestResult(null);

    try {
      const res = await fetch('/api/sync-gas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gasUrl: formData.gasUrl,
          payload: {
            isTestPing: true,
            invoiceData: {
              companyName: 'บจก. ทดสอบระบบ Inventory OCR',
              invoiceNo: 'TEST-001',
              invoiceDate: new Date().toLocaleDateString('th-TH'),
              salesperson: 'ผู้ดูแลระบบ',
              grandTotalWithVat: 107.00,
              isDocVatIncluded: true,
              vatAnalysisExplanation: 'ทดสอบการเชื่อมต่อ Apps Script Web App',
            },
            items: [
              {
                productName: 'รายการสินค้าทดสอบการเชื่อมต่อ',
                gpuCode: '888888',
                tpuCode: '99999999',
                quantity: 1,
                unitPriceWithVat: 107.00,
                totalPriceWithVat: 107.00,
              }
            ],
            sheetName: formData.sheetName || 'บิล Inventory',
            driveFolderId: formData.driveFolderId,
            sheetId: formData.sheetId,
            lineNotifyToken: formData.lineNotifyToken,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setGasTestResult({
          success: true,
          message: 'เชื่อมต่อ Google Apps Script สำเร็จแล้ว! ข้อมูลทดสอบถูกบันทึกลงใน Google Sheet แล้ว',
        });
      } else {
        setGasTestResult({
          success: false,
          message: data.error || 'ไม่สามารถเชื่อมต่อได้ กรุณาตรวจสอบสิทธิ์ Deploy เป็น Anyone',
        });
      }
    } catch (err: any) {
      setGasTestResult({
        success: false,
        message: `ข้อผิดพลาด: ${err.message}`,
      });
    } finally {
      setIsTestingGas(false);
    }
  };

  // Test Line Notify Token
  const handleTestLine = async () => {
    if (!formData.lineNotifyToken) {
      setLineTestResult({
        success: false,
        message: 'กรุณากรอก Line Notify Access Token ก่อนทดสอบ',
      });
      return;
    }

    setIsTestingLine(true);
    setLineTestResult(null);

    try {
      const res = await fetch('/api/test-line', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: formData.lineNotifyToken,
          message: '🔔 [ทดสอบระบบ] การเชื่อมต่อ Line Notify จากระบบ Inventory OCR สำเร็จแล้ว!',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLineTestResult({
          success: true,
          message: 'ส่งข้อความทดสอบเข้า Line ของคุณเรียบร้อยแล้ว กรุณาเปิดดูในแอป Line!',
        });
      } else {
        setLineTestResult({
          success: false,
          message: data.error || 'Token ไม่ถูกต้อง หรือยังไม่ได้เชิญ Line Notify เข้ากลุ่ม',
        });
      }
    } catch (err: any) {
      setLineTestResult({
        success: false,
        message: `ข้อผิดพลาด: ${err.message}`,
      });
    } finally {
      setIsTestingLine(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-6 h-6 text-blue-600" />
              <span>ตั้งค่าการเชื่อมต่อ Google Sheets, Drive และ Line Notify</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              กำหนด Web App URL จาก Google Apps Script เพื่อจัดเก็บไฟล์ภาพลง Drive, เก็บข้อความลง Google Sheets และส่งแจ้งเตือนผ่าน Line Notify
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenGasCode}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium text-xs border border-blue-200 transition-colors self-start sm:self-auto"
          >
            <Code className="w-4 h-4" />
            <span>ดูโค้ด &amp; วิธีติดตั้ง Google Apps Script</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Google Apps Script Web App URL */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Link2 className="w-5 h-5 text-blue-600" />
              <span>1. Google Apps Script Web App URL (สำคัญที่สุด)</span>
            </h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              จำเป็น
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Web App URL (URL สำหรับรับข้อมูล POST):
            </label>
            <input
              type="url"
              required
              value={formData.gasUrl}
              onChange={(e) => handleInputChange('gasUrl', e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              className="w-full px-3.5 py-2.5 text-sm font-mono rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              ได้จากการกด Deploy &gt; New deployment &gt; Web app &gt; กำหนดสิทธิ์ Who has access เป็น &quot;Anyone&quot;
            </p>
          </div>

          {/* Test GAS Button */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              disabled={isTestingGas || !formData.gasUrl}
              onClick={handleTestGas}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                isTestingGas || !formData.gasUrl
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300 active:scale-95 shadow-xs'
              }`}
            >
              {isTestingGas ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  <span>กำลังทดสอบการเชื่อมต่อ...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-blue-600" />
                  <span>ทดสอบการเชื่อมต่อ Google Apps Script (ส่งแถวทดสอบ)</span>
                </>
              )}
            </button>
          </div>

          {gasTestResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                gasTestResult.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {gasTestResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{gasTestResult.message}</span>
            </div>
          )}
        </div>

        {/* Section 2: Google Drive & Google Sheets Options */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <FolderGit2 className="w-5 h-5 text-indigo-600" />
              <span>2. การตั้งค่า Google Drive และ Google Sheets (ตัวเลือกเสริม)</span>
            </h3>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              ค่าเริ่มต้นอัตโนมัติ
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <span>Google Drive Folder ID (ไม่บังคับ):</span>
              </label>
              <input
                type="text"
                value={formData.driveFolderId}
                onChange={(e) => handleInputChange('driveFolderId', e.target.value)}
                placeholder="เช่น 1A2b3C4d5E... (หากเว้นว่างจะสร้างโฟลเดอร์ Inventory_OCR_Uploads ให้)"
                className="w-full px-3.5 py-2 text-xs sm:text-sm font-mono rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                รหัสโฟลเดอร์จาก URL ใน Google Drive หลังคำว่า /folders/
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อแท็บใน Google Sheets (Sheet Tab Name):
              </label>
              <input
                type="text"
                value={formData.sheetName}
                onChange={(e) => handleInputChange('sheetName', e.target.value)}
                placeholder="บิล Inventory"
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                ค่าเริ่มต้นคือ &quot;บิล Inventory&quot; (หากไม่มีแท็บนี้ ระบบจะสร้างให้อัตโนมัติ)
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Google Spreadsheet ID (กรณีใช้ Sheet คนละไฟล์กับ Script):
              </label>
              <input
                type="text"
                value={formData.sheetId}
                onChange={(e) => handleInputChange('sheetId', e.target.value)}
                placeholder="เช่น 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms (เว้นว่างได้หากผูก Apps Script ในไฟล์ Sheet โดยตรง)"
                className="w-full px-3.5 py-2 text-xs sm:text-sm font-mono rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Line Notify Token */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-600" />
              <span>3. แจ้งเตือนผ่าน Line Notify อัตโนมัติ</span>
            </h3>
            <a
              href="https://notify-bot.line.me/my/"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>วิธีขอ Line Token</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Line Notify Access Token:
            </label>
            <input
              type="text"
              value={formData.lineNotifyToken}
              onChange={(e) => handleInputChange('lineNotifyToken', e.target.value)}
              placeholder="วาง Token เช่น l7K2k3m4n5..."
              className="w-full px-3.5 py-2.5 text-sm font-mono rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              เมื่อบันทึกข้อมูลสำเร็จ ระบบจะส่งแจ้งเตือน: ชื่อบริษัท, เลขที่บิล, วันที่, พนักงานขาย, จำนวนสินค้า, ยอดสุทธิรวม VAT 7% และลิงก์รูปภาพใน Google Drive
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              disabled={isTestingLine || !formData.lineNotifyToken}
              onClick={handleTestLine}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${
                isTestingLine || !formData.lineNotifyToken
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-white text-emerald-700 hover:bg-emerald-50 border-emerald-300 active:scale-95 shadow-xs'
              }`}
            >
              {isTestingLine ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span>กำลังทดสอบส่งข้อความ...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ทดสอบส่งแจ้งเตือนเข้า Line Notify</span>
                </>
              )}
            </button>
          </div>

          {lineTestResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                lineTestResult.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {lineTestResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{lineTestResult.message}</span>
            </div>
          )}
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {savedSuccess && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <Check className="w-4 h-4" />
              <span>บันทึกการตั้งค่าเรียบร้อยแล้ว</span>
            </span>
          )}

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>บันทึกการตั้งค่าทั้งหมด</span>
          </button>
        </div>
      </form>
    </div>
  );
};
