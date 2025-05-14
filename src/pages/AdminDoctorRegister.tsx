import React, { useState, FormEvent } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Check, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Navbar from "../components/Navbar";
import { useToast } from "@/hooks/use-toast";

const AdminDoctorRegister = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return toast({
        title: "Mật khẩu không khớp",
        description: "Vui lòng đảm bảo cả hai mật khẩu đều giống nhau",
        variant: "destructive",
      });
    }
    
    try {
      setError("");
      setLoading(true);
      await register(email, password, displayName, "doctor");
      toast({
        title: "Thành công",
        description: "Đã đăng ký tài khoản bác sĩ thành công!",
      });
      navigate("/");
    } catch (error: any) {
      console.error("Đăng ký thất bại:", error);
      if (error.code === "auth/email-already-in-use") {
        setError("Email đã được sử dụng. Vui lòng chọn email khác.");
      } else if (error.code === "auth/invalid-email") {
        setError("Email không hợp lệ.");
      } else if (error.code === "auth/weak-password") {
        setError("Mật khẩu không đủ mạnh. Vui lòng chọn mật khẩu khác.");
      } else {
        setError("Đăng ký thất bại. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Đăng Ký Tài Khoản Bác Sĩ</CardTitle>
            <CardDescription>
              Tạo tài khoản bác sĩ mới cho hệ thống AlzTracker
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Lỗi</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Họ tên</Label>
                <Input
                  id="displayName"
                  placeholder="Nhập họ tên đầy đủ"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Nhập địa chỉ email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Tạo mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Xác nhận mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {loading ? "Đang xử lý..." : "Đăng Ký Bác Sĩ"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-4">
            <p className="text-sm text-gray-500">
              Chỉ Admin mới có quyền tạo tài khoản bác sĩ
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AdminDoctorRegister;
