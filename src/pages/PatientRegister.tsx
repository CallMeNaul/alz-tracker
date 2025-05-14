import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../services/firebase";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Doctor {
  id: string;
  displayName: string;
}

const PatientRegister = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [isFetchingDoctors, setIsFetchingDoctors] = useState(true);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setFetchError(false);
        setIsFetchingDoctors(true);
        const usersRef = collection(db, "users");
        const doctorQuery = query(usersRef, where("role", "==", "doctor"));
        const snapshot = await getDocs(doctorQuery);
        
        const doctorsList: Doctor[] = [];
        
        snapshot.forEach((doc) => {
          const userData = doc.data();
          doctorsList.push({
            id: doc.id,
            displayName: userData.displayName
          });
        });
        
        setDoctors(doctorsList);
        
        if (doctorsList.length === 0) {
          toast({
            title: "Thông báo",
            description: "Hiện tại chưa có bác sĩ nào trong hệ thống. Vui lòng liên hệ quản trị viên.",
            variant: "default",
          });
        }
      } catch (error) {
        console.error("Error fetching doctors:", error);
        setFetchError(true);
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách bác sĩ. Bạn có thể tiếp tục đăng ký và chọn bác sĩ sau.",
          variant: "destructive",
        });
      } finally {
        setIsFetchingDoctors(false);
      }
    };
    
    fetchDoctors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return toast({
        title: "Mật khẩu không khớp",
        description: "Vui lòng đảm bảo cả hai mật khẩu đều giống nhau",
        variant: "destructive",
      });
    }

    if (!gender) {
      return toast({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn giới tính của bạn",
        variant: "destructive",
      });
    }

    if (!doctorId && !fetchError && doctors.length > 0) {
      return toast({
        title: "Chưa chọn bác sĩ",
        description: "Vui lòng chọn bác sĩ phụ trách",
        variant: "destructive",
      });
    }

    const ageNumber = parseInt(age);
    if (isNaN(ageNumber) || ageNumber < 0 || ageNumber > 120) {
      return toast({
        title: "Tuổi không hợp lệ",
        description: "Vui lòng nhập tuổi từ 0 đến 120",
        variant: "destructive",
      });
    }

    try {
      setLoading(true);
      await register(email, password, name, "patient", doctorId || null, gender as "male" | "female" | "other", ageNumber);
      toast({
        title: "Đăng ký thành công",
        description: "Tài khoản bệnh nhân của bạn đã được tạo!",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Đăng ký thất bại",
        description: error.message || "Đã xảy ra lỗi trong quá trình đăng ký",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-[#02646f]">
            Đăng Ký Tài Khoản Bệnh Nhân
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fetchError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                Không thể tải danh sách bác sĩ. Bạn có thể tiếp tục đăng ký và chọn bác sĩ sau.
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-[#02646f]">
                Họ Tên
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Nguyễn Văn A"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-[#02646f]">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-[#02646f]">
                Mật Khẩu
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-[#02646f]">
                Xác Nhận Mật Khẩu
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="age" className="text-sm font-medium text-[#02646f]">
                Tuổi
              </label>
              <Input
                id="age"
                type="number"
                min="0"
                max="120"
                placeholder="Nhập tuổi của bạn"
                required
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#02646f]">
                Giới Tính
              </label>
              <RadioGroup
                value={gender}
                onValueChange={setGender}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male">Nam</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female">Nữ</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">Khác</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <label htmlFor="doctor" className="text-sm font-medium text-[#02646f]">
                Chọn Bác Sĩ Phụ Trách {(fetchError || doctors.length === 0) && "(Có thể bỏ qua)"}
              </label>
              <Select
                value={doctorId}
                onValueChange={setDoctorId}
                disabled={isFetchingDoctors || doctors.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={isFetchingDoctors ? "Đang tải..." : "Chọn bác sĩ"} />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!isFetchingDoctors && doctors.length === 0 && !fetchError && (
                <p className="text-xs text-amber-600">Chưa có bác sĩ nào trong hệ thống</p>
              )}
              {isFetchingDoctors && (
                <p className="text-xs text-slate-500">Đang tải danh sách bác sĩ...</p>
              )}
            </div>
            <Button
              type="submit"
              variant="brand"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Đang tạo tài khoản..." : "Đăng Ký"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 items-center">
          <div className="text-sm text-center">
            Đã có tài khoản?{" "}
            <Link to="/login" className="font-medium text-[#02646f] hover:text-[#ffaa67] hover:underline">
              Đăng nhập
            </Link>
          </div>
          <div className="text-sm text-center">
            Bạn là bác sĩ?{" "}
            <Link to="/register" className="font-medium text-[#02646f] hover:text-[#ffaa67] hover:underline">
              Đăng ký tài khoản bác sĩ
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PatientRegister;
