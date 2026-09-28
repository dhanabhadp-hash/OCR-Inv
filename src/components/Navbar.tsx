import React from 'react';
import { Camera, FileSpreadsheet, Settings, Code, History, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface NavbarProps {
  activeTab: 'scan' | 'history' | 'settings' | 'gas';
  setActiveTab: (tab: 'scan' | 'history' | 'settings' | 'gas') => void;
  historyCount: number;
  hasGasConfigured: boolean;
  hasLineConfigured: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  historyCount,
  hasGasConfigured,
  hasLineConfigured,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('scan')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">Inventory OCR</span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  <Sparkles className="w-3 h-3" />
                  Gemini AI Vision
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                สแกนบิลสินค้า • Google Sheets &amp; Drive • LINE OA Chatbot
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('scan')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'scan'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>สแกนบิล</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors relative ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <History className="w-4 h-4" />
              <span>ประวัติ</span>
              {historyCount > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'history' ? 'bg-white text-blue-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {historyCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('gas')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'gas'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Code className="w-4 h-4" />
              <span className="hidden md:inline">Google Apps Script</span>
              <span className="md:hidden">Apps Script</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors relative ${
                activeTab === 'settings'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">ตั้งค่าเชื่อมต่อ</span>
              <span className="sm:hidden">ตั้งค่า</span>
              {hasGasConfigured ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1.5 right-1.5" title="เชื่อมต่อ Google Apps Script แล้ว" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1.5 right-1.5" title="ยังไม่ได้ตั้งค่า Google Apps Script" />
              )}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
