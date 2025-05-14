
import React from "react";
import { Users, Database, FileText } from "lucide-react";

interface EmptyStateMessageProps {
  type: "no-patient" | "no-scans" | "no-diagnosis";
  className?: string;
}

const EmptyStateMessage = ({ type, className = "" }: EmptyStateMessageProps) => {
  if (type === "no-patient") {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">Vui lòng chọn bệnh nhân để xem kết quả</p>
      </div>
    );
  }

  if (type === "no-diagnosis") {
    return (
      <div className={`text-center py-12 ${className}`}>
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">Chưa có hồ sơ chẩn đoán nào</p>
      </div>
    );
  }

  return (
    <div className={`text-center py-12 ${className}`}>
      <Database className="h-12 w-12 text-gray-400 mx-auto mb-3" />
      <p className="text-gray-500 font-medium">Bệnh nhân chưa có ảnh MRI nào</p>
    </div>
  );
};

export default EmptyStateMessage;
