
import React from "react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface MriScan {
  id: string;
  fileName: string;
  fileSize: number;
  uploadDate: Date;
  downloadURL: string;
  status: "pending" | "processed" | "analyzed";
  mmseScore?: number;
  diagnosis?: "AD" | "MCI" | "CN";
  confidence?: number;
}

interface MriScanResultSheetProps {
  scan: MriScan | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const MriScanResultSheet = ({ scan, isOpen, onOpenChange }: MriScanResultSheetProps) => {
  const getDiagnosisLabel = (diagnosis?: "AD" | "MCI" | "CN") => {
    if (!diagnosis) return null;
    
    switch (diagnosis) {
      case "AD":
        return {
          label: "Alzheimer (Bệnh nặng)",
          colorClass: "bg-red-100 text-red-800 border-red-300",
        };
      case "MCI":
        return {
          label: "Suy giảm nhận thức nhẹ (Giai đoạn đầu)",
          colorClass: "bg-yellow-100 text-yellow-800 border-yellow-300",
        };
      case "CN":
        return {
          label: "Bình thường",
          colorClass: "bg-green-100 text-green-800 border-green-300",
        };
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-[#02646f]">Kết quả chẩn đoán</SheetTitle>
          <SheetDescription>
            Thông tin chi tiết về kết quả phân tích ảnh MRI
          </SheetDescription>
        </SheetHeader>
        {scan && (
          <div className="mt-6 space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Thông tin cơ bản</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tên file:</span>
                  <span>{scan.fileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ngày tải lên:</span>
                  <span>
                    {format(scan.uploadDate, "dd/MM/yyyy", { locale: vi })}
                  </span>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Kết quả phân tích</h3>
              {scan.diagnosis && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Chẩn đoán:</span>
                    <Badge
                      variant="outline"
                      className={getDiagnosisLabel(scan.diagnosis)?.colorClass}
                    >
                      {getDiagnosisLabel(scan.diagnosis)?.label}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Điểm MMSE:</span>
                    <Badge variant="outline">
                      {scan.mmseScore}/30
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Độ tin cậy:</span>
                    <Badge variant="outline">
                      {Math.round((scan.confidence || 0) * 100)}%
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default MriScanResultSheet;

