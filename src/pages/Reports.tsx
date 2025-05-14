import React, { useState, useEffect, useRef } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageLayout from "../components/PageLayout";
import { motion } from "framer-motion";
import { File, Download, Printer, BarChart2, Activity } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import ChartSection from "@/components/reports/ChartSection";
import ProgressSection from "@/components/reports/ProgressSection";
import DiagnosisHistorySection from "@/components/reports/DiagnosisHistorySection";
import PatientSelector from "@/components/reports/PatientSelector";

interface Patient {
  id: string;
  name: string;
}

interface DiagnosticData {
  id: string;
  patientName: string;
  age: number;
  mmseScore: number;
  cdRating: string;
  notes: string;
  timestamp: any;
}

interface ProgressNote {
  id: string;
  patientName: string;
  notes: string;
  status: string;
  timestamp: any;
}

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

const Reports = () => {
  const { currentUser, userData } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData[]>([]);
  const [progressNotes, setProgressNotes] = useState<ProgressNote[]>([]);
  const [diagnosisTests, setDiagnosisTests] = useState<DiagnosisTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartOption, setChartOption] = useState<'mmse' | 'cognitive'>('mmse');
  const [searchTerm, setSearchTerm] = useState("");
  const reportRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
  }, [currentUser, navigate]);

  const fetchPatients = async () => {
    try {
      if (!currentUser) return;

      let patientsData: Patient[] = [];
      
      if (userData?.role === "admin" || userData?.role === "doctor") {
        const querySnapshot = await getDocs(collection(db, "diagnostics"));
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (!patientsData.some(p => p.name === data.patientName)) {
            patientsData.push({ 
              id: doc.id, 
              name: data.patientName 
            });
          }
        });
      } else if (userData?.role === "patient" && currentUser.displayName) {
        patientsData = [{ id: currentUser.uid, name: currentUser.displayName }];
        setSelectedPatient(currentUser.displayName);
      }
      
      setPatients(patientsData);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu bệnh nhân:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách bệnh nhân",
        variant: "destructive",
      });
    }
  };

  const fetchPatientData = async (patientName: string) => {
    try {
      setLoading(true);
      if (!currentUser) return;
      
      if (userData?.role === "patient" && patientName !== currentUser.displayName) {
        toast({
          title: "Lỗi",
          description: "Bạn chỉ có thể xem dữ liệu của chính mình",
          variant: "destructive",
        });
        return;
      }
      
      const diagnosticQuery = query(
        collection(db, "diagnostics"), 
        where("patientName", "==", patientName),
        orderBy("timestamp", "asc")
      );
      
      const diagnosticSnapshot = await getDocs(diagnosticQuery);
      const diagnosticRecords: DiagnosticData[] = [];
      
      diagnosticSnapshot.forEach((doc) => {
        const data = doc.data();
        diagnosticRecords.push({ 
          id: doc.id,
          patientName: data.patientName,
          age: data.age,
          mmseScore: data.mmseScore,
          cdRating: data.cdRating,
          notes: data.notes,
          timestamp: data.timestamp
        });
      });
      
      setDiagnosticData(diagnosticRecords);

      const progressQuery = query(
        collection(db, "progressNotes"), 
        where("patientName", "==", patientName),
        orderBy("timestamp", "asc")
      );
      
      const progressSnapshot = await getDocs(progressQuery);
      const progressData: ProgressNote[] = [];
      
      progressSnapshot.forEach((doc) => {
        const data = doc.data();
        progressData.push({ 
          id: doc.id,
          patientName: data.patientName,
          notes: data.notes,
          status: data.status,
          timestamp: data.timestamp
        });
      });
      
      setProgressNotes(progressData);

      const diagnosisQuery = query(
        collection(db, "diagnosisTests"), 
        where("patientName", "==", patientName),
        orderBy("timestamp", "asc")
      );
      
      const diagnosisSnapshot = await getDocs(diagnosisQuery);
      const diagnosisData: DiagnosisTest[] = [];
      
      diagnosisSnapshot.forEach((doc) => {
        const data = doc.data();
        diagnosisData.push({ 
          id: doc.id,
          patientName: data.patientName,
          patientAge: data.patientAge,
          mmseScore: data.mmseScore,
          cdRating: data.cdRating,
          memoryTest: data.memoryTest,
          orientationTest: data.orientationTest,
          communicationTest: data.communicationTest,
          attentionTest: data.attentionTest,
          visualSpatialTest: data.visualSpatialTest,
          recommendations: data.recommendations,
          doctorNotes: data.doctorNotes,
          timestamp: data.timestamp
        });
      });
      
      setDiagnosisTests(diagnosisData);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu bệnh nhân:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu bệnh nhân",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [currentUser, userData]);

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientData(selectedPatient);
    }
  }, [selectedPatient, currentUser]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePatientSelect = (patientName: string) => {
    setSelectedPatient(patientName);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Lỗi",
        description: "Không thể mở cửa sổ in. Vui lòng kiểm tra cài đặt trình duyệt của bạn.",
        variant: "destructive",
      });
      return;
    }
    
    const content = reportRef.current?.innerHTML || '';
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Báo Cáo Bệnh Nhân - ${selectedPatient}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1, h2, h3 { color: #02646F; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { display: flex; justify-content: space-between; align-items: center; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Báo Cáo Bệnh Nhân - ${selectedPatient}</h1>
            <p>Ngày: ${format(new Date(), 'dd/MM/yyyy')}</p>
          </div>
          ${content}
          <div class="footer">
            <p>© ${new Date().getFullYear()} AlzTracker. Tất cả các quyền được bảo lưu.</p>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleDownloadPDF = async () => {
    if (!selectedPatient) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn bệnh nhân trước khi tải xuống báo cáo.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const pdf = new jsPDF('p', 'pt', 'a4');
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      pdf.setFontSize(18);
      pdf.setTextColor(2, 100, 111); // #02646F
      pdf.text(`Bao Cao Benh Nhan - ${selectedPatient}`, 40, 40);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100); // #646464
      pdf.text(`Ngay: ${format(new Date(), 'dd/MM/yyyy')}`, pageWidth - 150, 40);
      
      let yPosition = 100;
      
      if (chartRef.current && (prepareMMSEChartData().length > 0 || prepareCognitiveChartData().length > 0)) {
        try {
          const canvas = await html2canvas(chartRef.current, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff"
          });
          
          const chartImgData = canvas.toDataURL('image/png');
          
          const chartAspectRatio = canvas.height / canvas.width;
          const chartWidth = pageWidth - 80;
          const chartHeight = chartWidth * chartAspectRatio;
          
          pdf.addImage(chartImgData, 'PNG', 40, yPosition, chartWidth, chartHeight);
          
          yPosition += chartHeight + 30;
        } catch (chartError) {
          console.error("Error capturing chart:", chartError);
          pdf.setTextColor(100, 100, 100); // #646464 for error message
          pdf.text(
            `Bieu do ${chartOption === 'mmse' ? 'Diem MMSE' : 'Danh Gia Nhan Thuc Chi Tiet'} (${
              chartOption === 'mmse' ? prepareMMSEChartData().length : prepareCognitiveChartData().length
            } ket qua)`,
            40,
            yPosition
          );
          yPosition += 30;
        }
      }
      
      if (yPosition > pdf.internal.pageSize.getHeight() - 200) {
        pdf.addPage();
        yPosition = 40;
      }
      
      pdf.setFontSize(14);
      pdf.setTextColor(2, 100, 111); // #02646F
      pdf.text('Tom Tat Tien Trien', 40, yPosition);
      yPosition += 20;
      
      if (progressNotes.length > 0) {
        autoTable(pdf, {
          head: [['Ngay', 'Trang Thai', 'Ghi Chu']],
          body: progressNotes.slice(-5).map((note) => [
            note.timestamp ? format(note.timestamp.toDate(), "dd/MM/yyyy") : "N/A",
            getStatusText(note.status),
            note.notes,
          ]),
          startY: yPosition,
          styles: { 
            fontSize: 9,
            textColor: [50, 50, 50], // Dark gray for better readability
          },
          headStyles: { 
            fillColor: [2, 100, 111], // #02646F
            textColor: [255, 255, 255] 
          },
          alternateRowStyles: { 
            fillColor: [240, 240, 240] 
          },
          margin: { top: 20, right: 40, bottom: 20, left: 40 },
        });
        
        yPosition = (pdf as any).lastAutoTable.finalY + 30;
      }
      
      if (yPosition > pdf.internal.pageSize.getHeight() - 200) {
        pdf.addPage();
        yPosition = 40;
      }
      
      pdf.setFontSize(14);
      pdf.setTextColor(2, 100, 111); // #02646F
      pdf.text('Lich Su Chan Doan', 40, yPosition);
      yPosition += 20;
      
      if (diagnosisTests.length > 0 || diagnosticData.length > 0) {
        autoTable(pdf, {
          head: [['Ngay', 'Danh Gia', 'MMSE', 'CDR']],
          body: [...diagnosticData, ...diagnosisTests]
            .sort((a, b) => {
              const dateA = a.timestamp?.toDate() || new Date(0);
              const dateB = b.timestamp?.toDate() || new Date(0);
              return dateB.getTime() - dateA.getTime();
            })
            .slice(0, 10)
            .map((item) => [
              item.timestamp ? format(item.timestamp.toDate(), "dd/MM/yyyy") : "N/A",
              'memoryTest' in item ? 'Danh Gia Chi Tiet' : 'Chan Doan Co Ban',
              `${item.mmseScore}/30`,
              item.cdRating,
            ]),
          startY: yPosition,
          styles: { 
            fontSize: 9,
            textColor: [50, 50, 50], // Dark gray for better readability
          },
          headStyles: { 
            fillColor: [2, 100, 111], // #02646F
            textColor: [255, 255, 255]
          },
          alternateRowStyles: { 
            fillColor: [240, 240, 240]
          },
          margin: { top: 20, right: 40, bottom: 20, left: 40 },
        });
      }
      
      const pageCount = pdf.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100); // #646464
        const footerText = `© ${new Date().getFullYear()} AlzTracker | Trang ${i} / ${pageCount}`;
        
        const textWidth = footerText.length * 2.5;
        const footerX = (pageWidth - textWidth) / 2;
        
        pdf.text(footerText, footerX, pdf.internal.pageSize.getHeight() - 20);
      }
      
      pdf.save(`AlzTracker_BaoCao_${selectedPatient}_${format(new Date(), 'ddMMyyyy')}.pdf`);
      
      toast({
        title: "Thành công",
        description: "Báo cáo đã được tải xuống thành công!",
      });
    } catch (error) {
      console.error("Lỗi khi tạo PDF:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tạo file PDF. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    }
  };

  const prepareMMSEChartData = () => {
    const combinedData: any[] = [];
    
    diagnosticData.forEach(record => {
      if (record.timestamp) {
        combinedData.push({
          date: record.timestamp.toDate(),
          mmseScore: record.mmseScore,
          source: 'Chuan Doan Co Ban'
        });
      }
    });
    
    diagnosisTests.forEach(test => {
      if (test.timestamp) {
        combinedData.push({
          date: test.timestamp.toDate(),
          mmseScore: test.mmseScore,
          source: 'Danh Gia Chi Tiet'
        });
      }
    });
    
    combinedData.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    return combinedData.map(item => ({
      date: format(item.date, 'dd/MM/yyyy'),
      mmseScore: item.mmseScore,
      source: item.source
    }));
  };

  const prepareCognitiveChartData = () => {
    const chartData = diagnosisTests
      .filter(test => test.timestamp)
      .sort((a, b) => a.timestamp.toDate().getTime() - b.timestamp.toDate().getTime())
      .map(test => ({
        date: format(test.timestamp.toDate(), 'dd/MM/yyyy'),
        memory: test.memoryTest,
        orientation: test.orientationTest,
        communication: test.communicationTest,
        attention: test.attentionTest,
        visualSpatial: test.visualSpatialTest,
        total: test.memoryTest + test.orientationTest + test.communicationTest + 
               test.attentionTest + test.visualSpatialTest
      }));
      
    return chartData;
  };

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  const cardHoverEffect = {
    rest: { scale: 1 },
    hover: { 
      scale: 1.02,
      boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
      transition: { duration: 0.3 }
    }
  };

  return (
    <PageLayout>
      <motion.div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="flex items-center gap-2 mb-8">
          <motion.div 
            className="h-10 w-1 bg-gradient-to-b from-[#02646F] to-[#FFAA67] rounded-full mr-3"
            animate={{ height: [40, 48, 40] }}
            transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
          />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#02646F] to-[#FFAA67] text-transparent bg-clip-text text-focus-in">
            Báo Cáo và Phân Tích
          </h1>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <motion.div 
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Card className="border-none shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-[#02646F] to-[#02646F]/90 text-white">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="h-5 w-5" />
                    <CardTitle>Chọn Bệnh Nhân</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 bg-white/95 backdrop-blur-sm">
                  {userData?.role === "admin" || userData?.role === "doctor" ? (
                    <PatientSelector
                      patients={patients}
                      selectedPatient={selectedPatient}
                      searchTerm={searchTerm}
                      onSearchChange={handleSearchChange}
                      onPatientSelect={handlePatientSelect}
                      currentUser={currentUser}
                    />
                  ) : (
                    <div className="text-center py-4">
                      {currentUser?.displayName && (
                        <motion.div 
                          whileHover={{ scale: 1.03 }}
                          className="p-3 rounded-md bg-gradient-to-r from-[#02646F] to-[#02646F]/90 text-white"
                        >
                          <div className="font-medium">{currentUser.displayName}</div>
                          <div className="text-sm opacity-80 mt-1">
                            Đang xem báo cáo của bạn
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                  
                  {selectedPatient && (
                    <motion.div 
                      className="mt-6 space-y-3"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="font-semibold text-lg">Tùy Chọn Báo Cáo</div>
                      
                      <div>
                        <div className="text-sm mb-2">Loại Biểu Đồ</div>
                        <Select
                          value={chartOption}
                          onValueChange={(value: 'mmse' | 'cognitive') => setChartOption(value)}
                        >
                          <SelectTrigger className="border-[#02646F]/20 focus-visible:ring-[#FFAA67]">
                            <SelectValue placeholder="Chọn loại biểu đồ" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mmse">Điểm MMSE</SelectItem>
                            <SelectItem value="cognitive">Đánh Giá Nhận Thức Chi Tiết</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2 pt-2">
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                          <Button
                            className="w-full flex items-center gap-2 bg-gradient-to-r from-[#02646F] to-[#FFAA67] hover:from-[#FFAA67] hover:to-[#02646F] text-white transition-all duration-300"
                            onClick={handlePrint}
                          >
                            <Printer className="h-4 w-4" />
                            In Báo Cáo
                          </Button>
                        </motion.div>
                        
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                          <Button
                            className="w-full flex items-center gap-2"
                            variant="outline"
                            onClick={handleDownloadPDF}
                          >
                            <Download className="h-4 w-4" />
                            Tải Xuống PDF
                          </Button>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
          
          <motion.div variants={itemVariants} className="lg:col-span-3">
            <motion.div 
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Card className="border-none shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-[#02646F] to-[#02646F]/90 text-white">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    <CardTitle>
                      {selectedPatient 
                        ? `Báo Cáo Bệnh Nhân - ${selectedPatient}` 
                        : "Báo Cáo Bệnh Nhân"
                      }
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 bg-white/95 backdrop-blur-sm">
                  {!selectedPatient ? (
                    <motion.div 
                      className="text-center py-12 text-gray-500"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <File className="h-20 w-20 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg">Vui lòng chọn bệnh nhân từ danh sách để xem báo cáo</p>
                    </motion.div>
                  ) : loading ? (
                    <div className="text-center py-12">
                      <motion.div 
                        className="h-16 w-16 rounded-full border-4 border-[#FFAA67] border-t-transparent mx-auto"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <p className="mt-4 text-gray-500">Đang tải dữ liệu...</p>
                    </div>
                  ) : (
                    <div ref={reportRef} className="space-y-10">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                          <BarChart2 className="h-5 w-5 text-[#02646F]" />
                          <span className="bg-gradient-to-r from-[#02646F] to-[#FFAA67] text-transparent bg-clip-text">
                            Biểu Đồ Theo Dõi
                          </span>
                        </h2>
                        
                        <div ref={chartRef}>
                          <ChartSection 
                            chartOption={chartOption}
                            mmseData={prepareMMSEChartData()}
                            cognitiveData={prepareCognitiveChartData()}
                          />
                        </div>
                      </motion.div>
                      
                      <ProgressSection progressNotes={progressNotes} />
                      
                      <DiagnosisHistorySection 
                        diagnosticData={diagnosticData}
                        diagnosisTests={diagnosisTests}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </PageLayout>
  );
};

export default Reports;
