import React, { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../contexts/AuthContext";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Navbar from "../components/Navbar";
import MriUpload from "../components/MriUpload";
import PatientSelector from "../components/PatientSelector";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Eye, 
  Download, 
  FileBarChart2, 
  Upload, 
  Database, 
  Calendar, 
  FileType, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Image as ImageIcon,
  XCircle,
  MinusCircle,
  CheckCircle,
  RefreshCw,
  Brain
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
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

const MyMriScans = () => {
  const [scans, setScans] = useState<MriScan[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("scans");
  const [visibleItems, setVisibleItems] = useState<number[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedScan, setSelectedScan] = useState<MriScan | null>(null);
  const [isResultSheetOpen, setIsResultSheetOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string>("");

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (activeTab === "scans") {
      if (userData?.role === "doctor") {
        if (selectedPatient) {
          fetchPatientMriScans(selectedPatient);
        }
      } else {
        fetchMriScans();
      }
    }
  }, [activeTab, refreshTrigger, selectedPatient, userData?.role]);

  const fetchPatientMriScans = async (patientId: string) => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const mriRef = collection(db, "mriScans");
      const q = query(
        mriRef,
        where("userId", "==", patientId),
        orderBy("uploadDate", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const scansData: MriScan[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        scansData.push({
          id: doc.id,
          fileName: data.fileName,
          fileSize: data.fileSize,
          uploadDate: data.uploadDate?.toDate() || new Date(),
          downloadURL: data.downloadURL || "",
          status: data.status,
          mmseScore: data.mmseScore,
          diagnosis: data.diagnosis,
          confidence: data.confidence || 0.75,
        });
      });
      
      setScans(scansData);
      setVisibleItems([]);
    } catch (error) {
      console.error("Error fetching patient MRI scans:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu ảnh MRI của bệnh nhân",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    
    if (userData && userData.role !== "patient" && userData.role !== "doctor") {
      navigate("/dashboard");
    }
  }, [currentUser, userData, navigate]);

  useEffect(() => {
    if (!loading && scans.length > 0) {
      const timer = setTimeout(() => {
        const interval = setInterval(() => {
          setVisibleItems(prev => {
            if (prev.length >= scans.length) {
              clearInterval(interval);
              return prev;
            }
            return [...prev, prev.length];
          });
        }, 100);
        
        return () => clearInterval(interval);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [loading, scans]);

  const fetchMriScans = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const mriRef = collection(db, "mriScans");
      const q = query(
        mriRef,
        where("userId", "==", currentUser.uid),
        orderBy("uploadDate", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const scansData: MriScan[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        scansData.push({
          id: doc.id,
          fileName: data.fileName,
          fileSize: data.fileSize,
          uploadDate: data.uploadDate?.toDate() || new Date(),
          downloadURL: data.downloadURL || "",
          status: data.status,
          mmseScore: data.mmseScore,
          diagnosis: data.diagnosis,
          confidence: data.confidence || 0.75,
        });
      });
      
      setScans(scansData);
      setVisibleItems([]);
    } catch (error) {
      console.error("Error fetching MRI scans:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu ảnh MRI",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshScans = () => {
    setRefreshTrigger(prev => prev + 1);
    toast({
      title: "Đang cập nhật",
      description: "Đang làm mới dữ liệu ảnh MRI",
    });
  };

  const handleUploadComplete = () => {
    setActiveTab("scans");
    setRefreshTrigger(prev => prev + 1);
  };

  const handleViewResult = (scan: MriScan) => {
    setSelectedScan(scan);
    setIsResultSheetOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Đang chờ</span>
          </Badge>
        );
      case "processed":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Đã xử lý</span>
          </Badge>
        );
      case "analyzed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 flex items-center gap-1">
            <FileBarChart2 className="h-3 w-3" />
            <span>Đã phân tích</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            <span>Không xác định</span>
          </Badge>
        );
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + " KB";
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + " MB";
    else return (bytes / 1073741824).toFixed(2) + " GB";
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const navigateToUpload = () => {
    setActiveTab("upload");
  };

  const getDiagnosisLabel = (diagnosis?: "AD" | "MCI" | "CN") => {
    if (!diagnosis) return null;
    
    switch (diagnosis) {
      case "AD":
        return {
          label: "Alzheimer (Bệnh nặng)",
          badge: (
            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              <span>AD - Bệnh nặng</span>
            </Badge>
          )
        };
      case "MCI":
        return {
          label: "Suy giảm nhận thức nhẹ (Giai đoạn đầu)",
          badge: (
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 flex items-center gap-1">
              <MinusCircle className="h-3 w-3" />
              <span>MCI - Giai đoạn đầu</span>
            </Badge>
          )
        };
      case "CN":
        return {
          label: "Bình thường",
          badge: (
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span>CN - Bình thường</span>
            </Badge>
          )
        };
    }
  };

  const getDiagnosisDescription = (diagnosis?: "AD" | "MCI" | "CN") => {
    if (!diagnosis) return "";
    
    switch (diagnosis) {
      case "AD":
        return "Kết quả cho thấy các dấu hiệu của bệnh Alzheimer ở mức độ nặng. Cần tham khảo ý kiến bác sĩ ngay lập tức để được điều trị.";
      case "MCI":
        return "Phát hiện dấu hiệu suy giảm nhận thức nhẹ ở giai đoạn đầu. Cần theo dõi và kiểm tra định kỳ với bác sĩ.";
      case "CN":
        return "Không phát hiện dấu hiệu bất thường. Tiếp tục duy trì lối sống lành mạnh và kiểm tra định kỳ.";
    }
  };

  const getDiagnosisStatusColor = (diagnosis?: "AD" | "MCI" | "CN") => {
    if (!diagnosis) return "bg-gray-100";
    
    switch (diagnosis) {
      case "AD": return "bg-red-50 border-red-200";
      case "MCI": return "bg-yellow-50 border-yellow-200";
      case "CN": return "bg-green-50 border-green-200";
    }
  };

  if (userData && userData.role !== "patient" && userData.role !== "doctor") {
    return null;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-[#02646f] to-[#05A3B5] p-3 rounded-full text-white shadow-lg">
              <ImageIcon className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#02646f] to-[#05A3B5]">
              {userData?.role === "doctor" ? "Ảnh MRI Của Bệnh Nhân" : "Ảnh MRI Của Tôi"}
            </h1>
          </div>
          {userData?.role === "doctor" && (
            <div className="w-72">
              <PatientSelector
                doctorId={currentUser?.uid || ""}
                onSelectPatient={(patientId) => setSelectedPatient(patientId)}
                value={selectedPatient}
                placeholder="Chọn bệnh nhân cần xem"
              />
            </div>
          )}
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs 
            defaultValue="scans" 
            value={activeTab} 
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="mb-6 p-1 bg-gray-100 border border-gray-200 rounded-lg w-full max-w-md mx-auto grid grid-cols-2">
              <TabsTrigger 
                value="scans" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#02646f] data-[state=active]:to-[#05A3B5] data-[state=active]:text-white rounded-md transition-all duration-300 py-2"
              >
                <Database className="mr-2 h-4 w-4" />
                Ảnh Đã Tải Lên
              </TabsTrigger>
              <TabsTrigger 
                value="upload" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#02646f] data-[state=active]:to-[#05A3B5] data-[state=active]:text-white rounded-md transition-all duration-300 py-2"
              >
                <Upload className="mr-2 h-4 w-4" />
                Tải Lên Ảnh Mới
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="scans">
              <Card className="shadow-lg border border-gray-200 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-[#02646f] to-[#05A3B5] text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      <CardTitle>Danh Sách Ảnh MRI Đã Tải Lên</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-white/20 px-3 py-1 rounded-full text-sm flex items-center">
                        <span className="font-medium">{scans.length}</span>
                        <span className="ml-1">ảnh</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={refreshScans}
                        className="bg-white/20 text-white hover:bg-white hover:text-[#02646f] transition-colors"
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Làm mới
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="text-white/80 mt-1">
                    Quản lý và xem các ảnh MRI bạn đã tải lên
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-10 h-10 border-4 border-gray-300 border-t-[#02646F] rounded-full animate-spin"></div>
                    </div>
                  ) : scans.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300"
                    >
                      <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium text-lg mb-4">Bạn chưa tải lên ảnh MRI nào</p>
                      <Button 
                        variant="outline" 
                        onClick={navigateToUpload}
                        className="bg-white hover:bg-[#02646f] hover:text-white border-[#02646f] text-[#02646f] transition-all duration-300"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Tải lên ảnh đầu tiên
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="overflow-hidden">
                      <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[300px]">
                                <div className="flex items-center gap-1">
                                  <FileType className="h-4 w-4 text-[#02646f]" />
                                  <span>Tên File</span>
                                </div>
                              </TableHead>
                              <TableHead>
                                <div className="flex items-center gap-1">
                                  <Database className="h-4 w-4 text-[#02646f]" />
                                  <span>Kích Thước</span>
                                </div>
                              </TableHead>
                              <TableHead>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4 text-[#02646f]" />
                                  <span>Ngày Tải Lên</span>
                                </div>
                              </TableHead>
                              <TableHead>Trạng Thái</TableHead>
                              <TableHead>Thao Tác</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {scans.map((scan, index) => (
                              <motion.tr
                                key={scan.id}
                                variants={itemVariants}
                                custom={index}
                                initial="hidden"
                                animate={visibleItems.includes(index) ? "visible" : "hidden"}
                                className="group hover:bg-gray-50"
                              >
                                <TableCell className="font-medium">{scan.fileName}</TableCell>
                                <TableCell>{formatFileSize(scan.fileSize)}</TableCell>
                                <TableCell>
                                  {format(scan.uploadDate, "dd/MM/yyyy HH:mm", { locale: vi })}
                                </TableCell>
                                <TableCell>{getStatusBadge(scan.status)}</TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    {scan.downloadURL ? (
                                      <>
                                        <Button variant="outline" size="sm" asChild className="border-[#02646f] text-[#02646f] hover:bg-[#02646f] hover:text-white transition-all duration-300">
                                          <a href={scan.downloadURL} target="_blank" rel="noopener noreferrer">
                                            <Eye className="h-4 w-4 mr-1" />
                                            <span>Xem</span>
                                          </a>
                                        </Button>
                                        <Button variant="outline" size="sm" asChild className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition-all duration-300">
                                          <a href={scan.downloadURL} download={scan.fileName}>
                                            <Download className="h-4 w-4 mr-1" />
                                            <span>Tải về</span>
                                          </a>
                                        </Button>
                                      </>
                                    ) : null}
                                    {scan.status === "analyzed" && (
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white transition-all duration-300"
                                        onClick={() => handleViewResult(scan)}
                                      >
                                        <FileBarChart2 className="h-4 w-4 mr-1" />
                                        <span>Kết quả</span>
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </motion.tr>
                            ))}
                          </TableBody>
                        </Table>
                      </motion.div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="upload">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="max-w-xl mx-auto"
              >
                <Card className="shadow-lg border border-gray-200 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-[#02646f] to-[#05A3B5] text-white">
                    <div className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      <CardTitle>Tải Lên Ảnh MRI Mới</CardTitle>
                    </div>
                    <CardDescription className="text-white/80 mt-1">
                      Tải lên ảnh MRI để bác sĩ phân tích và chẩn đoán
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <MriUpload onUploadComplete={handleUploadComplete} />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      <Sheet open={isResultSheetOpen} onOpenChange={setIsResultSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-[#02646f]">Kết quả chẩn đoán</SheetTitle>
            <SheetDescription>
              Thông tin chẩn đoán từ ảnh MRI đã tải lên
            </SheetDescription>
          </SheetHeader>
          
          {selectedScan && (
            <div className="mt-6 space-y-6">
              <div className="text-sm text-gray-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Tên file:</span>
                  <span>{selectedScan.fileName}</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-medium">Ngày tải lên:</span>
                  <span>{format(selectedScan.uploadDate, "dd/MM/yyyy", { locale: vi })}</span>
                </div>
              </div>

              <div className={`border rounded-lg p-5 ${getDiagnosisStatusColor(selectedScan.diagnosis)}`}>
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">
                      {selectedScan.diagnosis && getDiagnosisLabel(selectedScan.diagnosis)?.label}
                    </h3>
                    <Badge variant="secondary" className="ml-2">
                      {Math.round((selectedScan.confidence || 0.75) * 100)}% độ tin cậy
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <span className="font-medium">Điểm MMSE:</span>
                    <Badge variant="outline" className="font-medium">{selectedScan.mmseScore}/30</Badge>
                  </div>
                  
                  <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                    Thời gian phân tích: {format(selectedScan.uploadDate, "HH:mm:ss dd/MM/yyyy", { locale: vi })}
                  </div>
                  
                  <div className={`p-4 rounded-lg mt-2 ${
                    selectedScan.diagnosis === "AD" ? "bg-red-50" : 
                    selectedScan.diagnosis === "MCI" ? "bg-yellow-50" : 
                    "bg-green-50"
                  }`}>
                    <div className="flex gap-3">
                      {selectedScan.diagnosis === "AD" ? (
                        <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      ) : selectedScan.diagnosis === "MCI" ? (
                        <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Brain className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      )}
                      <p className="text-sm">
                        {getDiagnosisDescription(selectedScan.diagnosis)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 text-center">
                <Button 
                  variant="brand"
                  onClick={() => setIsResultSheetOpen(false)}
                  className="w-full"
                >
                  Đóng
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MyMriScans;
