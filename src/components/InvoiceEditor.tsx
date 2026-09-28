import React, { useState } from 'react';
import { 
  Building2, 
  Receipt, 
  Calendar, 
  User, 
  Hash, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  CloudUpload, 
  Download, 
  Copy, 
  Layers, 
  Cpu, 
  Check, 
  HelpCircle,
  Calculator,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { InvoiceData, InvoiceItem } from '../types/inventory';

interface InvoiceEditorProps {
  invoiceData: InvoiceData;
  onChange: (updated: InvoiceData) => void;
  onSaveToGas: () => void;
  isSavingGas: boolean;
  onSaveDraft: () => void;
  gasConfigured: boolean;
  onOpenSettings: () => void;
  driveFileUrl?: string;
  sheetUrl?: string;
}

export const InvoiceEditor: React.FC<InvoiceEditorProps> = ({
  invoiceData,
  onChange,
  onSaveToGas,
  isSavingGas,
  onSaveDraft,
  gasConfigured,
  onOpenSettings,
  driveFileUrl,
  sheetUrl,
}) => {
  const [copiedJson, setCopiedJson] = useState(false);

  // Recalculate totals and ensure VAT 7% is consistently applied
  const updateField = <K extends keyof InvoiceData>(key: K, value: InvoiceData[K]) => {
    onChange({
      ...invoiceData,
      [key]: value,
    });
  };

  const handleToggleVat = (forceAddVat: boolean) => {
    const updatedItems = invoiceData.items.map((item) => {
      const uPrice = item.unitPrice || 0;
      const qty = item.quantity || 1;
      const uPriceWithVat = forceAddVat ? Math.round(uPrice * 1.07 * 100) / 100 : uPrice;
      const tPriceWithVat = Math.round(qty * uPriceWithVat * 100) / 100;
      return {
        ...item,
        unitPriceWithVat: uPriceWithVat,
        totalPriceWithVat: tPriceWithVat,
      };
    });

    const sumWithVat = updatedItems.reduce((acc, itm) => acc + itm.totalPriceWithVat, 0);

    onChange({
      ...invoiceData,
      isDocVatIncluded: !forceAddVat,
      items: updatedItems,
      grandTotalWithVat: Math.round(sumWithVat * 100) / 100,
      vatAnalysisExplanation: forceAddVat
        ? 'ปรับราคา/หน่วยและราคารวมทุกรายการให้รวม VAT 7% (+7%) ตามเงื่อนไขของระบบ'
        : 'ราคาในบิลรวม VAT 7% อยู่แล้วตามเอกสาร',
    });
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...invoiceData.items];
    const targetItem = { ...updated[index], [field]: value };

    // Auto calculate line price
    if (field === 'quantity' || field === 'unitPrice') {
      const qty = field === 'quantity' ? Number(value) || 0 : targetItem.quantity || 0;
      const uPrice = field === 'unitPrice' ? Number(value) || 0 : targetItem.unitPrice || 0;
      targetItem.totalPrice = Math.round(qty * uPrice * 100) / 100;

      // Calculate with VAT 7%
      const needsVat = !invoiceData.isDocVatIncluded;
      targetItem.unitPriceWithVat = needsVat ? Math.round(uPrice * 1.07 * 100) / 100 : uPrice;
      targetItem.totalPriceWithVat = Math.round(qty * targetItem.unitPriceWithVat * 100) / 100;
    }

    if (field === 'unitPriceWithVat') {
      const uWithVat = Number(value) || 0;
      targetItem.unitPriceWithVat = uWithVat;
      targetItem.totalPriceWithVat = Math.round((targetItem.quantity || 1) * uWithVat * 100) / 100;
    }

    updated[index] = targetItem;

    // Recalculate grand totals
    const newTotal = updated.reduce((acc, cur) => acc + (cur.totalPrice || 0), 0);
    const newTotalWithVat = updated.reduce((acc, cur) => acc + (cur.totalPriceWithVat || 0), 0);

    onChange({
      ...invoiceData,
      items: updated,
      subtotal: Math.round(newTotal * 100) / 100,
      grandTotal: Math.round(newTotal * 100) / 100,
      grandTotalWithVat: Math.round(newTotalWithVat * 100) / 100,
      vatAmount: Math.round(Math.abs(newTotalWithVat - newTotal) * 100) / 100,
    });
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      productName: '',
      gpuCode: '-',
      tpuCode: '-',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      unitPriceWithVat: 0,
      totalPriceWithVat: 0,
    };
    onChange({
      ...invoiceData,
      items: [...invoiceData.items, newItem],
    });
  };

  const handleRemoveItem = (index: number) => {
    const updated = invoiceData.items.filter((_, idx) => idx !== index);
    const newTotal = updated.reduce((acc, cur) => acc + (cur.totalPrice || 0), 0);
    const newTotalWithVat = updated.reduce((acc, cur) => acc + (cur.totalPriceWithVat || 0), 0);

    onChange({
      ...invoiceData,
      items: updated,
      subtotal: Math.round(newTotal * 100) / 100,
      grandTotal: Math.round(newTotal * 100) / 100,
      grandTotalWithVat: Math.round(newTotalWithVat * 100) / 100,
      vatAmount: Math.round(Math.abs(newTotalWithVat - newTotal) * 100) / 100,
    });
  };

  const exportCsv = () => {
    const headers = [
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
      'สถานะ VAT',
    ];

    const vatStatus = invoiceData.isDocVatIncluded ? 'บิลรวม VAT 7% อยู่แล้ว' : 'ปรับคำนวณรวม VAT 7% ให้แล้ว';

    const rows = invoiceData.items.map((item) => [
      `"${invoiceData.invoiceNo}"`,
      `"${invoiceData.companyName}"`,
      `"${invoiceData.taxId}"`,
      `"${invoiceData.invoiceDate}"`,
      `"${invoiceData.salesperson}"`,
      `"${item.gpuCode}"`,
      `"${item.tpuCode}"`,
      `"${item.productName.replace(/"/g, '""')}"`,
      item.quantity,
      item.unitPriceWithVat.toFixed(2),
      item.totalPriceWithVat.toFixed(2),
      invoiceData.grandTotalWithVat.toFixed(2),
      `"${vatStatus}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Inventory_OCR_${invoiceData.invoiceNo || 'BILL'}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(invoiceData, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* VAT 7% Smart Verification & Comparison Banner */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-xs ${
          invoiceData.isDocVatIncluded
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
            : 'bg-amber-50/90 border-amber-300 text-amber-950'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                invoiceData.isDocVatIncluded ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
              }`}
            >
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm sm:text-base">
                  {invoiceData.isDocVatIncluded
                    ? '✓ เอกสารระบุราคารวม VAT 7% อยู่แล้ว'
                    : '⚡ ระบบคำนวณและปรับเป็นราคาที่รวม VAT 7% ให้เสมอ (+7%)'}
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    invoiceData.isDocVatIncluded
                      ? 'bg-emerald-200/80 text-emerald-900'
                      : 'bg-amber-200 text-amber-900 border border-amber-300'
                  }`}
                >
                  เงื่อนไข: ราคาส่ง Google Sheets ต้องรวม VAT 7% เสมอ
                </span>
              </div>
              <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                {invoiceData.vatAnalysisExplanation ||
                  'ระบบได้เปรียบเทียบราคา/หน่วย ราคารวม และราคารวมสุทธิ เพื่อให้แน่ใจว่าราคาทุกรายการที่ส่งไปยัง Google Sheets เป็นราคาที่รวม VAT 7% แล้ว'}
              </p>
            </div>
          </div>

          {/* Quick toggle switch */}
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0 bg-white/80 p-1.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => handleToggleVat(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                invoiceData.isDocVatIncluded
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              ตามบิล (รวม VAT แล้ว)
            </button>
            <button
              type="button"
              onClick={() => handleToggleVat(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                !invoiceData.isDocVatIncluded
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              คำนวณบวก VAT 7% เพิ่ม
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Invoice Header Details Form */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            <span>ข้อมูลหัวบิล Inventory (ตรวจสอบและแก้ไขได้)</span>
          </h3>
          <span className="text-xs text-slate-400">สกัดด้วย Gemini AI Vision</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Company Name */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>1. ชื่อบริษัท / ผู้จำหน่าย</span>
            </label>
            <input
              type="text"
              value={invoiceData.companyName || ''}
              onChange={(e) => updateField('companyName', e.target.value)}
              placeholder="เช่น บริษัท สยาม อินเวนทอรี่ จำกัด"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>

          {/* Tax ID */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-blue-600" />
              <span>2. เลขประจำตัวผู้เสียภาษี (13 หลัก)</span>
            </label>
            <input
              type="text"
              value={invoiceData.taxId || ''}
              onChange={(e) => updateField('taxId', e.target.value)}
              placeholder="เช่น 0105558123456"
              className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>

          {/* Invoice No */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-blue-600" />
              <span>3. เลขที่บิล (Invoice No.)</span>
            </label>
            <input
              type="text"
              value={invoiceData.invoiceNo || ''}
              onChange={(e) => updateField('invoiceNo', e.target.value)}
              placeholder="เช่น INV-2025/0892"
              className="w-full px-3 py-2 text-sm font-mono font-medium text-blue-700 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>

          {/* Invoice Date */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>4. วันที่ในเอกสาร</span>
            </label>
            <input
              type="text"
              value={invoiceData.invoiceDate || ''}
              onChange={(e) => updateField('invoiceDate', e.target.value)}
              placeholder="เช่น 15/09/2025 หรือ 2025-09-15"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>

          {/* Salesperson */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>5. พนักงานขาย / ผู้เปิดบิล</span>
            </label>
            <input
              type="text"
              value={invoiceData.salesperson || ''}
              onChange={(e) => updateField('salesperson', e.target.value)}
              placeholder="เช่น นายสมชาย บริการดี"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Line Items Table with GPU & TPU Codes & VAT Recalculation */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <span>รายการสินค้าในบิล (6.ชื่อสินค้า, 7.จำนวน, 8.ราคา/หน่วย, 9.ราคารวม)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              พร้อมสกัด **11. รหัส GPU** และ **12. รหัส TPU** (ตัวเลข 5-8 หลัก) ทุกรายการต้องคำนวณเป็นราคารวม VAT 7%
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddItem}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium text-xs border border-indigo-200 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>เพิ่มแถวสินค้า</span>
          </button>
        </div>

        {/* Desktop & Tablet Table */}
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full min-w-[760px] text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3 w-28">
                  <div className="flex items-center gap-1 text-sky-700">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>รหัส GPU</span>
                  </div>
                </th>
                <th className="py-2.5 px-3 w-32">
                  <div className="flex items-center gap-1 text-purple-700">
                    <Hash className="w-3.5 h-3.5" />
                    <span>รหัส TPU</span>
                  </div>
                </th>
                <th className="py-2.5 px-3 min-w-[180px]">ชื่อสินค้า (Product Name)</th>
                <th className="py-2.5 px-2 w-20 text-center">จำนวน</th>
                <th className="py-2.5 px-3 w-28 text-right">
                  <span className="block">ราคา/หน่วย</span>
                  <span className="text-[10px] text-emerald-700 font-bold block">(รวม VAT 7%)</span>
                </th>
                <th className="py-2.5 px-3 w-32 text-right">
                  <span className="block">ราคารวม</span>
                  <span className="text-[10px] text-emerald-700 font-bold block">(รวม VAT 7%)</span>
                </th>
                <th className="py-2.5 px-2 w-10 text-center">ลบ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoiceData.items.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-xs">{index + 1}</td>

                  {/* GPU Code 5-8 digits */}
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={item.gpuCode || ''}
                      onChange={(e) => handleItemChange(index, 'gpuCode', e.target.value)}
                      placeholder="เช่น 842109"
                      className="w-full px-2 py-1.5 text-xs font-mono font-semibold text-sky-800 bg-sky-50/60 rounded-lg border border-sky-200 focus:border-sky-500 focus:bg-white outline-none"
                    />
                  </td>

                  {/* TPU Code 5-8 digits */}
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={item.tpuCode || ''}
                      onChange={(e) => handleItemChange(index, 'tpuCode', e.target.value)}
                      placeholder="เช่น 51209384"
                      className="w-full px-2 py-1.5 text-xs font-mono font-semibold text-purple-800 bg-purple-50/60 rounded-lg border border-purple-200 focus:border-purple-500 focus:bg-white outline-none"
                    />
                  </td>

                  {/* Product Name */}
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={item.productName || ''}
                      onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                      placeholder="ชื่อสินค้า/รายการ"
                      className="w-full px-2.5 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 focus:border-blue-500 outline-none"
                    />
                  </td>

                  {/* Quantity */}
                  <td className="py-2 px-1 text-center">
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-16 px-1.5 py-1.5 text-xs sm:text-sm font-mono text-center rounded-lg border border-slate-300 focus:border-blue-500 outline-none"
                    />
                  </td>

                  {/* Unit Price with VAT */}
                  <td className="py-2 px-2 text-right">
                    <div className="space-y-0.5">
                      <input
                        type="number"
                        step="0.01"
                        value={item.unitPriceWithVat}
                        onChange={(e) => handleItemChange(index, 'unitPriceWithVat', e.target.value)}
                        className="w-24 px-2 py-1.5 text-xs sm:text-sm font-mono font-semibold text-emerald-800 text-right bg-emerald-50/50 rounded-lg border border-emerald-300 focus:border-emerald-500 focus:bg-white outline-none"
                      />
                      {item.unitPrice !== item.unitPriceWithVat && (
                        <div className="text-[10px] text-slate-400 font-mono pr-1">
                          ก่อน VAT: {item.unitPrice?.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Total Price with VAT */}
                  <td className="py-2 px-3 text-right">
                    <div className="space-y-0.5">
                      <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
                        {item.totalPriceWithVat?.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </span>
                      {item.totalPrice !== item.totalPriceWithVat && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          ก่อน VAT: {item.totalPrice?.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Delete Row */}
                  <td className="py-2 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="ลบแถวนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Totals Summary Breakdown */}
        {/* ------------------------------------------------------------- */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col md:flex-row justify-between gap-6">
          <div className="text-xs text-slate-500 max-w-sm space-y-1">
            <p className="font-semibold text-slate-700 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>การรับประกันราคารวมภาษี VAT 7%</span>
            </p>
            <p>
              ตามเงื่อนไขของระบบ ข้อมูลที่บันทึกลง Google Sheets และ Google Drive จะได้รับการเปรียบเทียบและปรับให้เป็นราคารวม VAT 7% เสมอ ไม่ว่าต้นทางจะคำนวณมาหรือไม่ก็ตาม
            </p>
          </div>

          <div className="w-full md:w-80 bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-slate-600">
              <span>ยอดรวมก่อนภาษี (Subtotal):</span>
              <span className="font-mono font-medium">
                {invoiceData.subtotal?.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
              </span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>ภาษีมูลค่าเพิ่ม 7% (VAT):</span>
              <span className="font-mono font-medium">
                {invoiceData.vatAmount?.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
              </span>
            </div>

            <div className="flex justify-between text-slate-500 text-xs">
              <span>ยอดเดิมตามเอกสาร:</span>
              <span className="font-mono">{invoiceData.grandTotal?.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿</span>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
              <div>
                <span className="font-bold text-slate-900 block text-sm">10. ราคารวมสุทธิ</span>
                <span className="text-[11px] text-emerald-700 font-semibold">(รวม VAT 7% เสมอ)</span>
              </div>
              <span className="font-mono font-bold text-lg sm:text-xl text-blue-700">
                {invoiceData.grandTotalWithVat?.toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Action Buttons Toolbar */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Main Submit to GAS Button */}
          <button
            type="button"
            disabled={isSavingGas}
            onClick={onSaveToGas}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-md ${
              isSavingGas
                ? 'bg-emerald-400 text-white cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 active:scale-98'
            }`}
          >
            {isSavingGas ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>กำลังบันทึกลง Google Sheets &amp; Drive...</span>
              </>
            ) : (
              <>
                <CloudUpload className="w-5 h-5" />
                <span>บันทึกลง Google Sheets &amp; Drive (พร้อมแจ้งเตือนผ่าน LINE OA)</span>
              </>
            )}
          </button>

          {/* Quick status if not configured */}
          {!gasConfigured && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-2 rounded-xl border border-amber-200 flex items-center gap-1 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>ยังไม่ตั้งค่า GAS URL</span>
            </button>
          )}
        </div>

        {/* Secondary actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onSaveDraft}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium transition-colors"
          >
            บันทึกร่าง
          </button>

          <button
            type="button"
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium transition-colors"
            title="ดาวน์โหลด CSV สำหรับนำเข้า Excel หรือ Google Sheets"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">ดาวน์โหลด CSV</span>
          </button>

          <button
            type="button"
            onClick={copyJson}
            className="p-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs transition-colors"
            title="คัดลอก JSON"
          >
            {copiedJson ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </div>

      {/* Success Links if already saved */}
      {(driveFileUrl || sheetUrl) && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>บิลนี้บันทึกเข้าสู่ระบบเรียบร้อยแล้ว:</span>
          </div>

          <div className="flex items-center gap-3">
            {driveFileUrl && driveFileUrl.startsWith('http') && (
              <a
                href={driveFileUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-emerald-700 underline hover:text-emerald-900 flex items-center gap-1"
              >
                <span>เปิดรูปใน Google Drive</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            {sheetUrl && (
              <a
                href={sheetUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-blue-700 underline hover:text-blue-900 flex items-center gap-1"
              >
                <span>เปิด Google Sheets</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
