export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ==============================================================================
 * Google Apps Script (Code.gs) for Inventory OCR & Google Sheets & Drive Sync
 * พร้อมระบบแจ้งเตือนผ่าน LINE Chatbot (LINE Messaging API / LINE Official Account)
 * ==============================================================================
 * 
 * *หมายเหตุ: LINE Notify ได้ยุติการให้บริการแล้ว ระบบนี้จึงใช้ LINE Messaging API 
 * ของ LINE Official Account ซึ่งรองรับทั้งการส่งการ์ดสรุปบิลแบบ Flex Message และข้อความ
 * 
 * วิธีการติดตั้ง (Quick Setup):
 * 1. เปิด Google Sheet ที่ต้องการเก็บข้อมูล -> ไปที่เมนู "ส่วนขยาย" (Extensions) -> "Apps Script"
 * 2. ลบโค้ดเดิมทั้งหมดใน Code.gs แล้ววางโค้ดชุดนี้ลงไปทั้งหมด
 * 3. กดปุ่ม "บันทึก" (รูปแผ่นดิสก์ หรือ Ctrl+S)
 * 4. กดปุ่ม "ทำให้ใช้งานได้" (Deploy) สีน้ำเงินมุมขวาบน -> เลือก "การทำให้ใช้งานได้ใหม่" (New deployment)
 * 5. เลือกประเภท: "เว็บแอป" (Web app)
 *    - คำอธิบาย: Inventory OCR Web App v2 (LINE Messaging API)
 *    - ดำเนินการในฐานะ: "ฉัน" (Me)
 *    - ใครมีสิทธิ์เข้าถึง: "ทุกคน" (Anyone) **สำคัญมาก ต้องเลือก Anyone**
 * 6. กด "ทำให้ใช้งานได้" (Deploy) -> ตรวจสอบสิทธิ์ (Authorize access) แล้วคัดลอก "URL เว็บแอป"
 * 7. นำ URL เว็บแอปมาวางในช่อง "Google Apps Script Web App URL" ในหน้าตั้งค่าของระบบ
 * 
 * *เคล็ดลับ: สามารถนำ URL เว็บแอปนี้ไปใส่ในช่อง Webhook URL ของ LINE Developers Console ได้ด้วย
 * เมื่อพิมพ์ข้อความหาบอท บอทจะตอบกลับ User ID ของท่านทันทีอัตโนมัติ!
 */

// ชื่อแท็บชีทเริ่มต้นสำหรับบันทึกข้อมูลบิล Inventory
var DEFAULT_SHEET_NAME = "บิล Inventory";
// ชื่อโฟลเดอร์ใน Google Drive สำหรับเก็บไฟล์รูปบิล (หากไม่ได้ระบุ Folder ID)
var DEFAULT_DRIVE_FOLDER_NAME = "Inventory_OCR_Uploads";

/**
 * ฟังก์ชันหลักรับคำขอแบบ POST จากเว็บแอปพลิเคชัน หรือ LINE Webhook
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({
        status: "error",
        message: "No POST body received."
      }, 400);
    }

    var payload = JSON.parse(e.postData.contents);

    // ตรวจสอบกรณีเป็น Webhook จาก LINE Bot โดยตรง (ช่วยให้ผู้ใช้ทราบ User ID ของตัวเอง)
    if (payload.events && Array.isArray(payload.events)) {
      handleLineWebhook(payload);
      return jsonResponse({ status: "success", message: "LINE webhook handled" });
    }

    var invoiceData = payload.invoiceData || {};
    var items = payload.items || invoiceData.items || [];
    var imageBase64 = payload.imageBase64;
    var imageName = payload.imageName || ("INV_" + (invoiceData.invoiceNo || "BILL") + "_" + new Date().getTime() + ".jpg");
    var mimeType = payload.mimeType || "image/jpeg";
    var customFolderId = payload.driveFolderId;
    var customSheetId = payload.sheetId;
    var targetSheetName = payload.sheetName || DEFAULT_SHEET_NAME;
    
    // LINE Messaging API parameters
    var lineToken = payload.lineChannelAccessToken || payload.lineNotifyToken;
    var lineTargetId = payload.lineTargetId || "";

    var driveFileUrl = "";

    // -------------------------------------------------------------
    // ขั้นตอนที่ 1: บันทึกไฟล์ภาพลงใน Google Drive
    // -------------------------------------------------------------
    if (imageBase64) {
      try {
        var cleanBase64 = imageBase64.replace(/^data:image\\/[a-z]+;base64,/, "");
        var decodedBytes = Utilities.base64Decode(cleanBase64);
        var blob = Utilities.newBlob(decodedBytes, mimeType, imageName);

        var targetFolder;
        if (customFolderId && customFolderId.trim() !== "") {
          targetFolder = DriveApp.getFolderById(customFolderId.trim());
        } else {
          var folders = DriveApp.getFoldersByName(DEFAULT_DRIVE_FOLDER_NAME);
          if (folders.hasNext()) {
            targetFolder = folders.next();
          } else {
            targetFolder = DriveApp.createFolder(DEFAULT_DRIVE_FOLDER_NAME);
          }
        }

        var uploadedFile = targetFolder.createFile(blob);
        uploadedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        driveFileUrl = uploadedFile.getUrl();
      } catch (driveErr) {
        Logger.log("Drive upload error: " + driveErr.toString());
        driveFileUrl = "บันทึกรูปลง Drive ไม่สำเร็จ: " + driveErr.message;
      }
    }

    // -------------------------------------------------------------
    // ขั้นตอนที่ 2: บันทึกข้อมูลข้อความ OCR ลง Google Sheets
    // -------------------------------------------------------------
    var spreadsheet;
    if (customSheetId && customSheetId.trim() !== "") {
      spreadsheet = SpreadsheetApp.openById(customSheetId.trim());
    } else {
      spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    }

    if (!spreadsheet) {
      throw new Error("ไม่พบ Google Spreadsheet กรุณาผูก Apps Script กับ Sheet หรือระบุ Sheet ID");
    }

    var sheet = spreadsheet.getSheetByName(targetSheetName);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(targetSheetName);
    }

    ensureSheetHeaders(sheet);

    var nowStr = Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss");
    var rowsToInsert = [];

    var companyName = invoiceData.companyName || "-";
    var taxId = invoiceData.taxId || "-";
    var invoiceNo = invoiceData.invoiceNo || "-";
    var invoiceDate = invoiceData.invoiceDate || "-";
    var salesperson = invoiceData.salesperson || "-";
    var grandTotalWithVat = Number(invoiceData.grandTotalWithVat) || Number(invoiceData.grandTotal) || 0;
    var vatStatus = invoiceData.isDocVatIncluded ? "บิลรวม VAT 7% อยู่แล้ว" : "ปรับคำนวณรวม VAT 7% ให้แล้ว";
    var vatExplanation = invoiceData.vatAnalysisExplanation || "-";

    if (items && items.length > 0) {
      for (var i = 0; i < items.length; i++) {
        var itm = items[i];
        var gpuCode = itm.gpuCode || "-";
        var tpuCode = itm.tpuCode || "-";
        var prodName = itm.productName || "-";
        var qty = Number(itm.quantity) || 1;
        var unitPriceWithVat = Number(itm.unitPriceWithVat) || Number(itm.unitPrice) || 0;
        var totalPriceWithVat = Number(itm.totalPriceWithVat) || (qty * unitPriceWithVat);

        rowsToInsert.push([
          nowStr,              // 1. วัน-เวลาที่บันทึก
          invoiceNo,           // 2. เลขที่บิล
          companyName,         // 3. ชื่อบริษัท/ผู้ขาย
          "'" + taxId,         // 4. เลขประจำตัวผู้เสียภาษี
          invoiceDate,         // 5. วันที่ในบิล
          salesperson,         // 6. พนักงานขาย
          "'" + gpuCode,       // 7. รหัส GPU (5-8 หลัก)
          "'" + tpuCode,       // 8. รหัส TPU (5-8 หลัก)
          prodName,            // 9. ชื่อสินค้า
          qty,                 // 10. จำนวน
          unitPriceWithVat,    // 11. ราคา/หน่วย (รวม VAT 7%)
          totalPriceWithVat,   // 12. ราคารวมรายการ (รวม VAT 7%)
          grandTotalWithVat,   // 13. ราคารวมสุทธิทั้งบิล (รวม VAT 7%)
          vatStatus,           // 14. สถานะ VAT
          vatExplanation,      // 15. คำอธิบาย VAT
          driveFileUrl,        // 16. ลิงก์รูปภาพใน Google Drive
          new Date().toLocaleDateString("th-TH") // 17. วันที่บันทึก
        ]);
      }
    } else {
      rowsToInsert.push([
        nowStr,
        invoiceNo,
        companyName,
        "'" + taxId,
        invoiceDate,
        salesperson,
        "-",
        "-",
        "ไม่ระบุรายการ",
        1,
        grandTotalWithVat,
        grandTotalWithVat,
        grandTotalWithVat,
        vatStatus,
        vatExplanation,
        driveFileUrl,
        new Date().toLocaleDateString("th-TH")
      ]);
    }

    if (rowsToInsert.length > 0) {
      var lastRow = sheet.getLastRow();
      sheet.getRange(lastRow + 1, 1, rowsToInsert.length, rowsToInsert[0].length).setValues(rowsToInsert);
      try {
        sheet.getRange(lastRow + 1, 11, rowsToInsert.length, 3).setNumberFormat("#,##0.00");
      } catch (numErr) {}
    }

    // -------------------------------------------------------------
    // ขั้นตอนที่ 3: ส่งการแจ้งเตือนผ่าน LINE Chatbot (LINE Messaging API)
    // -------------------------------------------------------------
    var lineNotificationStatus = "skipped";
    if (lineToken && lineToken.trim() !== "") {
      try {
        var lineRes = sendLineMessagingApi(lineToken.trim(), lineTargetId.trim(), {
          companyName: companyName,
          taxId: taxId,
          invoiceNo: invoiceNo,
          invoiceDate: invoiceDate,
          salesperson: salesperson,
          itemCount: items.length,
          grandTotalWithVat: grandTotalWithVat,
          vatStatus: vatStatus,
          driveFileUrl: driveFileUrl,
          sheetUrl: spreadsheet.getUrl(),
          items: items
        });
        lineNotificationStatus = lineRes.success ? "sent" : ("failed: " + lineRes.error);
      } catch (lineErr) {
        Logger.log("LINE Bot API error: " + lineErr.toString());
        lineNotificationStatus = "failed: " + lineErr.message;
      }
    }

    return jsonResponse({
      status: "success",
      message: "บันทึกข้อมูลบิล Inventory และอัพโหลดรูปภาพสำเร็จแล้ว!",
      driveFileUrl: driveFileUrl,
      rowsAdded: rowsToInsert.length,
      lineNotification: lineNotificationStatus,
      sheetUrl: spreadsheet.getUrl()
    });

  } catch (error) {
    Logger.log("Error in doPost: " + error.toString());
    return jsonResponse({
      status: "error",
      message: error.toString()
    }, 500);
  } finally {
    lock.releaseLock();
  }
}

/**
 * ตรวจสอบและสร้างหัวตารางในชีท พร้อมจัดรูปแบบสีสันสวยงาม
 */
function ensureSheetHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    var headers = [
      "วัน-เวลาที่บันทึก (Timestamp)",
      "เลขที่บิล (Invoice No)",
      "ชื่อบริษัท / ผู้จำหน่าย",
      "เลขประจำตัวผู้เสียภาษี (Tax ID)",
      "วันที่ในเอกสาร",
      "พนักงานขาย",
      "รหัส GPU (5-8 หลัก)",
      "รหัส TPU (5-8 หลัก)",
      "ชื่อสินค้า / รายการ",
      "จำนวน (Qty)",
      "ราคา/หน่วย (รวม VAT 7%)",
      "ราคารวมรายการ (รวม VAT 7%)",
      "ราคารวมสุทธิทั้งบิล (รวม VAT 7%)",
      "สถานะ VAT 7%",
      "คำอธิบายการคำนวณ VAT",
      "ลิงก์รูปภาพใน Google Drive",
      "วันที่ทำรายการ"
    ];

    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setBackground("#1e293b");
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    headerRange.setWrap(true);
    sheet.setFrozenRows(1);
    sheet.setRowHeight(1, 35);
  }
}

/**
 * ส่งการแจ้งเตือนผ่าน LINE Messaging API ด้วย Flex Message ดีไซน์สวยงาม
 */
function sendLineMessagingApi(channelAccessToken, targetId, data) {
  var formatCurrency = function(val) {
    return Number(val).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // สร้างข้อความสรุปสินค้าแบบสั้น
  var itemsSummary = "";
  if (data.items && data.items.length > 0) {
    for (var i = 0; i < Math.min(data.items.length, 3); i++) {
      var itm = data.items[i];
      itemsSummary += "• " + itm.productName + " (GPU: " + (itm.gpuCode || "-") + " | TPU: " + (itm.tpuCode || "-") + ")\\n";
    }
    if (data.items.length > 3) {
      itemsSummary += "  ...และอีก " + (data.items.length - 3) + " รายการ\\n";
    }
  }

  // สร้าง LINE Flex Message
  var flexMessage = {
    type: "flex",
    altText: "🔔 สรุปบิล Inventory: " + data.invoiceNo + " (" + formatCurrency(data.grandTotalWithVat) + " ฿)",
    contents: {
      type: "bubble",
      size: "giga",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#1e3a8a",
        paddingAll: "16px",
        contents: [
          {
            type: "text",
            text: "INVENTORY OCR • บันทึกบิลสำเร็จ",
            color: "#93c5fd",
            size: "xxs",
            weight: "bold",
            letterSpacing: "1px"
          },
          {
            type: "text",
            text: data.invoiceNo || "บิลสินค้า",
            color: "#ffffff",
            size: "xl",
            weight: "bold",
            margin: "xs"
          },
          {
            type: "text",
            text: data.companyName,
            color: "#e2e8f0",
            size: "sm",
            wrap: true,
            margin: "xs"
          }
        ]
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "16px",
        contents: [
          // Total Box
          {
            type: "box",
            layout: "horizontal",
            backgroundColor: "#f0fdf4",
            cornerRadius: "8px",
            paddingAll: "12px",
            borderColor: "#86efac",
            borderWidth: "1px",
            contents: [
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: "ยอดสุทธิ (รวม VAT 7% เสมอ)",
                    size: "xs",
                    color: "#166534",
                    weight: "bold"
                  },
                  {
                    type: "text",
                    text: formatCurrency(data.grandTotalWithVat) + " THB",
                    size: "xl",
                    color: "#15803d",
                    weight: "bold"
                  }
                ]
              }
            ]
          },
          // Info List
          {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            margin: "md",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "วันที่ในบิล:", size: "xs", color: "#64748b", flex: 2 },
                  { type: "text", text: data.invoiceDate, size: "xs", color: "#0f172a", flex: 4, weight: "bold" }
                ]
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "พนักงานขาย:", size: "xs", color: "#64748b", flex: 2 },
                  { type: "text", text: data.salesperson, size: "xs", color: "#0f172a", flex: 4 }
                ]
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "เลขผู้เสียภาษี:", size: "xs", color: "#64748b", flex: 2 },
                  { type: "text", text: data.taxId, size: "xs", color: "#0f172a", flex: 4 }
                ]
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "จำนวนสินค้า:", size: "xs", color: "#64748b", flex: 2 },
                  { type: "text", text: data.itemCount + " รายการ", size: "xs", color: "#0f172a", flex: 4, weight: "bold" }
                ]
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "สถานะภาษี:", size: "xs", color: "#64748b", flex: 2 },
                  { type: "text", text: data.vatStatus, size: "xs", color: "#2563eb", flex: 4 }
                ]
              }
            ]
          }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: []
      }
    }
  };

  // เพิ่มปุ่ม Action ใน Footer
  var footerContents = [];
  if (data.driveFileUrl && data.driveFileUrl.indexOf("http") === 0) {
    footerContents.push({
      type: "button",
      style: "primary",
      color: "#2563eb",
      height: "sm",
      action: {
        type: "uri",
        label: "📁 เปิดดูรูปภาพใน Google Drive",
        uri: data.driveFileUrl
      }
    });
  }

  if (data.sheetUrl && data.sheetUrl.indexOf("http") === 0) {
    footerContents.push({
      type: "button",
      style: "secondary",
      height: "sm",
      action: {
        type: "uri",
        label: "📊 เปิด Google Sheets",
        uri: data.sheetUrl
      }
    });
  }

  if (footerContents.length > 0) {
    flexMessage.contents.footer.contents = footerContents;
  } else {
    delete flexMessage.contents.footer;
  }

  // ส่งแบบ Push Message (ถ้ามี targetId) หรือ Broadcast (ถ้าเว้นว่าง)
  var isBroadcast = !targetId || targetId.trim() === "" || targetId.toLowerCase() === "broadcast";
  var endpoint = isBroadcast
    ? "https://api.line.me/v2/bot/message/broadcast"
    : "https://api.line.me/v2/bot/message/push";

  var linePayload = {
    messages: [flexMessage]
  };

  if (!isBroadcast) {
    linePayload.to = targetId.trim();
  }

  var options = {
    method: "post",
    headers: {
      "Authorization": "Bearer " + channelAccessToken,
      "Content-Type": "application/json"
    },
    payload: JSON.stringify(linePayload),
    muteHttpExceptions: true
  };

  var res = UrlFetchApp.fetch(endpoint, options);
  var responseCode = res.getResponseCode();
  var responseText = res.getContentText();
  Logger.log("LINE Messaging API response (" + responseCode + "): " + responseText);

  if (responseCode >= 200 && responseCode < 300) {
    return { success: true };
  } else {
    return { success: false, error: responseText };
  }
}

/**
 * รับ Webhook จาก LINE Bot โดยตรงเพื่อตอบกลับ User ID ของผู้ใช้โดยอัตโนมัติ
 */
function handleLineWebhook(payload) {
  var events = payload.events;
  for (var i = 0; i < events.length; i++) {
    var event = events[i];
    if (event.type === "message" || event.type === "follow") {
      var replyToken = event.replyToken;
      var userId = (event.source && event.source.userId) ? event.source.userId : "ไม่ทราบ";

      var replyText = "สวัสดีครับ! บอท Inventory OCR พร้อมทำงานแล้ว\\n\\n" +
        "📌 User ID ของคุณคือ:\\n" + userId + "\\n\\n" +
        "นำ User ID นี้ไปใส่ในหน้าตั้งค่าของระบบ เพื่อรับการแจ้งเตือนบิลได้ทันทีครับ!";

      // ตอบกลับหากมี replyToken
      // (ถ้าต้องการตอบกลับอัตโนมัติ ให้แนบ channelAccessToken ใน Apps Script Properties)
      Logger.log("User connected: " + userId);
    }
  }
}

/**
 * ฟังก์ชันรับคำขอแบบ GET สำหรับเช็คสถานะการทำงาน
 */
function doGet(e) {
  var output = {
    status: "online",
    message: "Google Apps Script Web App for Inventory OCR & LINE Messaging API is online!",
    timestamp: new Date().toISOString()
  };
  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ผู้ช่วยส่งกลับ JSON Response
 */
function jsonResponse(obj, statusCode) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
