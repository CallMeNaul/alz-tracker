import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Download, FileBarChart2 } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

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

interface MriScanTableProps {
  scans: MriScan[];
  onViewResult: (scan: MriScan) => void;
  showUploader?: boolean;
}

const MriScanTable = ({ scans, onViewResult, showUploader = false }: MriScanTableProps) => {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + " MB";
    else return (bytes / 1073741824).toFixed(2) + " GB";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            Đang chờ
          </Badge>
        );
      case "processed":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
            Đã xử lý
          </Badge>
        );
      case "analyzed":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            Đã phân tích
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-300">
            Không xác định
          </Badge>
        );
    }
  };

  const getDiagnosisBadge = (diagnosis?: "AD" | "MCI" | "CN") => {
    if (!diagnosis) return null;

    switch (diagnosis) {
      case "AD":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            Alzheimer (Bệnh nặng)
          </Badge>
        );
      case "MCI":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            Suy giảm nhận thức nhẹ
          </Badge>
        );
      case "CN":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            Bình thường
          </Badge>
        );
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tên file</TableHead>
          <TableHead>Kích thước</TableHead>
          <TableHead>Ngày tải lên</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead>Chẩn đoán</TableHead>
          {showUploader && <TableHead>Người tải lên</TableHead>}
          <TableHead className="text-right">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {scans.map((scan) => (
          <TableRow key={scan.id}>
            <TableCell className="font-medium">{scan.fileName}</TableCell>
            <TableCell>{formatFileSize(scan.fileSize)}</TableCell>
            <TableCell>
              {format(scan.uploadDate, "dd/MM/yyyy HH:mm", { locale: vi })}
            </TableCell>
            <TableCell>{getStatusBadge(scan.status)}</TableCell>
            <TableCell>
              {scan.status === "analyzed" ? (
                <div className="flex flex-col gap-1">
                  {getDiagnosisBadge(scan.diagnosis)}
                  {scan.confidence && (
                    <span className="text-xs text-gray-500">
                      {Math.round(scan.confidence * 100)}% độ tin cậy
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-gray-500 text-sm">-</span>
              )}
            </TableCell>
            {showUploader && (
              <TableCell>
                <Badge className={scan.uploadedByRole === "doctor" ?
                  "bg-blue-100 text-blue-800 border-blue-300" :
                  "bg-purple-100 text-purple-800 border-purple-300"
                }>
                  {scan.uploadedByRole === "doctor" ? "Bác sĩ" : "Bệnh nhân"}
                </Badge>
              </TableCell>
            )}
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onViewResult(scan)}
                className="hover:bg-[#02646f]/10 hover:text-[#02646f]"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default MriScanTable;

