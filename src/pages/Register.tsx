
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [adminExists, setAdminExists] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminExists = async () => {
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("role", "==", "admin"));
        const querySnapshot = await getDocs(q);
        setAdminExists(!querySnapshot.empty);
      } catch (error) {
        console.error("Error checking admin existence:", error);
      }
    };

    checkAdminExists();
  }, []);

  useEffect(() => {
    const createAdminIfNotExists = async () => {
      if (!adminExists) {
        try {
          // Create the default admin account
          await register(
            "alzadmin@gmail.com",
            "alzheimersdatahub",
            "Administrator",
            "admin"
          );
          
          toast({
            title: "Tài khoản Admin được tạo",
            description: "Tài khoản admin mặc định đã được tạo thành công!",
          });
          
          setAdminExists(true);
        } catch (error: any) {
          // Only log the error but don't show it to users
          console.error("Error creating admin account:", error);
        }
      }
    };
    
    createAdminIfNotExists();
  }, [adminExists, register]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: "Không thể đăng ký",
      description: "Không thể đăng ký tài khoản bác sĩ trực tiếp. Vui lòng liên hệ với quản trị viên để được cấp tài khoản.",
      variant: "destructive",
    });
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
            Đăng Ký Tài Khoản Bác Sĩ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 text-sm">
              Chỉ quản trị viên mới có thể tạo tài khoản bác sĩ. Vui lòng liên hệ với quản trị viên hệ thống để được cấp tài khoản.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-[#02646f]">
                Họ Tên
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Bác sĩ Nguyễn Văn A"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-[#02646f]">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="doctor@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled
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
                  disabled
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
                  disabled
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
            <Button
              type="submit"
              variant="brand"
              className="w-full cursor-not-allowed" //bg-gray-400 hover:bg-gray-500
              disabled
            >
              Đăng Ký Tài Khoản Bác Sĩ
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
            Bạn là bệnh nhân?{" "}
            <Link to="/patient-register" className="font-medium text-[#02646f] hover:text-[#ffaa67] hover:underline">
              Đăng ký tài khoản bệnh nhân
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;
