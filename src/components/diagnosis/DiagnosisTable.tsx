
import React from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardCheck } from "lucide-react";

interface DiagnosisTest {
  id: string;
  patientName: string;
  patientAge: number;
  mmseScore: number;
  cdRating: string;
  memoryTest: number;
  orientationTest: number;
  communicationTest: number;
  attentionTest: number;
  visualSpatialTest: number;
  recommendations: string;
  doctorNotes: string;
  timestamp: any;
}

interface DiagnosisTableProps {
  diagnosisTests: DiagnosisTest[];
  loading: boolean;
  isPatient: boolean;
}

const DiagnosisTable = ({ diagnosisTests, loading, isPatient }: DiagnosisTableProps) => {
  const calculateTotalScore = (test: DiagnosisTest) => {
    return test.memoryTest + test.orientationTest + test.communicationTest + 
           test.attentionTest + test.visualSpatialTest;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <motion.div 
          className="h-16 w-16 rounded-full border-4 border-[#FFAA67] border-t-transparent mx-auto"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p className="mt-4 text-gray-500">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (diagnosisTests.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <ClipboardCheck className="h-20 w-20 mx-auto mb-4 text-gray-300" />
        <p className="text-lg">
          {isPatient
            ? "Không có kết quả chẩn đoán nào cho bạn."
            : "Không có kết quả chẩn đoán. Thêm kết quả đầu tiên của bạn."}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50">
            <TableHead className="font-semibold">Bệnh Nhân</TableHead>
            <TableHead className="font-semibold">Tuổi</TableHead>
            <TableHead className="font-semibold">MMSE</TableHead>
            <TableHead className="font-semibold">CDR</TableHead>
            <TableHead className="font-semibold">Tổng Điểm</TableHead>
            <TableHead className="font-semibold">Ngày</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {diagnosisTests.map((test, index) => (
            <motion.tr
              key={test.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: index * 0.1,
                ease: "easeOut"
              }}
            >
              <TableCell className="font-medium">{test.patientName}</TableCell>
              <TableCell>{test.patientAge}</TableCell>
              <TableCell>
                <div className={`px-2 py-1 rounded-full text-sm inline-block 
                  ${test.mmseScore > 20 
                    ? 'bg-green-100 text-green-800' 
                    : test.mmseScore > 10
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                  {test.mmseScore}/30
                </div>
              </TableCell>
              <TableCell>
                <div className={`px-2 py-1 rounded-full text-sm inline-block
                  ${test.cdRating === 'Normal' || test.cdRating === 'Bình thường' || test.cdRating === '0'
                    ? 'bg-green-100 text-green-800' 
                    : test.cdRating === 'Very Mild' || test.cdRating === 'Rất nhẹ' || test.cdRating === '0.5'
                      ? 'bg-blue-100 text-blue-800'
                      : test.cdRating === 'Mild' || test.cdRating === 'Nhẹ' || test.cdRating === '1'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                  }`}>
                  {test.cdRating}
                </div>
              </TableCell>
              <TableCell>
                <div className="px-2 py-1 rounded-full text-sm inline-block bg-[#02646F]/10 text-[#02646F]">
                  {calculateTotalScore(test)}/25
                </div>
              </TableCell>
              <TableCell>{test.timestamp ? format(test.timestamp.toDate(), "dd/MM/yyyy") : "N/A"}</TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DiagnosisTable;
