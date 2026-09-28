export interface InvoiceItem {
  id: string;
  productName: string;
  gpuCode: string; // รหัส GPU (ตัวเลข 5-8 หลัก)
  tpuCode: string; // รหัส TPU (ตัวเลข 5-8 หลัก)
  quantity: number;
  unitPrice: number; // ราคาต่อหน่วยดั้งเดิม
  totalPrice: number; // ราคารวมดั้งเดิม
  unitPriceWithVat: number; // ราคาต่อหน่วยรวม VAT 7% เสมอ
  totalPriceWithVat: number; // ราคารวมรายการรวม VAT 7% เสมอ
}

export interface InvoiceData {
  companyName: string;
  taxId: string;
  invoiceNo: string;
  invoiceDate: string;
  salesperson: string;
  subtotal: number;
  vatAmount: number;
  grandTotal: number;
  grandTotalWithVat: number;
  isDocVatIncluded: boolean;
  vatAnalysisExplanation: string;
  items: InvoiceItem[];
  rawSummary?: string;
}

export interface GasSettings {
  gasUrl: string;
  driveFolderId: string;
  sheetId: string;
  sheetName: string;
  lineNotifyToken: string;
}

export interface ScanRecord {
  id: string;
  timestamp: string;
  imageUrl: string;
  invoiceData: InvoiceData;
  syncStatus: 'draft' | 'synced' | 'failed';
  driveFileUrl?: string;
  sheetRowAdded?: number;
  lastSyncedAt?: string;
  error?: string;
}
