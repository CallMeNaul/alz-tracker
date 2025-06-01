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
import { Brain, AlertTriangle, Activity } from "lucide-react";

interface MriScan {
  id: string;
  fileName: string;
  fileSize: number;
  uploadDate: Date;
  adPro: number;
  cnPro: number;
  status: "pending" | "processed" | "analyzed";
  mmseScore?: number;
  diagnosis?: "AD" | "MCI" | "CN";
  confidence?: number;
  uploadedBy?: string;
  uploadedByRole?: "doctor" | "patient";
}

interface MriScanResultSheetProps {
  scan: MriScan | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const MriScanResultSheet = ({ scan, isOpen, onOpenChange }: MriScanResultSheetProps) => {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + " MB";
    else return (bytes / 1073741824).toFixed(2) + " GB";
  };

  const getStatusFromDiagnosis = (diagnosis?: "AD" | "MCI" | "CN"): "error" | "warning" | "success" => {
    if (!diagnosis) return "error";
    switch (diagnosis) {
      case "AD": return "error";
      case "MCI": return "warning";
      case "CN": return "success";
    }
  };

  const getDiagnosisLabel = (diagnosis?: "AD" | "MCI" | "CN") => {
    if (!diagnosis) return "Không xác định";
    switch (diagnosis) {
      case "AD":
        return "Alzheimer (Bệnh nặng)";
      case "MCI":
        return "Suy giảm nhận thức nhẹ (Giai đoạn đầu)";
      case "CN":
        return "Bình thường";
    }
  };

  const getDiagnosisDescription = (diagnosis?: "AD" | "MCI" | "CN") => {
    if (!diagnosis) return "Không có thông tin chẩn đoán.";
    switch (diagnosis) {
      case "AD":
        return "Kết quả cho thấy các dấu hiệu của bệnh Alzheimer ở mức độ nặng. Cần tham khảo ý kiến bác sĩ ngay lập tức để được điều trị.";
      case "MCI":
        return "Phát hiện dấu hiệu suy giảm nhận thức nhẹ ở giai đoạn đầu. Cần theo dõi và kiểm tra định kỳ với bác sĩ.";
      case "CN":
        return "Không phát hiện dấu hiệu bất thường. Tiếp tục duy trì lối sống lành mạnh và kiểm tra định kỳ.";
    }
  };

  const getStatusIcon = (status: "error" | "warning" | "success") => {
    switch (status) {
      case "error":
        return <Activity className="h-6 w-6 text-red-600" />;
      case "warning":
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      case "success":
        return <Brain className="h-6 w-6 text-green-600" />;
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
                  <span className="text-gray-500">Kích thước:</span>
                  <span>{formatFileSize(scan.fileSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ngày tải lên:</span>
                  <span>
                    {format(scan.uploadDate, "dd/MM/yyyy HH:mm", { locale: vi })}
                  </span>
                </div>
                {scan.uploadedByRole && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Người tải lên:</span>
                    <Badge className={scan.uploadedByRole === "doctor" ?
                      "bg-blue-100 text-blue-800 border-blue-300" :
                      "bg-purple-100 text-purple-800 border-purple-300"
                    }>
                      {scan.uploadedByRole === "doctor" ? "Bác sĩ" : "Bệnh nhân"}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {scan.status === "analyzed" && scan.diagnosis && (
              <>
                <div className={`border rounded-lg p-4 ${scan.diagnosis === "AD" ? "bg-red-50 border-red-200" :
                  scan.diagnosis === "MCI" ? "bg-yellow-50 border-yellow-200" :
                    "bg-green-50 border-green-200"
                  }`}>
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-full ${scan.diagnosis === "AD" ? "bg-red-100" :
                      scan.diagnosis === "MCI" ? "bg-yellow-100" :
                        "bg-green-100"
                      }`}>
                      {getStatusIcon(getStatusFromDiagnosis(scan.diagnosis))}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">
                          {getDiagnosisLabel(scan.diagnosis)}
                        </h3>
                        {scan.confidence && (
                          <Badge className="bg-white/50 border-0">
                            {Math.round(scan.confidence * 100)}% độ tin cậy
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-gray-600">
                        {getDiagnosisDescription(scan.diagnosis)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Chỉ số chi tiết</h3>
                  <div className="space-y-3">
                    {scan.mmseScore !== undefined && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-500">Điểm MMSE:</span>
                          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                            {scan.mmseScore}/30
                          </Badge>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full">
                          <div
                            className="h-2 bg-blue-500 rounded-full"
                            style={{ width: `${(scan.mmseScore / 30) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-500">Xác suất Alzheimer:</span>
                        <Badge className="bg-red-100 text-red-800 border-red-300">
                          {(scan.adPro / 100 * 100).toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-2 bg-red-500 rounded-full"
                          style={{ width: `${scan.adPro}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-500">Xác suất bình thường:</span>
                        <Badge className="bg-green-100 text-green-800 border-green-300">
                          {(scan.cnPro / 100 * 100).toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-2 bg-green-500 rounded-full"
                          style={{ width: `${scan.cnPro}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default MriScanResultSheet;

