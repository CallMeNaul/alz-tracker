import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Book, ChevronDown, ChevronUp, Search, Calendar, Activity, FileText, Users, CheckCircle, Loader2, FileX, ClipboardCheck } from "lucide-react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { motion } from "framer-motion";
import PageLayout from "../components/PageLayout";

interface Patient {
  id: string;
  name: string;
  age: number;
}

interface DiagnosticRecord {
  id: string;
  patientName: string;
  age: number;
  mmseScore: number;
  cdRating: string;
  notes: string;
  timestamp: any;
  type: 'diagnostic';
}

interface ProgressNote {
  id: string;
  patientName: string;
  notes: string;
  status: string;
  timestamp: any;
  type: 'progress';
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
  type: 'diagnosis';
}

type MedicalRecord = DiagnosticRecord | ProgressNote | DiagnosisTest;

const MedicalHistory = () => {
  const { currentUser, userData } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRecords, setExpandedRecords] = useState<Record<string, boolean>>({});
  
  const isPatient = userData?.role === "patient";

  const fetchPatients = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "diagnostics"));
      const patientsData: Patient[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (!patientsData.some(p => p.name === data.patientName)) {
          patientsData.push({ 
            id: doc.id, 
            name: data.patientName,
            age: data.age || 0
          });
        }
      });
      
      setPatients(patientsData);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu bệnh nhân:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu bệnh nhân",
        variant: "destructive",
      });
    }
  };

  const fetchMedicalRecords = async (patientName: string) => {
    try {
      setLoading(true);
      if (!currentUser) return;
      
      const diagnosticsQuery = query(
        collection(db, "diagnostics"), 
        where("patientName", "==", patientName),
        orderBy("timestamp", "desc")
      );
      
      const diagnosticsSnapshot = await getDocs(diagnosticsQuery);
      const diagnosticRecords: DiagnosticRecord[] = [];
      
      diagnosticsSnapshot.forEach((doc) => {
        const data = doc.data();
        diagnosticRecords.push({ 
          id: doc.id,
          patientName: data.patientName,
          age: data.age,
          mmseScore: data.mmseScore,
          cdRating: data.cdRating,
          notes: data.notes,
          timestamp: data.timestamp,
          type: 'diagnostic'
        });
      });
      
      const progressQuery = query(
        collection(db, "progressNotes"), 
        where("patientName", "==", patientName),
        orderBy("timestamp", "desc")
      );
      
      const progressSnapshot = await getDocs(progressQuery);
      const progressNotes: ProgressNote[] = [];
      
      progressSnapshot.forEach((doc) => {
        const data = doc.data();
        progressNotes.push({ 
          id: doc.id,
          patientName: data.patientName,
          notes: data.notes,
          status: data.status,
          timestamp: data.timestamp,
          type: 'progress'
        });
      });
      
      const diagnosisQuery = query(
        collection(db, "diagnosisTests"), 
        where("patientName", "==", patientName),
        orderBy("timestamp", "desc")
      );
      
      const diagnosisSnapshot = await getDocs(diagnosisQuery);
      const diagnosisTests: DiagnosisTest[] = [];
      
      diagnosisSnapshot.forEach((doc) => {
        const data = doc.data();
        diagnosisTests.push({ 
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
          timestamp: data.timestamp,
          type: 'diagnosis'
        });
      });
      
      const allRecords: MedicalRecord[] = [
        ...diagnosticRecords, 
        ...progressNotes,
        ...diagnosisTests
      ].sort((a, b) => {
        const dateA = a.timestamp?.toDate() || new Date(0);
        const dateB = b.timestamp?.toDate() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      
      setMedicalRecords(allRecords);
    } catch (error) {
      console.error("Lỗi khi lấy lịch sử bệnh án:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải lịch sử bệnh án",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isPatient) {
      fetchPatients();
    } else if (userData?.displayName) {
      setSelectedPatient(userData.displayName);
    }
  }, [currentUser, userData]);

  useEffect(() => {
    if (selectedPatient) {
      fetchMedicalRecords(selectedPatient);
    } else {
      setMedicalRecords([]);
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

  const toggleExpandRecord = (recordId: string) => {
    setExpandedRecords(prev => ({
      ...prev,
      [recordId]: !prev[recordId]
    }));
  };

  const getRecordTypeLabel = (type: string) => {
    switch (type) {
      case 'diagnostic':
        return 'Chẩn Đoán Cơ Bản';
      case 'progress':
        return 'Ghi Chú Tiến Triển';
      case 'diagnosis':
        return 'Đánh Giá Chi Tiết';
      default:
        return 'Không xác định';
    }
  };

  const getRecordTypeIcon = (type: string) => {
    switch (type) {
      case 'diagnostic':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'progress':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'diagnosis':
        return <ClipboardCheck className="h-4 w-4 text-purple-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const renderRecordDetails = (record: MedicalRecord) => {
    if (record.type === 'diagnostic') {
      const diagnosticRecord = record as DiagnosticRecord;
      return (
        <div className="mt-2 p-4 bg-gradient-to-r from-blue-50 to-white rounded-md text-sm border border-blue-100 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded shadow-sm border border-blue-50">
              <p className="font-medium text-blue-700">MMSE Score:</p>
              <p className="text-lg font-semibold">{diagnosticRecord.mmseScore}/30</p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm border border-blue-50">
              <p className="font-medium text-blue-700">CDR Rating:</p>
              <p className="text-lg font-semibold">{diagnosticRecord.cdRating}</p>
            </div>
          </div>
          {diagnosticRecord.notes && (
            <div className="mt-4 bg-white p-3 rounded shadow-sm border border-blue-50">
              <p className="font-medium text-blue-700">Ghi chú:</p>
              <p className="whitespace-pre-wrap mt-2">{diagnosticRecord.notes}</p>
            </div>
          )}
        </div>
      );
    } else if (record.type === 'progress') {
      const progressNote = record as ProgressNote;
      return (
        <div className="mt-2 p-4 bg-gradient-to-r from-green-50 to-white rounded-md text-sm border border-green-100 shadow-sm">
          <div className="bg-white p-3 rounded shadow-sm border border-green-50">
            <p className="font-medium text-green-700">Trạng thái:</p>
            <p className={
              `text-lg font-semibold ${
              progressNote.status === "improved" ? "text-green-600" : 
              progressNote.status === "worsened" ? "text-red-600" : "text-yellow-600"
              }`
            }>
              {progressNote.status === "improved" ? "Cải thiện" : 
               progressNote.status === "worsened" ? "Xấu đi" : "Ổn định"}
            </p>
          </div>
          <div className="mt-4 bg-white p-3 rounded shadow-sm border border-green-50">
            <p className="font-medium text-green-700">Ghi chú:</p>
            <p className="whitespace-pre-wrap mt-2">{progressNote.notes}</p>
          </div>
        </div>
      );
    } else if (record.type === 'diagnosis') {
      const diagnosisTest = record as DiagnosisTest;
      const totalScore = diagnosisTest.memoryTest + diagnosisTest.orientationTest + 
                         diagnosisTest.communicationTest + diagnosisTest.attentionTest + 
                         diagnosisTest.visualSpatialTest;
      
      return (
        <div className="mt-2 p-4 bg-gradient-to-r from-purple-50 to-white rounded-md text-sm border border-purple-100 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded shadow-sm border border-purple-50">
              <p className="font-medium text-purple-700">MMSE Score:</p>
              <p className="text-lg font-semibold">{diagnosisTest.mmseScore}/30</p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm border border-purple-50">
              <p className="font-medium text-purple-700">CDR Rating:</p>
              <p className="text-lg font-semibold">{diagnosisTest.cdRating}</p>
            </div>
          </div>
          
          <div className="mt-4 bg-white p-3 rounded shadow-sm border border-purple-50">
            <p className="font-medium text-purple-700">Điểm chi tiết các lĩnh vực:</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3">
              <div className="p-2 bg-purple-50 rounded text-center">
                <p className="text-xs text-purple-700 font-medium">Trí Nhớ</p>
                <p className="text-lg font-semibold">{diagnosisTest.memoryTest}/5</p>
              </div>
              <div className="p-2 bg-purple-50 rounded text-center">
                <p className="text-xs text-purple-700 font-medium">Định Hướng</p>
                <p className="text-lg font-semibold">{diagnosisTest.orientationTest}/5</p>
              </div>
              <div className="p-2 bg-purple-50 rounded text-center">
                <p className="text-xs text-purple-700 font-medium">Giao Tiếp</p>
                <p className="text-lg font-semibold">{diagnosisTest.communicationTest}/5</p>
              </div>
              <div className="p-2 bg-purple-50 rounded text-center">
                <p className="text-xs text-purple-700 font-medium">Sự Chú Ý</p>
                <p className="text-lg font-semibold">{diagnosisTest.attentionTest}/5</p>
              </div>
              <div className="p-2 bg-purple-50 rounded text-center">
                <p className="text-xs text-purple-700 font-medium">Thị Giác-Không Gian</p>
                <p className="text-lg font-semibold">{diagnosisTest.visualSpatialTest}/5</p>
              </div>
            </div>
            <div className="mt-3 p-2 bg-purple-100 rounded text-center">
              <span className="font-medium text-purple-800">Tổng Điểm: </span>
              <span className="text-lg font-bold text-purple-900">{totalScore}/25</span>
            </div>
          </div>
          
          {diagnosisTest.recommendations && (
            <div className="mt-4 bg-white p-3 rounded shadow-sm border border-purple-50">
              <p className="font-medium text-purple-700">Khuyến nghị:</p>
              <p className="whitespace-pre-wrap mt-2">{diagnosisTest.recommendations}</p>
            </div>
          )}
          
          {diagnosisTest.doctorNotes && (
            <div className="mt-4 bg-white p-3 rounded shadow-sm border border-purple-50">
              <p className="font-medium text-purple-700">Ghi chú bác sĩ:</p>
              <p className="whitespace-pre-wrap mt-2">{diagnosisTest.doctorNotes}</p>
            </div>
          )}
        </div>
      );
    }
    
    return null;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <PageLayout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="flex items-center gap-2 mb-8">
          <Book className="h-7 w-7 text-[#02646F]" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#02646F] to-[#4D8F97] bg-clip-text text-transparent text-focus-in">
            Lịch Sử Bệnh Lý
          </h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {!isPatient && (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="lg:col-span-1"
            >
              <Card className="overflow-hidden border-none shadow-lg bg-white">
                <CardHeader className="bg-gradient-to-r from-[#02646F] to-[#4D8F97] text-white p-4">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Danh Sách Bệnh Nhân
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Tìm kiếm bệnh nhân..."
                        className="pl-8 border-gray-300 focus:border-[#02646F] focus:ring focus:ring-[#02646F]/20"
                        value={searchTerm}
                        onChange={handleSearchChange}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {filteredPatients.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        Không tìm thấy bệnh nhân
                      </div>
                    ) : (
                      filteredPatients.map((patient, index) => (
                        <motion.div
                          key={patient.id}
                          variants={itemVariants}
                          className={`p-3 rounded-md cursor-pointer transition-all duration-300 ${
                            selectedPatient === patient.name 
                              ? "bg-[#02646F] text-white shadow-md transform scale-105" 
                              : "bg-gray-100 hover:bg-gray-200 hover:scale-[1.02]"
                          }`}
                          onClick={() => handlePatientSelect(patient.name)}
                          whileHover={{ scale: selectedPatient === patient.name ? 1.05 : 1.02 }}
                        >
                          <div className="font-medium">{patient.name}</div>
                          <div className="text-sm opacity-80 flex items-center gap-1">
                            {selectedPatient === patient.name ? (
                              <>
                                <CheckCircle className="h-3 w-3" />
                                <span>Đang xem</span>
                              </>
                            ) : (
                              <>
                                <Calendar className="h-3 w-3" />
                                <span>{patient.age} tuổi</span>
                              </>
                            )}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className={isPatient ? "lg:col-span-4" : "lg:col-span-3"}
          >
            <Card className="overflow-hidden border-none shadow-lg bg-white">
              <CardHeader className="bg-gradient-to-r from-[#02646F] to-[#4D8F97] text-white p-4">
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {selectedPatient 
                    ? `Lịch Sử Bệnh Lý - ${selectedPatient}` 
                    : "Lịch Sử Bệnh Lý"
                  }
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {!selectedPatient ? (
                  <div className="text-center py-8 text-gray-500 flex flex-col items-center">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <FileText className="h-12 w-12 text-gray-400 mb-3" />
                    </motion.div>
                    {isPatient 
                      ? "Đang tải dữ liệu bệnh lý của bạn..."
                      : "Vui lòng chọn bệnh nhân từ danh sách để xem lịch sử bệnh lý"}
                  </div>
                ) : loading ? (
                  <div className="text-center py-8 flex flex-col items-center">
                    <motion.div
                      animate={{ 
                        rotate: 360,
                      }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="h-10 w-10 text-[#02646F]" />
                    </motion.div>
                    <p className="mt-3 text-gray-600">Đang tải dữ liệu...</p>
                  </div>
                ) : medicalRecords.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 flex flex-col items-center">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <FileX className="h-12 w-12 text-gray-400 mb-3" />
                    </motion.div>
                    <p>Không có lịch sử bệnh lý cho bệnh nhân này</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg mb-4 text-[#02646F] border-b border-gray-200 pb-2">
                      Lịch Sử Thăm Khám
                    </h3>
                    <div className="overflow-hidden rounded-lg border border-gray-200">
                      <Table>
                        <TableHeader className="bg-gray-50">
                          <TableRow>
                            <TableHead className="font-medium text-[#02646F]">Ngày</TableHead>
                            <TableHead className="font-medium text-[#02646F]">Loại</TableHead>
                            <TableHead className="font-medium text-[#02646F]">Chi Tiết</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {medicalRecords.map((record, index) => (
                            <React.Fragment key={record.id}>
                              <motion.tr
                                variants={itemVariants}
                                className={`cursor-pointer group ${
                                  expandedRecords[record.id] ? "bg-gray-50" : "hover:bg-gray-50"
                                }`}
                                onClick={() => toggleExpandRecord(record.id)}
                              >
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-500" />
                                    {record.timestamp ? 
                                      format(record.timestamp.toDate(), "dd/MM/yyyy HH:mm") 
                                      : "N/A"}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {getRecordTypeIcon(record.type)}
                                    <span>{getRecordTypeLabel(record.type)}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="text-[#02646F] group-hover:bg-[#02646F]/10"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleExpandRecord(record.id);
                                    }}
                                  >
                                    {expandedRecords[record.id] ? 
                                      <ChevronUp className="h-4 w-4 mr-1" /> : 
                                      <ChevronDown className="h-4 w-4 mr-1" />
                                    }
                                    <span>
                                      {expandedRecords[record.id] ? "Thu gọn" : "Xem chi tiết"}
                                    </span>
                                  </Button>
                                </TableCell>
                              </motion.tr>
                              {expandedRecords[record.id] && (
                                <TableRow>
                                  <TableCell colSpan={3} className="p-0">
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.3 }}
                                    >
                                      {renderRecordDetails(record)}
                                    </motion.div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </PageLayout>
  );
};

export default MedicalHistory;
