
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
  downloadURL: string;
  status: "pending" | "processed" | "analyzed";
  mmseScore?: number;
  diagnosis?: "AD" | "MCI" | "CN";
  confidence?: number;
}

interface MriScanTableProps {
  scans: MriScan[];
  onViewResult: (scan: MriScan) => void;
}

const MriScanTable = ({ scans, onViewResult }: MriScanTableProps) => {
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
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            Đang chờ
          </Badge>
        );
      case "processed":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
            Đã xử lý
          </Badge>
        );
      case "analyzed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            Đã phân tích
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
            Không xác định
          </Badge>
        );
    }
  };

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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tên File</TableHead>
          <TableHead>Kích Thước</TableHead>
          <TableHead>Ngày Tải Lên</TableHead>
          <TableHead>Trạng Thái</TableHead>
          <TableHead>Chẩn Đoán</TableHead>
          <TableHead className="text-right">Thao Tác</TableHead>
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
              {scan.diagnosis && (
                <Badge
                  variant="outline"
                  className={getDiagnosisLabel(scan.diagnosis)?.colorClass}
                >
                  {getDiagnosisLabel(scan.diagnosis)?.label}
                </Badge>
              )}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end space-x-2">
{/*                 <Button
                  variant="outline"
                  size="sm"
                  className="border-[#02646f] text-[#02646f] hover:bg-[#02646f] hover:text-white"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Xem
                </Button> */}
                {scan.status === "analyzed" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                    onClick={() => onViewResult(scan)}
                  >
                    <FileBarChart2 className="h-4 w-4 mr-1" />
                    Kết quả
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default MriScanTable;

