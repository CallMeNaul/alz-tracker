import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { updateProfile } from "firebase/auth";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Navbar from "../components/Navbar";
import { motion } from "framer-motion";
import { Check, Edit, Save, User, UserCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const Profile = () => {
  const { currentUser, userData } = useAuth();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || "");
  const [loading, setLoading] = useState(false);
  const [bio, setBio] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    try {
      setLoading(true);
      await updateProfile(currentUser, { displayName });
      
      toast({
        title: "Hồ Sơ Đã Cập Nhật",
        description: "Hồ sơ của bạn đã được cập nhật thành công",
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Không thể cập nhật hồ sơ:", error);
      toast({
        title: "Cập Nhật Thất Bại",
        description: "Không thể cập nhật hồ sơ của bạn",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getGenderText = () => {
    if (!userData?.gender) return "Chưa cập nhật";
    const genderMap = {
      male: "Nam",
      female: "Nữ",
      other: "Khác"
    };
    return genderMap[userData.gender];
  };

  const getInitial = () => {
    if (currentUser?.email) {
      return currentUser.email[0].toUpperCase();
    }
    return "U";
  };

  const getRoleText = () => {
    if (!userData) return "Chưa xác định";
    
    if (userData.role === "admin") return "Admin";
    return userData.role === "doctor" ? "Bác Sĩ" : "Bệnh Nhân";
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  const pulseAnimation = {
    scale: [1, 1.02, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatType: "reverse" as const,
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      <motion.div 
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="flex items-center mb-8">
          <motion.div 
            className="h-10 w-1 bg-gradient-to-b from-[#02646F] to-[#FFAA67] rounded-full mr-3"
            animate={{ height: [40, 48, 40] }}
            transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
          />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#02646F] to-[#FFAA67] text-transparent bg-clip-text">
            Hồ Sơ Của Bạn
          </h1>
        </motion.div>
        
        <motion.div 
          className="mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-6"
          variants={itemVariants}
        >
          <motion.div 
            whileHover={pulseAnimation}
            className="relative"
          >
            <Avatar className="h-32 w-32 bg-[#ffaa67] text-white text-4xl ring-4 ring-white shadow-xl">
              <AvatarFallback className="bg-gradient-to-br from-[#02646F] to-[#FFAA67] text-white">
                {getInitial()}
              </AvatarFallback>
            </Avatar>
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  size="icon" 
                  className="absolute bottom-0 right-0 rounded-full bg-white text-[#02646F] hover:text-white shadow-md"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cập Nhật Ảnh Đại Diện</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-sm text-gray-500 mb-4">Tính năng này sẽ sớm được cập nhật</p>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline">Hủy</Button>
                    <Button>Lưu Thay Đổi</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>
          
          <div className="text-center sm:text-left flex-1">
            <motion.div 
              className="bg-white rounded-xl shadow-md p-6"
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <h2 className="text-2xl font-bold text-gray-800">{displayName || "Người Dùng"}</h2>
              <p className="text-gray-500">{currentUser?.email}</p>
              <div className="flex items-center mt-2 justify-center sm:justify-start">
                <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-[#02646F]/10 text-[#02646F]">
                  <UserCircle className="mr-1 h-3 w-3" />
                  {getRoleText()}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  {bio || "Thêm giới thiệu về bản thân bạn..."}
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-none shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-[#02646F] to-[#02646F]/90 text-white">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Thông Tin Hồ Sơ
                </CardTitle>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setIsEditing(!isEditing)} 
                  className="text-white hover:bg-white/20"
                >
                  {isEditing ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Xong
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-1" />
                      Chỉnh Sửa
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="bg-white/80 backdrop-blur-sm p-6">
              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <motion.div 
                  className="space-y-2"
                  initial={{ maxHeight: "60px", overflow: "hidden" }}
                  animate={{ 
                    maxHeight: isEditing ? "1000px" : "60px",
                    overflow: isEditing ? "visible" : "hidden" 
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <Label htmlFor="email" className="text-gray-700">Email</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={currentUser?.email || ""}
                      disabled
                      className="bg-gray-50 border-gray-200"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                      <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Không thể thay đổi</span>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="space-y-2"
                  animate={isEditing ? { scale: [1, 1.02, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <Label htmlFor="displayName" className="text-gray-700">Tên Hiển Thị</Label>
                  <div className="relative">
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      disabled={!isEditing}
                      className={`${!isEditing ? 'bg-gray-50 border-gray-200' : 'border-[#02646F]/50 focus-visible:ring-[#FFAA67]'}`}
                    />
                    {isEditing && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-gray-500 mt-1"
                      >
                        Tên sẽ hiển thị trên hồ sơ và tương tác của bạn
                      </motion.div>
                    )}
                  </div>
                </motion.div>
                
                <motion.div className="space-y-2">
                  <Label htmlFor="gender" className="text-gray-700">Giới tính</Label>
                  <div className="relative">
                    <Input
                      id="gender"
                      value={getGenderText()}
                      disabled
                      className="bg-gray-50 border-gray-200"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                      <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                        Đã xác định khi đăng ký
                      </span>
                    </div>
                  </div>
                </motion.div>

                {userData?.role === "patient" && (
                  <motion.div className="space-y-2">
                    <Label htmlFor="age" className="text-gray-700">Tuổi</Label>
                    <div className="relative">
                      <Input
                        id="age"
                        value={userData?.age || "Chưa cập nhật"}
                        disabled
                        className="bg-gray-50 border-gray-200"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                          Đã xác định khi đăng ký
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {isEditing && (
                  <motion.div 
                    className="space-y-2"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.3 }}
                  >
                    <Label htmlFor="bio" className="text-gray-700">Giới thiệu bản thân</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Thêm giới thiệu ngắn về bản thân bạn"
                      className="min-h-[100px] border-[#02646F]/50 focus-visible:ring-[#FFAA67]"
                    />
                  </motion.div>
                )}
                
                <motion.div className="space-y-2">
                  <Label htmlFor="role" className="text-gray-700">Vai Trò</Label>
                  <div className="relative">
                    <Input
                      id="role"
                      value={getRoleText()}
                      disabled
                      className="bg-gray-50 border-gray-200"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                      <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Không thể thay đổi</span>
                    </div>
                  </div>
                </motion.div>
                
                {isEditing && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="pt-2"
                  >
                    <Button 
                      type="submit" 
                      disabled={loading || !displayName}
                      className="w-full bg-gradient-to-r from-[#02646F] to-[#FFAA67] hover:from-[#FFAA67] hover:to-[#02646F] text-white transition-all duration-300"
                    >
                      {loading ? (
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="mr-2"
                        >
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </motion.div>
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      {loading ? "Đang cập nhật..." : "Lưu Thông Tin"}
                    </Button>
                  </motion.div>
                )}
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Profile;
