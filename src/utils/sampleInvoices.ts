import { InvoiceData } from '../types/inventory';

export interface SampleInvoice {
  id: string;
  name: string;
  description: string;
  tag: string;
  data: InvoiceData;
}

export const SAMPLE_INVOICES: SampleInvoice[] = [
  {
    id: 'sample-medical',
    name: 'บิลเวชภัณฑ์-ยา (Medical Inventory)',
    description: 'มีรหัส GPU และ TPU ชัดเจน 6-8 หลัก, ราคารวม VAT 7% แล้ว',
    tag: 'รวม VAT 7% แล้ว',
    data: {
      companyName: 'บริษัท เมดิคอล ฟาร์มาซูติคอล ซัพพลาย จำกัด',
      taxId: '0105558123456',
      invoiceNo: 'INV-2025/0892',
      invoiceDate: '15/09/2025',
      salesperson: 'นายสมชาย บริการดี',
      subtotal: 4650.00,
      vatAmount: 325.50,
      grandTotal: 4975.50,
      grandTotalWithVat: 4975.50,
      isDocVatIncluded: true,
      vatAnalysisExplanation: 'เอกสารระบุราคารวมภาษีมูลค่าเพิ่ม 7% (VAT Included) ครบถ้วนแล้ว ยอดรวมตรงกับเอกสาร',
      items: [
        {
          id: 'item-1',
          productName: 'Paracetamol 500mg Tab (กล่อง 100 เม็ด)',
          gpuCode: '842109',
          tpuCode: '51209384',
          quantity: 20,
          unitPrice: 85.00,
          totalPrice: 1700.00,
          unitPriceWithVat: 85.00,
          totalPriceWithVat: 1700.00,
        },
        {
          id: 'item-2',
          productName: 'Amoxicillin 500mg Cap (กล่อง 50 แคปซูล)',
          gpuCode: '739201',
          tpuCode: '62819402',
          quantity: 10,
          unitPrice: 160.00,
          totalPrice: 1600.00,
          unitPriceWithVat: 160.00,
          totalPriceWithVat: 1600.00,
        },
        {
          id: 'item-3',
          productName: 'Ethyl Alcohol 70% v/v (ขวด 450 ml)',
          gpuCode: '910234',
          tpuCode: '48192031',
          quantity: 30,
          unitPrice: 45.00,
          totalPrice: 1350.00,
          unitPriceWithVat: 45.00,
          totalPriceWithVat: 1350.00,
        },
      ],
      rawSummary: 'บิลใบกำกับภาษี บจก. เมดิคอล ฟาร์มาซูติคอล ซัพพลาย เลขที่ INV-2025/0892 วันที่ 15/09/2025 รวมทั้งสิ้น 4,975.50 บาท (รวม VAT 7% แล้ว)'
    }
  },
  {
    id: 'sample-hardware',
    name: 'บิลฮาร์ดแวร์ไอที (Hardware - ไม่คำนวณ VAT)',
    description: 'ร้านไม่ได้คำนวณ VAT 7% มาให้ ระบบตรวจพบและปรับราคาต่อหน่วยและราคารวมให้รวม VAT 7% เสมอ',
    tag: 'ระบบคำนวณ VAT 7% เพิ่ม',
    data: {
      companyName: 'บริษัท กรุงเทพ ซิสเต็มส์ แอนด์ คอมพิวเตอร์ จำกัด',
      taxId: '0105562098741',
      invoiceNo: 'BKK-680412',
      invoiceDate: '22/09/2025',
      salesperson: 'น.ส.วรวิทย์ เทคโน',
      subtotal: 59800.00,
      vatAmount: 4186.00,
      grandTotal: 59800.00,
      grandTotalWithVat: 63986.00,
      isDocVatIncluded: false,
      vatAnalysisExplanation: 'เอกสารไม่ได้คำนวณ VAT 7% มาให้ (Excl. VAT) ระบบได้เปรียบเทียบและปรับราคาต่อหน่วยและราคารวมแต่ละรายการให้รวม VAT 7% (+7%) ให้ถูกต้องเสมอตามเงื่อนไข',
      items: [
        {
          id: 'item-hw-1',
          productName: 'VGA Card GeForce RTX 4070 SUPER 12GB OC',
          gpuCode: '407012',
          tpuCode: '8721345',
          quantity: 2,
          unitPrice: 21500.00,
          totalPrice: 43000.00,
          unitPriceWithVat: 23005.00,
          totalPriceWithVat: 46010.00,
        },
        {
          id: 'item-hw-2',
          productName: 'SSD M.2 NVMe PCIe 4.0 2TB High-Speed',
          gpuCode: '950210',
          tpuCode: '5938102',
          quantity: 4,
          unitPrice: 4200.00,
          totalPrice: 16800.00,
          unitPriceWithVat: 4494.00,
          totalPriceWithVat: 17976.00,
        },
      ],
      rawSummary: 'บิลส่งของ/ใบแจ้งหนี้ บจก. กรุงเทพ ซิสเต็มส์ แอนด์ คอมพิวเตอร์ เลขที่ BKK-680412 ราคายังไม่รวมภาษีมูลค่าเพิ่ม ปรับเป็นราคารวม VAT 7% ทั้งสิ้น 63,986.00 บาท'
    }
  },
  {
    id: 'sample-material',
    name: 'บิลวัสดุอุปกรณ์อุตสาหกรรม (Industrial Materials)',
    description: 'บิลสแกนกระดาษ มีรหัส GPU 6 หลัก TPU 8 หลัก 4 รายการสินค้า',
    tag: 'รวม VAT 7% แล้ว',
    data: {
      companyName: 'ห้างหุ้นส่วนจำกัด สยาม แมททีเรียล อินดัสทรี',
      taxId: '0123547890123',
      invoiceNo: 'SMI-99432',
      invoiceDate: '05/10/2025',
      salesperson: 'นางสาวกัญญา พัฒนา',
      subtotal: 18500.00,
      vatAmount: 1295.00,
      grandTotal: 19795.00,
      grandTotalWithVat: 19795.00,
      isDocVatIncluded: true,
      vatAnalysisExplanation: 'เอกสารระบุราคารวมภาษีมูลค่าเพิ่ม 7% ชัดเจน มีรายการรหัสสินค้า GPU/TPU ครบถ้วน',
      items: [
        {
          id: 'item-mat-1',
          productName: 'น้ำมันหล่อลื่นสังเคราะห์เกรดพรีเมียม 20L',
          gpuCode: '610452',
          tpuCode: '10984521',
          quantity: 2,
          unitPrice: 3800.00,
          totalPrice: 7600.00,
          unitPriceWithVat: 3800.00,
          totalPriceWithVat: 7600.00,
        },
        {
          id: 'item-mat-2',
          productName: 'ชุดตลับลูกปืนแบริ่งแรงเสียดทานต่ำ 6205-2RS',
          gpuCode: '320981',
          tpuCode: '49281045',
          quantity: 10,
          unitPrice: 450.00,
          totalPrice: 4500.00,
          unitPriceWithVat: 450.00,
          totalPriceWithVat: 4500.00,
        },
        {
          id: 'item-mat-3',
          productName: 'สายพานลำเลียงความร้อนสูง V-Belt B-68',
          gpuCode: '581023',
          tpuCode: '78291034',
          quantity: 5,
          unitPrice: 680.00,
          totalPrice: 3400.00,
          unitPriceWithVat: 680.00,
          totalPriceWithVat: 3400.00,
        },
        {
          id: 'item-mat-4',
          productName: 'แผ่นซีลยางสังเคราะห์ EPDM หนา 3 มม.',
          gpuCode: '472091',
          tpuCode: '89102456',
          quantity: 3,
          unitPrice: 1000.00,
          totalPrice: 3000.00,
          unitPriceWithVat: 1000.00,
          totalPriceWithVat: 3000.00,
        }
      ],
      rawSummary: 'ใบเสร็จรับเงิน/ใบกำกับภาษี หจก. สยาม แมททีเรียล อินดัสทรี เลขที่ SMI-99432 วันที่ 05/10/2025 ยอดรวมสุทธิ 19,795.00 บาท'
    }
  }
];

/**
 * Generate a visual invoice document on HTML5 canvas and export as base64 JPEG
 */
export function generateSampleInvoiceImage(sample: SampleInvoice): string {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 1200;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#fafaf9';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Paper texture border
  ctx.strokeStyle = '#e7e5e4';
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  // Top header banner
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(40, 40, canvas.width - 80, 8);

  // Company Name
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 24px Prompt, sans-serif';
  ctx.fillText(sample.data.companyName, 50, 85);

  // Subtitle / Document Type
  ctx.font = 'bold 20px Prompt, sans-serif';
  ctx.fillStyle = '#1e40af';
  ctx.textAlign = 'right';
  ctx.fillText('ใบกำกับภาษี / ใบส่งสินค้า (TAX INVOICE)', canvas.width - 50, 85);

  // Meta Info Box
  ctx.textAlign = 'left';
  ctx.font = '14px Prompt, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText(`เลขประจำตัวผู้เสียภาษี: ${sample.data.taxId}`, 50, 115);
  ctx.fillText(`พนักงานขาย: ${sample.data.salesperson}`, 50, 138);

  ctx.textAlign = 'right';
  ctx.fillText(`เลขที่บิล: ${sample.data.invoiceNo}`, canvas.width - 50, 115);
  ctx.fillText(`วันที่: ${sample.data.invoiceDate}`, canvas.width - 50, 138);

  // Separator
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 160);
  ctx.lineTo(canvas.width - 50, 160);
  ctx.stroke();

  // VAT Notice Banner
  ctx.textAlign = 'left';
  if (sample.data.isDocVatIncluded) {
    ctx.fillStyle = '#ecfdf5';
    ctx.fillRect(50, 175, canvas.width - 100, 36);
    ctx.strokeStyle = '#a7f3d0';
    ctx.strokeRect(50, 175, canvas.width - 100, 36);
    ctx.fillStyle = '#065f46';
    ctx.font = 'bold 14px Prompt, sans-serif';
    ctx.fillText('✓ ราคาสินค้าในเอกสารนี้ เป็นราคารวมภาษีมูลค่าเพิ่ม 7% แล้ว (VAT Included)', 65, 198);
  } else {
    ctx.fillStyle = '#fffbeb';
    ctx.fillRect(50, 175, canvas.width - 100, 36);
    ctx.strokeStyle = '#fde68a';
    ctx.strokeRect(50, 175, canvas.width - 100, 36);
    ctx.fillStyle = '#92400e';
    ctx.font = 'bold 14px Prompt, sans-serif';
    ctx.fillText('! ราคาสินค้าในเอกสารนี้ยังไม่รวมภาษีมูลค่าเพิ่ม 7% (Prices Exclude 7% VAT)', 65, 198);
  }

  // Items Table Header
  const tableY = 230;
  ctx.fillStyle = '#334155';
  ctx.fillRect(50, tableY, canvas.width - 100, 36);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px Prompt, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ลำดับ', 60, tableY + 23);
  ctx.fillText('รหัส GPU', 110, tableY + 23);
  ctx.fillText('รหัส TPU', 190, tableY + 23);
  ctx.fillText('รายการสินค้า', 280, tableY + 23);
  ctx.textAlign = 'right';
  ctx.fillText('จำนวน', 580, tableY + 23);
  ctx.fillText('ราคา/หน่วย', 700, tableY + 23);
  ctx.fillText('จำนวนเงิน (บาท)', canvas.width - 65, tableY + 23);

  // Rows
  let curY = tableY + 36;
  sample.data.items.forEach((item, index) => {
    ctx.fillStyle = index % 2 === 0 ? '#ffffff' : '#f8fafc';
    ctx.fillRect(50, curY, canvas.width - 100, 42);

    ctx.strokeStyle = '#e2e8f0';
    ctx.strokeRect(50, curY, canvas.width - 100, 42);

    ctx.fillStyle = '#1e293b';
    ctx.font = '14px Prompt, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(String(index + 1), 70, curY + 26);
    
    // GPU badge
    ctx.font = 'bold 13px JetBrains Mono, monospace';
    ctx.fillStyle = '#0284c7';
    ctx.fillText(item.gpuCode || '-', 110, curY + 26);

    // TPU badge
    ctx.fillStyle = '#7c3aed';
    ctx.fillText(item.tpuCode || '-', 190, curY + 26);

    // Product Name
    ctx.font = '13px Prompt, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(item.productName.substring(0, 36), 280, curY + 26);

    // Qty, Unit Price, Total
    ctx.textAlign = 'right';
    ctx.font = '14px JetBrains Mono, monospace';
    ctx.fillText(String(item.quantity), 580, curY + 26);
    ctx.fillText(item.unitPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 }), 700, curY + 26);
    ctx.fillText(item.totalPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 }), canvas.width - 65, curY + 26);

    curY += 42;
  });

  // Summary box on bottom right
  const sumY = curY + 25;
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(480, sumY, canvas.width - 480 - 50, 160);
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(480, sumY, canvas.width - 480 - 50, 160);

  ctx.textAlign = 'left';
  ctx.font = '14px Prompt, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('ยอดรวมราคาสินค้า (Subtotal):', 500, sumY + 35);
  ctx.fillText('ภาษีมูลค่าเพิ่ม 7% (VAT 7%):', 500, sumY + 70);
  
  ctx.font = 'bold 16px Prompt, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('ยอดรวมสุทธิ (Grand Total):', 500, sumY + 120);

  ctx.textAlign = 'right';
  ctx.font = '15px JetBrains Mono, monospace';
  ctx.fillStyle = '#334155';
  ctx.fillText(sample.data.subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 }) + ' ฿', canvas.width - 70, sumY + 35);
  ctx.fillText(sample.data.vatAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 }) + ' ฿', canvas.width - 70, sumY + 70);
  
  ctx.font = 'bold 18px JetBrains Mono, monospace';
  ctx.fillStyle = '#1d4ed8';
  ctx.fillText(sample.data.grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 }) + ' ฿', canvas.width - 70, sumY + 120);

  // Signatures
  const sigY = sumY + 210;
  ctx.textAlign = 'center';
  ctx.font = '13px Prompt, sans-serif';
  ctx.fillStyle = '#64748b';

  ctx.fillText('ลงชื่อ .............................................', 200, sigY);
  ctx.fillText('( พนักงานผู้จัดทำ / ส่งสินค้า )', 200, sigY + 25);

  ctx.fillText('ลงชื่อ .............................................', canvas.width - 200, sigY);
  ctx.fillText('( ผู้มีอำนาจลงนาม / ฝ่ายการเงิน )', canvas.width - 200, sigY + 25);

  // Official stamp circle mock
  ctx.strokeStyle = 'rgba(220, 38, 38, 0.4)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(canvas.width - 200, sigY - 20, 45, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(220, 38, 38, 0.6)';
  ctx.font = 'bold 12px Prompt, sans-serif';
  ctx.fillText('PAID / ตรวจสอบแล้ว', canvas.width - 200, sigY - 20);

  return canvas.toDataURL('image/jpeg', 0.9);
}
