import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { auth } from "../services/firebase";

const ChangePassword = () => {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { currentUser } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmNewPassword) {
            return toast({
                title: "Mật khẩu không khớp",
                description: "Mật khẩu mới và xác nhận mật khẩu phải giống nhau",
                variant: "destructive",
            });
        }

        if (newPassword.length < 6) {
            return toast({
                title: "Mật khẩu quá ngắn",
                description: "Mật khẩu phải có ít nhất 6 ký tự",
                variant: "destructive",
            });
        }

        try {
            setLoading(true);

            // Xác thực lại người dùng với mật khẩu hiện tại
            const credential = EmailAuthProvider.credential(
                currentUser?.email || '',
                currentPassword
            );
            await reauthenticateWithCredential(currentUser!, credential);

            // Cập nhật mật khẩu mới
            await updatePassword(currentUser!, newPassword);

            toast({
                title: "Thành công",
                description: "Mật khẩu đã được thay đổi",
            });

            // Reset form
            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
        } catch (error: any) {
            let errorMessage = "Đã xảy ra lỗi khi thay đổi mật khẩu";
            if (error.code === 'auth/wrong-password') {
                errorMessage = "Mật khẩu hiện tại không đúng";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "Mật khẩu mới quá yếu";
            } else if (error.code === 'auth/requires-recent-login') {
                errorMessage = "Vui lòng đăng nhập lại để thay đổi mật khẩu";
            }

            toast({
                title: "Lỗi",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-center text-[#02646f]">
                    Đổi Mật Khẩu
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="currentPassword" className="text-sm font-medium text-[#02646f]">
                            Mật Khẩu Hiện Tại
                        </label>
                        <div className="relative">
                            <Input
                                id="currentPassword"
                                type={showCurrentPassword ? "text" : "password"}
                                placeholder="••••••••"
                                required
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            >
                                {showCurrentPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="newPassword" className="text-sm font-medium text-[#02646f]">
                            Mật Khẩu Mới
                        </label>
                        <div className="relative">
                            <Input
                                id="newPassword"
                                type={showNewPassword ? "text" : "password"}
                                placeholder="••••••••"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            >
                                {showNewPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="confirmNewPassword" className="text-sm font-medium text-[#02646f]">
                            Xác Nhận Mật Khẩu Mới
                        </label>
                        <div className="relative">
                            <Input
                                id="confirmNewPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="••••••••"
                                required
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                        className="w-full"
                        disabled={loading}
                    >
                        {loading ? "Đang xử lý..." : "Đổi Mật Khẩu"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default ChangePassword; 