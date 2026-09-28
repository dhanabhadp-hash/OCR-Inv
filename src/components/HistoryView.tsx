import React, { useState } from 'react';
import { 
  History, 
  Search, 
  ExternalLink, 
  FileSpreadsheet, 
  Trash2, 
  Eye, 
  CloudUpload, 
  Calendar, 
  Building2, 
  Hash, 
  Download,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ScanRecord, InvoiceData } from '../types/inventory';

interface HistoryViewProps {
  records: ScanRecord[];
  onSelectRecord: (record: ScanRecord) => void;
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
  onSyncRecordToGas: (record: ScanRecord) => void;
  isSavingGas: boolean;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  records,
  onSelectRecord,
  onDeleteRecord,
  onClearAll,
  onSyncRecordToGas,
  isSavingGas,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = records.filter((r) => {
    const term = searchTerm.toLowerCase();
    const inv = r.invoiceData;
    return (
      inv.companyName.toLowerCase().includes(term) ||
      inv.invoiceNo.toLowerCase().includes(term) ||
      inv.taxId.includes(term) ||
      inv.items.some((i) => 
        i.productName.toLowerCase().includes(term) || 
        i.gpuCode.toLowerCase().includes(term) || 
        i.tpuCode.toLowerCase().includes(term)
      )
    );
  });

  const exportAllCsv = () => {
    const headers = [
      'วันเวลาที่สแกน',
      'สถานะการซิงค์',
      'เลขที่บิล',
      'ชื่อบริษัท',
      'เลขประจำตัวผู้เสียภาษี',
      'วันที่',
      'พนักงานขาย',
      'รหัส GPU',
      'รหัส TPU',
      'ชื่อสินค้า',
      'จำนวน',
      'ราคา/หน่วย(รวม VAT 7%)',
      'ราคารวมรายการ(รวม VAT 7%)',
      'ราคารวมสุทธิทั้งบิล(รวม VAT 7%)',
      'ลิงก์ Google Drive'
    ];

    const rows: any[] = [];
    records.forEach((rec) => {
      rec.invoiceData.items.forEach((item) => {
        rows.push([
          `"${rec.timestamp}"`,
          `"${rec.syncStatus}"`,
          `"${rec.invoiceData.invoiceNo}"`,
          `"${rec.invoiceData.companyName}"`,
          `"${rec.invoiceData.taxId}"`,
          `"${rec.invoiceData.invoiceDate}"`,
          `"${rec.invoiceData.salesperson}"`,
          `"${item.gpuCode}"`,
          `"${item.tpuCode}"`,
          `"${item.productName.replace(/"/g, '""')}"`,
          item.quantity,
          item.unitPriceWithVat.toFixed(2),
          item.totalPriceWithVat.toFixed(2),
          rec.invoiceData.grandTotalWithVat.toFixed(2),
          `"${rec.driveFileUrl || ''}"`
        ]);
      });
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Inventory_OCR_All_History_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <History className="w-6 h-6 text-blue-600" />
              <span>ประวัติการสแกนบิล Inventory ({records.length} รายการ)</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              ดูประวัติบิลที่สแกนแล้ว ตรวจสอบสถานะการซิงค์เข้า Google Sheets และดูภาพต้นฉบับใน Google Drive
            </p>
          </div>

          <div className="flex items-center gap-2">
            {records.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={exportAllCsv}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ส่งออก CSV ทั้งหมด</span>
                </button>
                <button
                  type="button"
                  onClick={onClearAll}
                  className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs transition-colors"
                  title="ล้างประวัติทั้งหมด"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search filter */}
        {records.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-6.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาตามชื่อบริษัท, เลขที่บิล, เลขภาษี, หรือรหัส GPU / TPU..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>
        )}
      </div>

      {/* List */}
      {records.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <History className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-semibold text-slate-700 text-base">ยังไม่มีประวัติการสแกน</p>
          <p className="text-xs text-slate-400 mt-1">
            เมื่อคุณทำการสแกนบิลและประมวลผล OCR รายการจะถูกบันทึกไว้ที่นี่โดยอัตโนมัติ
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
          ไม่พบรายการที่ตรงกับคำค้นหา &quot;{searchTerm}&quot;
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((record) => {
            const inv = record.invoiceData;
            return (
              <div
                key={record.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 p-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Thumbnail & Details */}
                <div className="flex items-start gap-4">
                  {record.imageUrl && (
                    <div className="w-16 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                      <img
                        src={record.imageUrl}
                        alt="ภาพบิล"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm sm:text-base">
                        {inv.invoiceNo || 'ไม่มีเลขที่บิล'}
                      </span>
                      {record.syncStatus === 'synced' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>บันทึก Sheets &amp; Drive แล้ว</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircle className="w-3 h-3" />
                          <span>ฉบับร่าง (ยังไม่ซิงค์)</span>
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-700 font-medium flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{inv.companyName || 'ไม่ระบุชื่อบริษัท'}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{inv.invoiceDate || 'ไม่ระบุวันที่'}</span>
                      </span>
                      <span>•</span>
                      <span>สินค้า {inv.items.length} รายการ</span>
                      <span>•</span>
                      <span className="text-slate-400">สแกนเมื่อ {record.timestamp}</span>
                    </div>

                    {/* GPU/TPU tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {inv.items.slice(0, 3).map((item, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono"
                        >
                          GPU: {item.gpuCode || '-'} | TPU: {item.tpuCode || '-'}
                        </span>
                      ))}
                      {inv.items.length > 3 && (
                        <span className="text-[10px] text-slate-400">+{inv.items.length - 3} รายการ</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Price & Actions */}
                <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 gap-3">
                  <div className="text-left md:text-right">
                    <span className="text-[11px] text-slate-400 block">ยอดสุทธิ (รวม VAT 7%)</span>
                    <span className="font-mono font-bold text-base sm:text-lg text-blue-700">
                      {inv.grandTotalWithVat?.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {record.driveFileUrl && record.driveFileUrl.startsWith('http') && (
                      <a
                        href={record.driveFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs transition-colors"
                        title="เปิดดูรูปภาพใน Google Drive"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}

                    {record.syncStatus !== 'synced' && (
                      <button
                        type="button"
                        disabled={isSavingGas}
                        onClick={() => onSyncRecordToGas(record)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs transition-all flex items-center gap-1"
                        title="ซิงค์เข้า Google Sheets & Drive"
                      >
                        <CloudUpload className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">ซิงค์ชีท</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onSelectRecord(record)}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-medium text-xs transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>เปิดแก้ไข</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteRecord(record.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="ลบรายการนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
