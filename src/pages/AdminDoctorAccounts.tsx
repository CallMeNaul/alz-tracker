
import React, { useState, useEffect } from 'react';
import { useAuth } from "../contexts/AuthContext";
import { db } from "../services/firebase";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { Shield, Trash2, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";

interface DoctorData {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  createdAt: string;
}

const AdminDoctorAccounts = () => {
  const { isAdmin } = useAuth();
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const q = query(collection(db, "users"), where("role", "==", "doctor"));
      const querySnapshot = await getDocs(q);
      const doctorsData: DoctorData[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        doctorsData.push({
          uid: doc.id,
          displayName: data.displayName,
          email: data.email || 'N/A',
          role: data.role,
          createdAt: data.createdAt || 'N/A'
        });
      });
      
      setDoctors(doctorsData);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách bác sĩ.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDoctor = async (uid: string) => {
    try {
      await deleteDoc(doc(db, "users", uid));
      setDoctors(doctors.filter(doctor => doctor.uid !== uid));
      toast({
        title: "Thành công",
        description: "Đã xóa tài khoản bác sĩ.",
      });
    } catch (error) {
      console.error("Error deleting doctor:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa tài khoản bác sĩ.",
        variant: "destructive",
      });
    }
  };

  if (!isAdmin()) {
    return <div>Bạn không có quyền truy cập trang này.</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center gap-4 mb-8">
        <Shield className="h-8 w-8 text-[#02646f]" />
        <h1 className="text-2xl font-bold text-focus-in">Quản Lý Tài Khoản Bác Sĩ</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Họ Tên</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Ngày Tạo</TableHead>
              <TableHead className="text-right">Thao Tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {doctors.map((doctor) => (
              <TableRow key={doctor.uid}>
                <TableCell className="font-medium">{doctor.displayName}</TableCell>
                <TableCell>{doctor.email}</TableCell>
                <TableCell>{doctor.createdAt}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => console.log("View doctor:", doctor.uid)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Xác nhận xóa tài khoản</AlertDialogTitle>
                          <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa tài khoản bác sĩ này? Hành động này không thể hoàn tác.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteDoctor(doctor.uid)}
                          >
                            Xóa
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminDoctorAccounts;
