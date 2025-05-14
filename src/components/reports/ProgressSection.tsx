
import React from 'react';
import { format } from "date-fns";
import { FileText } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ProgressNote {
  id: string;
  timestamp: any;
  status: string;
  notes: string;
}

interface ProgressSectionProps {
  progressNotes: ProgressNote[];
}

const getStatusText = (status: string) => {
  switch (status) {
    case "improved":
      return "Cải thiện";
    case "worsened":
      return "Xấu đi";
    case "stable":
      return "Ổn định";
    default:
      return "Không xác định";
  }
};

const ProgressSection: React.FC<ProgressSectionProps> = ({ progressNotes }) => {
  if (!progressNotes.length) return null;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5 text-[#02646F]" />
        <span className="bg-gradient-to-r from-[#02646F] to-[#FFAA67] text-transparent bg-clip-text">
          Lịch Sử Tiến Triển
        </span>
      </h2>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Ngày</TableHead>
                <TableHead className="w-[150px]">Trạng Thái</TableHead>
                <TableHead>Ghi Chú</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {progressNotes
                .sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime())
                .slice(0, 5)
                .map((note) => (
                  <TableRow key={note.id}>
                    <TableCell className="font-medium">
                      {format(note.timestamp.toDate(), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
                        note.status === 'improved' 
                          ? 'bg-green-100 text-green-800' 
                          : note.status === 'worsened'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                      }`}>
                        {getStatusText(note.status)}
                      </div>
                    </TableCell>
                    <TableCell>{note.notes}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressSection;

