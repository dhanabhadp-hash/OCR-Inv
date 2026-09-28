import React, { useState } from 'react';
import { 
  Code, 
  Copy, 
  Check, 
  ExternalLink, 
  FileSpreadsheet, 
  FolderGit2, 
  Bell, 
  Sparkles, 
  HelpCircle,
  CheckCircle2,
  Table
} from 'lucide-react';
import { GOOGLE_APPS_SCRIPT_CODE } from '../gas/codeSample';

export const GasGuideView: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const columns = [
    { col: 'A', name: 'Timestamp', desc: 'วัน-เวลาที่ทำการบันทึกข้อมูล (เช่น 2025-09-28 14:30:15)' },
    { col: 'B', name: 'เลขที่บิล (Invoice No)', desc: 'เลขที่บิลที่สกัดได้จากเอกสาร (เช่น INV-2025/0892)' },
    { col: 'C', name: 'ชื่อบริษัท / ผู้จำหน่าย', desc: 'ชื่อร้านค้า บริษัท หรือผู้จำหน่ายตามเอกสาร' },
    { col: 'D', name: 'เลขประจำตัวผู้เสียภาษี', desc: 'เลขประจำตัวผู้เสียภาษี 13 หลัก (ใส่ \' นำหน้าป้องกันเลข 0 หาย)' },
    { col: 'E', name: 'วันที่ในเอกสาร', desc: 'วันที่ในบิล Inventory' },
    { col: 'F', name: 'พนักงานขาย', desc: 'พนักงานขาย หรือผู้เปิดบิล' },
    { col: 'G', name: 'รหัส GPU (5-8 หลัก)', desc: 'รหัสกลุ่มสินค้า หรือรหัส GPU เฉพาะของสินค้านั้น' },
    { col: 'H', name: 'รหัส TPU (5-8 หลัก)', desc: 'รหัสมาตรฐานสินค้า / TPU Code บ่งบอกรายละเอียดสินค้า' },
    { col: 'I', name: 'ชื่อสินค้า / รายการ', desc: 'ชื่อรายการสินค้าแต่ละรายการ' },
    { col: 'J', name: 'จำนวน (Qty)', desc: 'จำนวนชิ้นหรือปริมาณที่สั่ง' },
    { col: 'K', name: 'ราคา/หน่วย (รวม VAT 7%)', desc: 'ราคาต่อหน่วยที่การันตีว่ารวม VAT 7% เสมอ' },
    { col: 'L', name: 'ราคารวมรายการ (รวม VAT 7%)', desc: 'ราคารวมของรายการสินค้านั้นที่รวม VAT 7% เสมอ' },
    { col: 'M', name: 'ราคารวมสุทธิทั้งบิล (รวม VAT)', desc: 'ยอดรวมสุทธิทั้งบิลที่รวม VAT 7% เสมอ' },
    { col: 'N', name: 'สถานะ VAT', desc: 'ระบุว่า "บิลรวม VAT 7% อยู่แล้ว" หรือ "ปรับคำนวณรวม VAT 7% ให้แล้ว"' },
    { col: 'O', name: 'คำอธิบาย VAT', desc: 'รายละเอียดผลการเปรียบเทียบราคา' },
    { col: 'P', name: 'ลิงก์รูปภาพใน Google Drive', desc: 'URL ไฟล์ภาพบิลที่อัพโหลดเก็บไว้ใน Google Drive' },
    { col: 'Q', name: 'วันที่ทำรายการ', desc: 'วันที่ปัจจุบันที่บันทึกข้อมูล' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Intro Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold mb-2 border border-blue-400/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full-Stack Integration ด้วย Google Apps Script</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              สคริปต์ Google Apps Script (Code.gs) &amp; คู่มือการเชื่อมต่อ
            </h2>
            <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-2xl">
              บันทึกไฟล์ภาพขึ้น Google Drive อัตโนมัติ, บันทึกข้อความ OCR ลง Google Sheets ในรูปแบบตาราง 17 คอลัมน์, และส่งข้อความแจ้งเตือนผ่าน Line Notify ทันทีที่ทำรายการเสร็จ
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-blue-900 font-bold text-sm hover:bg-blue-50 shadow-md transition-all self-start sm:self-auto shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>คัดลอกโค้ดแล้ว!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>คัดลอก Code.gs (คลิกเดียว)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Step by Step Setup Guide */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          <span>ขั้นตอนการติดตั้ง 4 ขั้นตอน (ทำครั้งเดียวเสร็จใน 2 นาที)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Step 1 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h4 className="font-bold text-slate-800 text-sm">เปิด Google Sheets &amp; Apps Script</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              เปิด Google Sheet ที่ต้องการเก็บข้อมูลบิล จากนั้นไปที่เมนูบนสุด: <strong>ส่วนขยาย (Extensions)</strong> &gt; <strong>Apps Script</strong>
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h4 className="font-bold text-slate-800 text-sm">วางโค้ดใน Code.gs</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              ลบโค้ดเริ่มต้นทั้งหมดในไฟล์ <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">Code.gs</code> แล้ววางโค้ดด้านล่างนี้ลงไป จากนั้นกดปุ่ม <strong>บันทึก (Ctrl+S)</strong>
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                3
              </span>
              <h4 className="font-bold text-slate-800 text-sm">Deploy เป็น Web App (เลือก Anyone)</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              กดปุ่มสีน้ำเงิน <strong>ทำให้ใช้งานได้ (Deploy)</strong> &gt; <strong>การทำให้ใช้งานได้ใหม่ (New deployment)</strong> &gt; เลือกประเภท <strong>เว็บแอป (Web app)</strong><br />
              <strong className="text-rose-600">*สำคัญมาก:</strong> ช่อง <em>ใครมีสิทธิ์เข้าถึง (Who has access)</em> ให้เลือกเป็น <strong>ทุกคน (Anyone)</strong>
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                4
              </span>
              <h4 className="font-bold text-slate-800 text-sm">คัดลอก Web App URL มาใส่ในระบบ</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              กด Authorize access ยืนยันสิทธิ์ แล้วคัดลอก <strong>URL เว็บแอป (Web App URL)</strong> ที่ลงท้ายด้วย <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">/exec</code> มาวางในแท็บ <strong>&quot;ตั้งค่าเชื่อมต่อ&quot;</strong> ของระบบนี้
            </p>
          </div>
        </div>
      </div>

      {/* Database Schema / Columns Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Table className="w-5 h-5 text-indigo-600" />
            <span>โครงสร้างตารางข้อมูลใน Google Sheets (17 คอลัมน์ สร้างอัตโนมัติ)</span>
          </h3>
          <span className="text-xs text-slate-400">สร้างหัวตารางและจัดสีให้อัตโนมัติ</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-2 px-3 w-12 text-center">คอลัมน์</th>
                <th className="py-2 px-3 w-48 font-bold text-slate-900">ชื่อฟิลด์ใน Google Sheets</th>
                <th className="py-2 px-3 text-slate-600">คำอธิบายข้อมูลที่บันทึก</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {columns.map((c) => (
                <tr key={c.col} className="hover:bg-slate-50">
                  <td className="py-2 px-3 text-center font-mono font-bold text-blue-600 bg-slate-50/50">{c.col}</td>
                  <td className="py-2 px-3 font-semibold text-slate-800">{c.name}</td>
                  <td className="py-2 px-3 text-slate-600">{c.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Code Viewer Box */}
      <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-lg border border-slate-800">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-mono">
            <Code className="w-4 h-4 text-blue-400" />
            <span>Code.gs (Google Apps Script)</span>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'คัดลอกเรียบร้อย' : 'คัดลอกโค้ดทั้งหมด'}</span>
          </button>
        </div>

        <div className="p-4 overflow-x-auto max-h-[500px] text-xs font-mono text-slate-200 leading-relaxed">
          <pre>{GOOGLE_APPS_SCRIPT_CODE}</pre>
        </div>
      </div>
    </div>
  );
};
