export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ==============================================================================
 * Google Apps Script (Code.gs) for Inventory OCR & Google Sheets & Drive Sync
 * พร้อมระบบแจ้งเตือนผ่าน Line Notify อัตโนมัติ
 * ==============================================================================
 * 
 * วิธีการติดตั้ง (Quick Setup):
 * 1. เปิด Google Sheet ที่ต้องการเก็บข้อมูล -> ไปที่เมนู "ส่วนขยาย" (Extensions) -> "Apps Script"
 * 2. ลบโค้ดเดิมทั้งหมดใน Code.gs แล้ววางโค้ดชุดนี้ลงไปทั้งหมด
 * 3. กดปุ่ม "บันทึก" (รูปแผ่นดิสก์ หรือ Ctrl+S)
 * 4. กดปุ่ม "ทำให้ใช้งานได้" (Deploy) สีน้ำเงินมุมขวาบน -> เลือก "การทำให้ใช้งานได้ใหม่" (New deployment)
 * 5. เลือกประเภท: "เว็บแอป" (Web app)
 *    - คำอธิบาย: Inventory OCR Web App v1
 *    - ดำเนินการในฐานะ: "ฉัน" (Me)
 *    - ใครมีสิทธิ์เข้าถึง: "ทุกคน" (Anyone) **สำคัญมาก ต้องเลือก Anyone**
 * 6. กด "ทำให้ใช้งานได้" (Deploy) -> ตรวจสอบสิทธิ์ (Authorize access) แล้วคัดลอก "URL เว็บแอป"
 * 7. นำ URL เว็บแอปมาวางในช่อง "Google Apps Script Web App URL" ในหน้าตั้งค่าของระบบ
 */

// ชื่อแท็บชีทเริ่มต้นสำหรับบันทึกข้อมูลบิล Inventory
var DEFAULT_SHEET_NAME = "บิล Inventory";
// ชื่อโฟลเดอร์ใน Google Drive สำหรับเก็บไฟล์รูปบิล (หากไม่ได้ระบุ Folder ID)
var DEFAULT_DRIVE_FOLDER_NAME = "Inventory_OCR_Uploads";

/**
 * ฟังก์ชันหลักรับคำขอแบบ POST จากเว็บแอปพลิเคชัน
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  // รอล็อคสูงสุด 30 วินาทีเพื่อป้องกันการเขียนข้อมูลชนกันพร้อมกัน
  lock.tryLock(30000);

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({
        status: "error",
        message: "No POST body received."
      }, 400);
    }

    var payload = JSON.parse(e.postData.contents);
    var invoiceData = payload.invoiceData || {};
    var items = payload.items || invoiceData.items || [];
    var imageBase64 = payload.imageBase64;
    var imageName = payload.imageName || ("INV_" + (invoiceData.invoiceNo || "BILL") + "_" + new Date().getTime() + ".jpg");
    var mimeType = payload.mimeType || "image/jpeg";
    var customFolderId = payload.driveFolderId;
    var customSheetId = payload.sheetId;
    var targetSheetName = payload.sheetName || DEFAULT_SHEET_NAME;
    var lineToken = payload.lineNotifyToken;

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
          // ค้นหาโฟลเดอร์ชื่อ DEFAULT_DRIVE_FOLDER_NAME หากไม่มีให้สร้างใหม่
          var folders = DriveApp.getFoldersByName(DEFAULT_DRIVE_FOLDER_NAME);
          if (folders.hasNext()) {
            targetFolder = folders.next();
          } else {
            targetFolder = DriveApp.createFolder(DEFAULT_DRIVE_FOLDER_NAME);
          }
        }

        var uploadedFile = targetFolder.createFile(blob);
        // กำหนดสิทธิ์ให้ผู้มีลิงก์สามารถดูรูปภาพได้
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

    // ตรวจสอบและสร้างหัวตาราง (Headers) หากยังไม่มี
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

    // หากมีรายการสินค้า (Items) ให้บันทึก 1 แถวต่อ 1 รายการ
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
          "'" + taxId,         // 4. เลขประจำตัวผู้เสียภาษี (ใส่ ' เพื่อไม่ให้ตัดเลข 0 นำหน้า)
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
      // กรณีไม่มีรายการสินค้าละเอียด
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
      // จัดรูปแบบตัวเลขคอลัมน์เงิน (คอลัมน์ 11, 12, 13) ให้เป็นแบบ #,##0.00
      try {
        sheet.getRange(lastRow + 1, 11, rowsToInsert.length, 3).setNumberFormat("#,##0.00");
      } catch (numErr) {}
    }

    // -------------------------------------------------------------
    // ขั้นตอนที่ 3: ส่งการแจ้งเตือนผ่าน Line Notify
    // -------------------------------------------------------------
    var lineNotificationStatus = "skipped";
    if (lineToken && lineToken.trim() !== "") {
      try {
        sendLineNotification(lineToken.trim(), {
          companyName: companyName,
          taxId: taxId,
          invoiceNo: invoiceNo,
          invoiceDate: invoiceDate,
          salesperson: salesperson,
          itemCount: items.length,
          grandTotalWithVat: grandTotalWithVat,
          vatStatus: vatStatus,
          driveFileUrl: driveFileUrl,
          items: items
        });
        lineNotificationStatus = "sent";
      } catch (lineErr) {
        Logger.log("Line Notify error: " + lineErr.toString());
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
    headerRange.setBackground("#1e293b"); // สีกรมท่า Dark Slate
    headerRange.setFontColor("#ffffff");
    headerRange.setFontWeight("bold");
    headerRange.setHorizontalAlignment("center");
    headerRange.setWrap(true);
    sheet.setFrozenRows(1);
    sheet.setRowHeight(1, 35);
  }
}

/**
 * ส่งการแจ้งเตือน Line Notify ด้วยข้อความจัดรูปแบบอย่างสวยงาม
 */
function sendLineNotification(token, data) {
  var formatCurrency = function(val) {
    return Number(val).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  var message = "\\n" +
    "🔔 [บันทึกบิล Inventory ใหม่!]" + "\\n" +
    "━━━━━━━━━━━━━━━━━━" + "\\n" +
    "🏢 บริษัท: " + data.companyName + "\\n" +
    "📄 เลขที่บิล: " + data.invoiceNo + "\\n" +
    "📅 วันที่: " + data.invoiceDate + "\\n" +
    "👤 พนักงานขาย: " + data.salesperson + "\\n" +
    "🔢 เลขผู้เสียภาษี: " + data.taxId + "\\n" +
    "📦 จำนวนสินค้า: " + data.itemCount + " รายการ" + "\\n" +
    "💰 ยอดสุทธิรวม VAT 7%: " + formatCurrency(data.grandTotalWithVat) + " บาท" + "\\n" +
    "📊 สถานะภาษี: " + data.vatStatus + "\\n";

  // แนบตัวอย่างรหัส GPU/TPU ถ้ามี
  if (data.items && data.items.length > 0) {
    var sampleGpu = data.items[0].gpuCode || "-";
    var sampleTpu = data.items[0].tpuCode || "-";
    if (sampleGpu !== "-" || sampleTpu !== "-") {
      message += "🔖 รหัสสินค้า: GPU=" + sampleGpu + " | TPU=" + sampleTpu + "\\n";
    }
  }

  if (data.driveFileUrl && data.driveFileUrl.indexOf("http") === 0) {
    message += "━━━━━━━━━━━━━━━━━━" + "\\n" +
      "📁 ลิงก์รูปภาพใน Google Drive:" + "\\n" +
      data.driveFileUrl;
  }

  var options = {
    method: "post",
    headers: {
      "Authorization": "Bearer " + token
    },
    payload: {
      message: message
    },
    muteHttpExceptions: true
  };

  var res = UrlFetchApp.fetch("https://notify-api.line.me/api/notify", options);
  Logger.log("Line Notify response: " + res.getContentText());
}

/**
 * ฟังก์ชันรับคำขอแบบ GET สำหรับเช็คสถานะการทำงาน
 */
function doGet(e) {
  var output = {
    status: "online",
    message: "Google Apps Script Web App for Inventory OCR is online and ready!",
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
