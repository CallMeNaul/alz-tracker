
import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, serverTimestamp, query, where, orderBy, DocumentData } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ClipboardCheck, Activity } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import DiagnosisForm from "@/components/diagnosis/DiagnosisForm";
import DiagnosisTable from "@/components/diagnosis/DiagnosisTable";

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

const Diagnosis = () => {
  const { currentUser, userData } = useAuth();
  const [diagnosisTests, setDiagnosisTests] = useState<DiagnosisTest[]>([]);
  const [loading, setLoading] = useState(true);
  
  const isPatient = userData?.role === "patient";

  const fetchDiagnosisTests = async () => {
    try {
      setLoading(true);
      if (!currentUser) return;
      
      let q = query(
        collection(db, "diagnosisTests"),
        isPatient ? where("patientName", "==", userData?.displayName || "") : undefined,
        orderBy("timestamp", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const testsData: DiagnosisTest[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<DiagnosisTest, 'id'>
      }));
      
      setDiagnosisTests(testsData);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu chẩn đoán:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu kiểm tra chẩn đoán",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnosisTests();
  }, [currentUser, userData]);

  const onSubmit = async (values: any) => {
    try {
      if (!currentUser) {
        toast({
          title: "Lỗi Xác Thực",
          description: "Bạn phải đăng nhập để thêm dữ liệu",
          variant: "destructive",
        });
        return;
      }

      const newDiagnosisTest = {
        ...values,
        patientAge: parseInt(values.patientAge),
        mmseScore: parseInt(values.mmseScore),
        memoryTest: parseInt(values.memoryTest),
        orientationTest: parseInt(values.orientationTest),
        communicationTest: parseInt(values.communicationTest),
        attentionTest: parseInt(values.attentionTest),
        visualSpatialTest: parseInt(values.visualSpatialTest),
        userId: currentUser.uid,
        doctorEmail: currentUser.email,
        timestamp: serverTimestamp(),
      };

      await addDoc(collection(db, "diagnosisTests"), newDiagnosisTest);
      
      toast({
        title: "Thành Công",
        description: "Đã thêm kết quả kiểm tra chẩn đoán thành công",
      });
      
      fetchDiagnosisTests();
    } catch (error) {
      console.error("Lỗi khi thêm kết quả kiểm tra:", error);
      toast({
        title: "Lỗi",
        description: "Không thể thêm kết quả kiểm tra chẩn đoán",
        variant: "destructive",
      });
    }
  };

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 mb-8"
        >
          <motion.div 
            className="h-10 w-1 bg-gradient-to-b from-[#02646F] to-[#FFAA67] rounded-full mr-3"
            animate={{ height: [40, 48, 40] }}
            transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
          />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#02646F] to-[#FFAA67] text-transparent bg-clip-text text-focus-in">
            Chẩn Đoán và Đánh Giá
          </h1>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {!isPatient && (
            <motion.div 
              className="lg:col-span-1"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <motion.div 
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Card className="border-none shadow-lg overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-[#02646F] to-[#02646F]/90 text-white">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5" />
                      <CardTitle>Biểu Mẫu Đánh Giá Chẩn Đoán</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 bg-white/95 backdrop-blur-sm">
                    <DiagnosisForm currentUser={currentUser} onSubmit={onSubmit} />
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
          
          <motion.div 
            className={isPatient ? "lg:col-span-3" : "lg:col-span-2"}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <motion.div 
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Card className="border-none shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-[#02646F] to-[#02646F]/90 text-white">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    <CardTitle>Kết Quả Chẩn Đoán</CardTitle>
                    {isPatient && <CardDescription className="text-white/80">Kết quả chẩn đoán của bạn</CardDescription>}
                  </div>
                </CardHeader>
                <CardContent className="p-6 bg-white/95 backdrop-blur-sm">
                  <DiagnosisTable 
                    diagnosisTests={diagnosisTests}
                    loading={loading}
                    isPatient={isPatient}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Diagnosis;

