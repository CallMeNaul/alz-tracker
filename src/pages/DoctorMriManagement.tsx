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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100/50 p-6 pt-24">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-[#02646f] to-[#05A3B5] p-4 rounded-2xl text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
              <Brain className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#02646f] to-[#05A3B5] text-focus-in tracking-tight">
                Quản Lý Ảnh MRI Bệnh Nhân
              </h1>
              <p className="text-gray-500 mt-1 text-lg">
                Xem và quản lý kết quả ảnh MRI của bệnh nhân
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Patient Selection Card - Left Side */}
          <div className="col-span-4">
            <Card className="border-2 border-[#02646f]/10 shadow-lg hover:shadow-xl transition-shadow duration-200">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#02646f]/10">
                    <Users className="h-5 w-5 text-[#02646f]" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Chọn Bệnh Nhân</CardTitle>
                    {/* <CardDescription className="text-sm mt-1">
                      Chọn bệnh nhân để xem và quản lý ảnh MRI
                    </CardDescription> */}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
                      <Search className="h-5 w-5 text-[#02646f]" />
                    </div>
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#02646f] to-[#05A3B5] rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-200"></div>
                    <div className="relative">
                      <PatientSelector
                        doctorId={currentUser?.uid || ""}
                        onSelectPatient={(patientId) => setSelectedPatient(patientId)}
                        value={selectedPatient}
                        placeholder="Tìm và chọn bệnh nhân..."
                        className="pl-12 h-12 w-full bg-white rounded-lg border-2 border-[#02646f]/20 hover:border-[#02646f]/40 focus:border-[#02646f] focus:ring-2 focus:ring-[#02646f]/20 transition-all duration-200"
                      />
                    </div>
                  </div>
                  {!selectedPatient && (
                    <div className="text-sm flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 shadow-sm">
                      <div className="p-2 rounded-lg bg-white">
                        <UserRound className="h-5 w-5 text-[#02646f]" />
                      </div>
                      <span className="text-gray-600">Vui lòng chọn bệnh nhân để xem thông tin</span>
                    </div>
                  )}
                  {selectedPatient && (
                    <div className="bg-gradient-to-br from-[#02646f]/5 to-[#05A3B5]/5 rounded-xl p-4 space-y-3 border border-[#02646f]/10">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-[#02646f]/10">
                          <UserRound className="h-4 w-4 text-[#02646f]" />
                        </div>
                        <h3 className="font-medium text-[#02646f]">Thông tin bệnh nhân</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="bg-white/60 p-3 rounded-lg text-center">
                          <span className="text-gray-500 text-sm block mb-1">Số ảnh MRI</span>
                          <span className="text-xl font-semibold text-[#02646f]">{scans.length}</span>
                        </div>
                        <div className="bg-white/60 p-3 rounded-lg text-center">
                          <span className="text-gray-500 text-sm block mb-1">Lần chụp gần nhất</span>
                          <span className="text-sm font-medium text-[#02646f]">
                            {scans[0]?.uploadDate.toLocaleDateString('vi-VN') || 'Chưa có'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* MRI List and Upload - Right Side */}
          <div className="col-span-8">
            {selectedPatient ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 p-1.5 rounded-xl"> {/* bg-[#02646f]/5 */}
                  <TabsTrigger
                    value="view"
                    className="flex items-center justify-center gap-2.5 py-3.5 data-[state=active]:bg-white data-[state=active]:text-[#02646f] data-[state=active]:shadow-md transition-all duration-200 rounded-lg hover:bg-white/50"
                  >
                    <div className="p-1.5 rounded-lg bg-[#02646f]/10">
                      <Database className="h-5 w-5" />
                    </div>
                    <span className="font-medium">Danh sách ảnh MRI</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="upload"
                    className="flex items-center justify-center gap-2.5 py-3.5 data-[state=active]:bg-white data-[state=active]:text-[#02646f] data-[state=active]:shadow-md transition-all duration-200 rounded-lg hover:bg-white/50"
                  >
                    <div className="p-1.5 rounded-lg bg-[#02646f]/10">
                      <Upload className="h-5 w-5" />
                    </div>
                    <span className="font-medium">Tải lên ảnh MRI mới</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="view">
                  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
                    <CardHeader className="bg-gradient-to-r from-[#02646f] to-[#05A3B5] text-white rounded-t-lg p-8">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-white/10">
                            <Database className="h-6 w-6" />
                          </div>
                          <div>
                            <CardTitle className="text-2xl">Danh Sách Ảnh MRI</CardTitle>
                            <CardDescription className="text-white/90 mt-1">
                              Xem các ảnh MRI và kết quả phân tích
                            </CardDescription>
                          </div>
                        </div>
                        <div className="bg-white/20 px-4 py-2 rounded-full text-base">
                          <span className="font-semibold">{scans.length}</span>
                          <span className="ml-1 opacity-90">ảnh</span>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-8">
                      {loading ? (
                        <div className="flex items-center justify-center py-16">
                          <img src="https://i.postimg.cc/jqfHbSsP/black-on-white-removebg-preview.png"
                            alt="Rotating Image"
                            className="w-12 h-12 animate-spin"
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
                  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
                    <CardHeader className="bg-gradient-to-r from-[#02646f] to-[#05A3B5] text-white rounded-t-lg p-8">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/10">
                          <Upload className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl">Tải Lên Ảnh MRI Mới</CardTitle>
                          <CardDescription className="text-white/90 mt-1">
                            Tải lên ảnh MRI mới cho bệnh nhân
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8">
                      <MriUpload onUploadComplete={handleUploadComplete} patientId={selectedPatient} />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="h-full flex items-center justify-center">
                <EmptyStateMessage type="no-patient" />
              </div>
            )}
          </div>
        </div>
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
