import express, { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Body parser with 50mb limit for high-res invoice images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// OCR Extraction Endpoint using Gemini 3.8 Flash
app.post('/api/ocr', async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      res.status(400).json({ error: 'Missing imageBase64 payload' });
      return;
    }

    // Clean base64 data prefix if present (e.g., data:image/png;base64,...)
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const promptText = `
คุณเป็นผู้เชี่ยวชาญการตรวจจับและวิเคราะห์ข้อมูลจากภาพถ่าย/สแกนบิลเอกสาร Inventory, ใบกำกับภาษี, ใบเสร็จรับเงิน, ใบส่งของ (Tax Invoice / Delivery Note / Receipt) ภาษาไทยและภาษาอังกฤษ

กรุณาสกัดข้อมูลสำคัญ 12 หัวข้อดังต่อไปนี้ออกมาให้ครบถ้วนและแม่นยำที่สุด:
1. ชื่อบริษัท/ร้านค้า/ผู้จำหน่าย (companyName)
2. เลขประจำตัวผู้เสียภาษี 13 หลัก (taxId)
3. เลขที่บิล / Invoice No. / เลขที่เอกสาร (invoiceNo)
4. วันที่ในเอกสาร (invoiceDate เช่น วัน/เดือน/ปี หรือ YYYY-MM-DD)
5. พนักงานขาย / ผู้เปิดบิล / พนักงานออกบิล / Sales Representative (salesperson ถ้าไม่พบให้ใส่ '-')
6. รายการสินค้า (items) โดยแต่ละรายการประกอบด้วย:
   - ชื่อสินค้า (productName)
   - จำนวน (quantity ตัวเลข)
   - ราคา/หน่วย (unitPrice ตัวเลข)
   - ราคารวม (totalPrice ตัวเลข)
   - **รหัส GPU** (gpuCode): ตัวเลข 5-8 หลักที่ระบุหมวดหมู่/รหัส GPU ของสินค้าในบิล Inventory ถ้าไม่พบให้ระบุ '-'
   - **รหัส TPU** (tpuCode): ตัวเลข 5-8 หลักที่ระบุมาตรฐาน/รายละเอียดเฉพาะ TPU ของสินค้า ถ้าไม่พบให้ระบุ '-'
   - บิลนี้รวม VAT หรือยัง (isVatIncludedInDoc: boolean)
   - ราคาต่อหน่วยที่รวม VAT 7% เสมอ (unitPriceWithVat)
   - ราคารวมของรายการที่รวม VAT 7% เสมอ (totalPriceWithVat)
7. ยอดรวมก่อนภาษี (subtotal)
8. ภาษีมูลค่าเพิ่ม 7% (vatAmount)
9. ราคารวมสุทธิเดิมตามเอกสาร (grandTotal)
10. ราคารวมสุทธิที่ต้องเป็นราคาที่รวม VAT 7% เสมอ (grandTotalWithVat)
11. การวิเคราะห์ VAT 7%:
    - เปรียบเทียบราคา/หน่วย ราคารวม และราคารวมสุทธิ ว่าเอกสารนี้ได้คำนวณ VAT 7% รวมมาให้แล้ว หรือเป็นราคาที่ไม่รวมภาษี
    - หากบริษัทไม่ได้คำนวณ VAT 7% มาให้ ให้ระบบนำราคา/หน่วยและราคารวมมาปรับเป็นราคาที่รวม VAT 7% (+7%) เสมอ
    - สรุปคำอธิบายการเปรียบเทียบใน vatAnalysisExplanation ภาษาไทย
12. ข้อความสรุปย่อทั้งหมดที่ OCR ได้ (rawSummary)

ส่งกลับผลลัพธ์เป็นโครงสร้าง JSON ที่ถูกต้องตาม Schema เท่านั้น ห้ามมีข้อความเกริ่นนำ
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: cleanBase64,
              },
            },
            {
              text: promptText,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            companyName: { type: Type.STRING, description: 'ชื่อบริษัทผู้จำหน่าย' },
            taxId: { type: Type.STRING, description: 'เลขประจำตัวผู้เสียภาษี 13 หลัก' },
            invoiceNo: { type: Type.STRING, description: 'เลขที่บิล' },
            invoiceDate: { type: Type.STRING, description: 'วันที่ในบิล' },
            salesperson: { type: Type.STRING, description: 'พนักงานขาย' },
            subtotal: { type: Type.NUMBER, description: 'ยอดรวมก่อนภาษี' },
            vatAmount: { type: Type.NUMBER, description: 'ยอด VAT 7%' },
            grandTotal: { type: Type.NUMBER, description: 'ยอดรวมสุทธิตามเอกสาร' },
            grandTotalWithVat: { type: Type.NUMBER, description: 'ยอดรวมสุทธิที่รวม VAT 7% เสมอ' },
            isDocVatIncluded: { type: Type.BOOLEAN, description: 'เอกสารรวม VAT 7% อยู่แล้วหรือไม่' },
            vatAnalysisExplanation: { type: Type.STRING, description: 'คำอธิบายสรุปการเปรียบเทียบ VAT 7%' },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  productName: { type: Type.STRING, description: 'ชื่อสินค้า' },
                  gpuCode: { type: Type.STRING, description: 'รหัส GPU ตัวเลข 5-8 หลัก หรือ -' },
                  tpuCode: { type: Type.STRING, description: 'รหัส TPU ตัวเลข 5-8 หลัก หรือ -' },
                  quantity: { type: Type.NUMBER, description: 'จำนวน' },
                  unitPrice: { type: Type.NUMBER, description: 'ราคาต่อหน่วยตามเอกสาร' },
                  totalPrice: { type: Type.NUMBER, description: 'ราคารวมตามเอกสาร' },
                  unitPriceWithVat: { type: Type.NUMBER, description: 'ราคาต่อหน่วยรวม VAT 7% เสมอ' },
                  totalPriceWithVat: { type: Type.NUMBER, description: 'ราคารวมของรายการรวม VAT 7% เสมอ' },
                },
                required: ['productName', 'quantity', 'unitPrice', 'totalPrice'],
              },
            },
            rawSummary: { type: Type.STRING, description: 'สรุปข้อความ OCR' },
          },
          required: ['companyName', 'invoiceNo', 'items', 'grandTotalWithVat'],
        },
      },
    });

    const textOutput = response.text || '{}';
    let parsedResult;
    try {
      parsedResult = JSON.parse(textOutput);
    } catch {
      // Fallback clean if there are markdown block wrappers
      const cleaned = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleaned);
    }

    // Server-side strict recalculation to strictly guarantee:
    // "บางบริษัทไม่คำนวน vat7%มาให้ ให้ระบบนำราคา/หน่วยราคารวมกับราคารวมสุทธิมาเปรียบเทียบกัน ต้องเป็นราคาที่รวมvat7%เสมอ"
    const isDocVatIncluded = !!parsedResult.isDocVatIncluded;
    
    if (Array.isArray(parsedResult.items)) {
      parsedResult.items = parsedResult.items.map((item: any, idx: number) => {
        const qty = Number(item.quantity) || 1;
        const uPrice = Number(item.unitPrice) || 0;
        const tPrice = Number(item.totalPrice) || (qty * uPrice);
        
        let uWithVat = Number(item.unitPriceWithVat);
        let tWithVat = Number(item.totalPriceWithVat);

        // If not already VAT included, calculate +7%
        if (!isDocVatIncluded) {
          uWithVat = Math.round(uPrice * 1.07 * 100) / 100;
          tWithVat = Math.round(tPrice * 1.07 * 100) / 100;
        } else {
          uWithVat = uWithVat || uPrice;
          tWithVat = tWithVat || tPrice;
        }

        // Clean GPU & TPU code if missing
        const gpu = item.gpuCode && item.gpuCode !== '-' && item.gpuCode.trim() !== '' 
          ? String(item.gpuCode).trim() 
          : '-';
        const tpu = item.tpuCode && item.tpuCode !== '-' && item.tpuCode.trim() !== '' 
          ? String(item.tpuCode).trim() 
          : '-';

        return {
          id: `item-${Date.now()}-${idx}`,
          productName: item.productName || 'สินค้าไม่ระบุชื่อ',
          gpuCode: gpu,
          tpuCode: tpu,
          quantity: qty,
          unitPrice: uPrice,
          totalPrice: tPrice,
          unitPriceWithVat: uWithVat,
          totalPriceWithVat: tWithVat,
        };
      });
    }

    // Ensure grand total with VAT is calculated
    if (!parsedResult.grandTotalWithVat) {
      if (!isDocVatIncluded && parsedResult.grandTotal) {
        parsedResult.grandTotalWithVat = Math.round(Number(parsedResult.grandTotal) * 1.07 * 100) / 100;
      } else {
        parsedResult.grandTotalWithVat = Number(parsedResult.grandTotal) || 0;
      }
    }

    res.json({
      success: true,
      data: parsedResult,
    });
  } catch (error: any) {
    console.error('Error during Gemini OCR processing:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'เกิดข้อผิดพลาดในการประมวลผล OCR ด้วย AI',
    });
  }
});

// Proxy to User's Google Apps Script Web App Endpoint
// This prevents browser CORS and HTTP 302 redirect issues
app.post('/api/sync-gas', async (req: Request, res: Response): Promise<void> => {
  try {
    const { gasUrl, payload } = req.body;

    if (!gasUrl || typeof gasUrl !== 'string' || !gasUrl.startsWith('http')) {
      res.status(400).json({
        success: false,
        error: 'กรุณาระบุ URL ของ Google Apps Script Web App ที่ถูกต้อง (เช่น https://script.google.com/macros/s/.../exec)',
      });
      return;
    }

    console.log(`Forwarding OCR sync payload to GAS: ${gasUrl}`);

    const gasResponse = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });

    const responseText = await gasResponse.text();
    let jsonResult;
    try {
      jsonResult = JSON.parse(responseText);
    } catch {
      jsonResult = { rawText: responseText };
    }

    if (!gasResponse.ok && (!jsonResult || jsonResult.status !== 'success')) {
      res.status(gasResponse.status || 500).json({
        success: false,
        error: `Google Apps Script ตอบกลับด้วยสถานะ ${gasResponse.status}: ${responseText.slice(0, 200)}`,
        details: jsonResult,
      });
      return;
    }

    res.json({
      success: true,
      data: jsonResult,
    });
  } catch (error: any) {
    console.error('Error proxying to GAS:', error);
    res.status(500).json({
      success: false,
      error: `ไม่สามารถเชื่อมต่อไปยัง Google Apps Script ได้: ${error.message}. กรุณาตรวจสอบว่าได้ตั้งค่าสิทธิ์ Deploy Web App เป็น "Anyone" แล้วหรือยัง`,
    });
  }
});

// Test Line Notify Token Directly
app.post('/api/test-line', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, message } = req.body;

    if (!token) {
      res.status(400).json({ success: false, error: 'กรุณาระบุ Line Notify Token' });
      return;
    }

    const testMsg = message || '🔔 [ทดสอบระบบ] การเชื่อมต่อ Line Notify จากระบบ Inventory OCR ทำงานได้ปกติ!';

    const formBody = new URLSearchParams();
    formBody.append('message', testMsg);

    const lineResponse = await fetch('https://notify-api.line.me/api/notify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody.toString(),
    });

    const data = await lineResponse.json();
    if (lineResponse.ok) {
      res.json({ success: true, message: 'ส่งข้อความทดสอบ Line Notify สำเร็จแล้ว!' });
    } else {
      res.status(lineResponse.status).json({
        success: false,
        error: data.message || 'ส่งข้อความไม่สำเร็จ กรุณาตรวจสอบ Token อีกครั้ง',
      });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Setup Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
