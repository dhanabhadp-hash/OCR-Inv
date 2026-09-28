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
  CheckCircle2,
  Bot,
  MessageSquare,
  Sparkles,
  Info,
  Users
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
              vatAnalysisExplanation: 'ทดสอบการเชื่อมต่อ Apps Script Web App และ LINE Messaging API',
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
            lineChannelAccessToken: formData.lineChannelAccessToken,
            lineTargetId: formData.lineTargetId,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setGasTestResult({
          success: true,
          message: 'เชื่อมต่อ Google Apps Script สำเร็จแล้ว! ข้อมูลทดสอบถูกบันทึกลงใน Google Sheet แล้ว' + 
            (data.data?.lineNotification === 'sent' ? ' และส่งการแจ้งเตือนเข้า LINE แล้ว' : ''),
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

  // Test LINE Messaging API
  const handleTestLine = async () => {
    if (!formData.lineChannelAccessToken) {
      setLineTestResult({
        success: false,
        message: 'กรุณากรอก LINE Channel Access Token ก่อนทดสอบ',
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
          channelAccessToken: formData.lineChannelAccessToken,
          targetId: formData.lineTargetId,
          message: '🔔 [ทดสอบระบบ] การเชื่อมต่อ LINE Chatbot (Messaging API) จากระบบ Inventory OCR ทำงานได้ปกติ!\nเวลา: ' + new Date().toLocaleString('th-TH'),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLineTestResult({
          success: true,
          message: data.message || 'ส่งข้อความทดสอบเข้า LINE เรียบร้อยแล้ว กรุณาเปิดดูในแอป LINE!',
        });
      } else {
        setLineTestResult({
          success: false,
          message: data.error || 'การส่งข้อความไม่สำเร็จ กรุณาตรวจสอบ Token และสิทธิ์ของบอท',
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
              <span>ตั้งค่าการเชื่อมต่อ Google Sheets, Drive และ LINE OA Chatbot</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              กำหนด Web App URL จาก Google Apps Script และ LINE Messaging API เพื่อจัดเก็บไฟล์ภาพลง Drive, บันทึกข้อความลง Google Sheets และส่งการ์ดสรุปบิลผ่าน LINE
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenGasCode}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium text-xs border border-blue-200 transition-colors self-start sm:self-auto"
          >
            <Code className="w-4 h-4" />
            <span>ดูโค้ด &amp; วิธีติดตั้ง Apps Script</span>
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

        {/* Section 3: LINE Messaging API (LINE Official Account / Chatbot) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  3. ระบบแจ้งเตือนผ่าน LINE Chatbot (LINE Messaging API / LINE OA)
                </h3>
                <span className="text-[11px] text-emerald-700 font-medium">
                  ทดแทน LINE Notify ที่ยุติการให้บริการอย่างสมบูรณ์ ด้วย Flex Message การ์ดสวยงาม
                </span>
              </div>
            </div>

            <a
              href="https://developers.line.biz/console/"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1 transition-colors self-start sm:self-auto shrink-0"
            >
              <span>LINE Developers Console</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Quick Notice Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5 leading-relaxed">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-600" />
              <span>วิธีรับ Channel Access Token ใน 3 นาที:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1">
              <li>ล็อกอินที่ <a href="https://developers.line.biz/console/" target="_blank" rel="noreferrer" className="text-blue-600 underline">LINE Developers Console</a> แล้วเลือก/สร้าง Channel ชนิด <strong>Messaging API</strong> (LINE OA)</li>
              <li>ไปที่แท็บ <strong>&quot;Messaging API&quot;</strong> เลื่อนลงด้านล่างสุดที่หัวข้อ <strong>&quot;Channel access token (long-lived)&quot;</strong> แล้วกดปุ่ม <strong>Issue</strong></li>
              <li>คัดลอก Token มาวางในช่องด้านล่างนี้</li>
              <li><strong>Target User ID (ตัวเลือกเสริม):</strong> คัดลอก &quot;Your user ID&quot; จากแท็บ <em>Basic settings</em> หรือเว้นว่างไว้เพื่อส่งแบบ <strong>Broadcast</strong> ถึงทุกคนที่ติดตามบอท</li>
            </ol>
          </div>

          {/* Input: Channel Access Token */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <span>Channel Access Token (long-lived):</span>
              <span className="text-rose-500 font-bold">*</span>
            </label>
            <textarea
              rows={2}
              value={formData.lineChannelAccessToken}
              onChange={(e) => handleInputChange('lineChannelAccessToken', e.target.value)}
              placeholder="วาง Channel Access Token ยาวๆ เช่น eyJhbGciOi... หรือ v1+..."
              className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all resize-y"
            />
          </div>

          {/* Input: Target User ID / Group ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Target User ID / Group ID (ไม่บังคับ):</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">หากเว้นว่าง ระบบจะส่งแบบ Broadcast</span>
            </label>
            <input
              type="text"
              value={formData.lineTargetId}
              onChange={(e) => handleInputChange('lineTargetId', e.target.value)}
              placeholder="เช่น U1234567890abcdef... (User ID ขึ้นต้นด้วย U, Group ID ขึ้นต้นด้วย C หรือเว้นว่าง)"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
            />
          </div>

          {/* Test Line Button */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              disabled={isTestingLine || !formData.lineChannelAccessToken}
              onClick={handleTestLine}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                isTestingLine || !formData.lineChannelAccessToken
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 active:scale-95 shadow-xs'
              }`}
            >
              {isTestingLine ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>กำลังส่งข้อความทดสอบไปยัง LINE...</span>
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4" />
                  <span>ทดสอบส่งข้อความแจ้งเตือนผ่าน LINE Chatbot</span>
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
