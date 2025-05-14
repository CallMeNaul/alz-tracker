
import React from 'react';
import { format } from "date-fns";
import { Clipboard } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DiagnosisTest {
  id: string;
  timestamp: any;
  mmseScore: number;
  cdRating: string;
  memoryTest?: number;
}

interface DiagnosisHistorySectionProps {
  diagnosticData: DiagnosisTest[];
  diagnosisTests: DiagnosisTest[];
}

const DiagnosisHistorySection: React.FC<DiagnosisHistorySectionProps> = ({ 
  diagnosticData, 
  diagnosisTests 
}) => {
  if (!diagnosticData.length && !diagnosisTests.length) return null;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Clipboard className="h-5 w-5 text-[#02646F]" />
        <span className="bg-gradient-to-r from-[#02646F] to-[#FFAA67] text-transparent bg-clip-text">
          Lịch Sử Chẩn Đoán
        </span>
      </h2>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Ngày</TableHead>
                <TableHead>Loại Đánh Giá</TableHead>
                <TableHead className="w-[100px]">MMSE</TableHead>
                <TableHead className="w-[100px]">CDR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...diagnosticData, ...diagnosisTests]
                .sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime())
                .slice(0, 10)
                .map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {format(item.timestamp.toDate(), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      {'memoryTest' in item ? 'Đánh Giá Chi Tiết' : 'Chẩn Đoán Cơ Bản'}
                    </TableCell>
                    <TableCell>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
                        item.mmseScore > 20 
                          ? 'bg-green-100 text-green-800' 
                          : item.mmseScore > 10
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {item.mmseScore}/30
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
                        item.cdRating === 'Normal' || item.cdRating === 'Bình thường' || item.cdRating === '0'
                          ? 'bg-green-100 text-green-800' 
                          : item.cdRating === 'Very Mild' || item.cdRating === 'Rất nhẹ' || item.cdRating === '0.5'
                            ? 'bg-blue-100 text-blue-800'
                            : item.cdRating === 'Mild' || item.cdRating === 'Nhẹ' || item.cdRating === '1'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                      }`}>
                        {item.cdRating}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiagnosisHistorySection;

