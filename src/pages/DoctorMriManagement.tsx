import React, { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../contexts/AuthContext";
import PatientSelector from "../components/PatientSelector";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Brain, Database } from "lucide-react";
import MriScanTable from "@/components/mri/MriScanTable";
import MriScanResultSheet from "@/components/mri/MriScanResultSheet";
import EmptyStateMessage from "@/components/mri/EmptyStateMessage";

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

const DoctorMriManagement = () => {
  const [scans, setScans] = useState<MriScan[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [selectedScan, setSelectedScan] = useState<MriScan | null>(null);
  const [isResultSheetOpen, setIsResultSheetOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string>("");

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
          downloadURL: data.downloadURL || "",
          status: data.status,
          mmseScore: data.mmseScore,
          diagnosis: data.diagnosis,
          confidence: data.confidence || 0.75,
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6 pt-24">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
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
          <div className="w-72">
            <PatientSelector
              doctorId={currentUser?.uid || ""}
              onSelectPatient={(patientId) => setSelectedPatient(patientId)}
              value={selectedPatient}
              placeholder="Chọn bệnh nhân cần xem"
            />
          </div>
        </div>

        <Card className="shadow-lg border border-gray-200">
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
            ) : !selectedPatient ? (
              <EmptyStateMessage type="no-patient" />
            ) : scans.length === 0 ? (
              <EmptyStateMessage type="no-scans" />
            ) : (
              <MriScanTable scans={scans} onViewResult={handleViewResult} />
            )}
          </CardContent>
        </Card>
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
