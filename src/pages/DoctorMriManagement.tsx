import React, { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../contexts/AuthContext";
import PatientSelector from "../components/PatientSelector";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Brain, Database, Upload, Users, UserRound, Search } from "lucide-react";
import MriScanTable from "@/components/mri/MriScanTable";
import MriScanResultSheet from "@/components/mri/MriScanResultSheet";
import EmptyStateMessage from "@/components/mri/EmptyStateMessage";
import MriUpload from "@/components/MriUpload";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
}

const DoctorMriManagement = () => {
  const [scans, setScans] = useState<MriScan[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [selectedScan, setSelectedScan] = useState<MriScan | null>(null);
  const [isResultSheetOpen, setIsResultSheetOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [activeTab, setActiveTab] = useState("view");

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    if (userData?.role !== "doctor") {
      navigate("/dashboard");
    }
  }, [currentUser, userData, navigate]);

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientMriScans(selectedPatient);
    }
  }, [selectedPatient]);

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
          adPro: data.adProbability,
          cnPro: data.cnProbability,
          status: data.status,
          mmseScore: data.mmseScore,
          diagnosis: data.diagnosis,
          confidence: data.confidence,
        });
      });

      setScans(scansData);
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

  const handleViewResult = (scan: MriScan) => {
    setSelectedScan(scan);
    setIsResultSheetOpen(true);
  };

  const handleUploadComplete = () => {
    if (selectedPatient) {
      fetchPatientMriScans(selectedPatient);
      setActiveTab("view");
      toast({
        title: "Thành công",
        description: "Tải lên ảnh MRI thành công",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6 pt-24">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-[#02646f] to-[#05A3B5] p-3 rounded-full text-white shadow-lg">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#02646f] to-[#05A3B5] text-focus-in">
                Quản Lý Ảnh MRI Bệnh Nhân
              </h1>
              <p className="text-gray-500">
                Xem và quản lý kết quả ảnh MRI của bệnh nhân
              </p>
            </div>
          </div>
        </div>

        <Card className="border-2 border-[#02646f]/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#02646f]" />
              <CardTitle>Chọn Bệnh Nhân</CardTitle>
            </div>
            <CardDescription>
              Chọn bệnh nhân để xem và quản lý ảnh MRI của họ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <PatientSelector
                    doctorId={currentUser?.uid || ""}
                    onSelectPatient={(patientId) => setSelectedPatient(patientId)}
                    value={selectedPatient}
                    placeholder="Tìm và chọn bệnh nhân..."
                  />
                </div>
                {!selectedPatient && (
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <UserRound className="h-4 w-4" />
                    Vui lòng chọn bệnh nhân để xem thông tin
                  </div>
                )}
              </div>
              {selectedPatient && (
                <div className="bg-[#02646f]/5 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-[#02646f]">
                    <UserRound className="h-5 w-5" />
                    <h3 className="font-medium">Thông tin bệnh nhân đã chọn</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Số ảnh MRI:</span>
                      <span className="ml-2 font-medium">{scans.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Lần chụp gần nhất:</span>
                      <span className="ml-2 font-medium">
                        {scans[0]?.uploadDate.toLocaleDateString('vi-VN') || 'Chưa có'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedPatient ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="view" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Danh sách ảnh MRI
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Tải lên ảnh MRI mới
              </TabsTrigger>
            </TabsList>

            <TabsContent value="view">
              <Card>
                <CardHeader className="bg-gradient-to-r from-[#02646f] to-[#05A3B5] text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      <CardTitle>Danh Sách Ảnh MRI</CardTitle>
                    </div>
                    <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
                      <span className="font-medium">{scans.length}</span>
                      <span className="ml-1">ảnh</span>
                    </div>
                  </div>
                  <CardDescription className="text-white/80">
                    Xem các ảnh MRI và kết quả phân tích
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <img src="https://i.postimg.cc/jqfHbSsP/black-on-white-removebg-preview.png"
                        alt="Rotating Image"
                        className="w-10 h-10 animate-spin"
                      />
                    </div>
                  ) : scans.length === 0 ? (
                    <EmptyStateMessage type="no-scans" />
                  ) : (
                    <MriScanTable scans={scans} onViewResult={handleViewResult} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="upload">
              <Card>
                <CardHeader className="bg-gradient-to-r from-[#02646f] to-[#05A3B5] text-white">
                  <div className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    <CardTitle>Tải Lên Ảnh MRI Mới</CardTitle>
                  </div>
                  <CardDescription className="text-white/80">
                    Tải lên ảnh MRI mới cho bệnh nhân
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <MriUpload onUploadComplete={handleUploadComplete} patientId={selectedPatient} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <EmptyStateMessage type="no-patient" />
        )}
      </div>

      <MriScanResultSheet
        scan={selectedScan}
        isOpen={isResultSheetOpen}
        onOpenChange={setIsResultSheetOpen}
      />
    </div>
  );
};

export default DoctorMriManagement;
