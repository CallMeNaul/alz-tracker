import React, { useState, useEffect } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { storage, db } from "../services/firebase";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Upload, FileUp, Brain, Activity, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UserProfile {
  age: number;
  gender: string;
  // ... other user profile fields
}

interface MriUploadProps {
  onUploadComplete?: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_DIAGNOSING_API_URL || "http://localhost:8000/predict/";

const MriUpload = ({ onUploadComplete }: MriUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mmseScore, setMmseScore] = useState<number | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [diagnosisResult, setDiagnosisResult] = useState<{
    status: "success" | "warning" | "error";
    diagnosis: "AD" | "MCI" | "CN" | null;
    confidence: number;
    uploadTime: Date | null;
    cnProbability?: number;
    adProbability?: number;
  } | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        } else {
          toast({
            title: "Thiếu thông tin",
            description: "Vui lòng cập nhật thông tin cá nhân trong hồ sơ của bạn",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin người dùng",
          variant: "destructive",
        });
      }

      setLoading(false);
    };

    fetchUserProfile();
  }, [currentUser]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'nii' || (fileExtension === 'gz' && selectedFile.name.endsWith('.nii.gz'))) {
        setFile(selectedFile);
      } else {
        toast({
          title: "Định dạng file không hỗ trợ",
          description: "Vui lòng tải lên file MRI có đuôi .nii hoặc .nii.gz",
          variant: "destructive",
        });
        e.target.value = '';
      }
    }
  };

  const generateRandomMmseScore = (): number => {
    // Generate a score between 21 and 29 (inclusive)
    return Math.floor(Math.random() * 9) + 21;
  };

  const getDiagnosisFromMmse = (score: number): "AD (Alzheimer's Disease)" | "MCI" | "CN" => {
    if (score >= 21 && score <= 23) {
      return "AD (Alzheimer's Disease)"; // Alzheimer's Disease
    } else if (score >= 24 && score <= 26) {
      return "MCI"; // Mild Cognitive Impairment
    } else {
      return "CN (Normal)"; // Cognitively Normal
    }
  };

  const getStatusFromDiagnosis = (diagnosis: "AD (Alzheimer's Disease)" | "MCI" | "CN (Normal)"): "error" | "warning" | "success" => {
    switch (diagnosis) {
      case "AD (Alzheimer's Disease)": return "error";
      case "MCI": return "warning";
      case "CN (Normal)": return "success";
    }
  };

  const predictAlzheimer = async (file: File, age: number, gender: number) => {
    const formData = new FormData();
    formData.append('mri_file', file);
    formData.append('age', age.toString());
    formData.append('gender', gender.toString());

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Prediction error:', error);
      throw error;
    }
  };

  const handleUpload = async () => {
    if (!file || !currentUser || !userProfile) {
      toast({
        title: "Thiếu thông tin",
        description: !userProfile
          ? "Vui lòng cập nhật thông tin cá nhân trong hồ sơ của bạn trước khi tải lên ảnh MRI"
          : "Vui lòng chọn file ảnh MRI",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      // Call prediction API with user profile data
      const predictionResult = await predictAlzheimer(
        file,
        userProfile.age,
        userProfile.gender === "male" ? 1 : 0
      );

      const diagnosis = predictionResult.class_name as "AD" | "MCI" | "CN";
      const status = getStatusFromDiagnosis(diagnosis);
      const confidence = Math.max(predictionResult.cn_probability, predictionResult.ad_probability) / 100;
      const uploadTime = new Date();

      setMmseScore(Math.round(predictionResult.predicted_mmse));

      setDiagnosisResult({
        status,
        diagnosis,
        confidence,
        uploadTime,
        cnProbability: predictionResult.cn_probability,
        adProbability: predictionResult.ad_probability
      });

      await setDoc(doc(db, "mriScans", `${currentUser.uid}_${Date.now()}`), {
        userId: currentUser.uid,
        fileName: file.name,
        fileSize: file.size,
        uploadDate: serverTimestamp(),
        mmseScore: predictionResult.predicted_mmse,
        status: "analyzed",
        diagnosis,
        confidence,
        age: userProfile.age,
        gender: userProfile.gender,
        cnProbability: predictionResult.cn_probability,
        adProbability: predictionResult.ad_probability
      });

      toast({
        title: "Phân tích thành công",
        description: "Thông tin chẩn đoán của bạn đã được lưu thành công",
      });

      setUploading(false);
      setProgress(0);

    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Phân tích thất bại",
        description: "Đã xảy ra lỗi khi phân tích ảnh MRI",
        variant: "destructive",
      });
      setUploading(false);
    }
  };

  const getDiagnosisLabel = (diagnosis: "AD (Alzheimer's Disease)" | "MCI" | "CN (Normal)") => {
    switch (diagnosis) {
      case "AD (Alzheimer's Disease)":
        return "Alzheimer (Bệnh nặng)";
      case "MCI":
        return "Suy giảm nhận thức nhẹ (Giai đoạn đầu)";
      case "CN (Normal)":
        return "Bình thường";
    }
  };

  const getDiagnosisDescription = (diagnosis: "AD (Alzheimer's Disease)" | "MCI" | "CN (Normal)") => {
    switch (diagnosis) {
      case "AD (Alzheimer's Disease)":
        return "Kết quả cho thấy các dấu hiệu của bệnh Alzheimer ở mức độ nặng. Cần tham khảo ý kiến bác sĩ ngay lập tức để được điều trị.";
      case "MCI":
        return "Phát hiện dấu hiệu suy giảm nhận thức nhẹ ở giai đoạn đầu. Cần theo dõi và kiểm tra định kỳ với bác sĩ.";
      case "CN (Normal)":
        return "Không phát hiện dấu hiệu bất thường. Tiếp tục duy trì lối sống lành mạnh và kiểm tra định kỳ.";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-[#02646f]">
          Tải Lên và Phân Tích Ảnh MRI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="text-center text-gray-500">Đang tải thông tin...</div>
        ) : !userProfile ? (
          <div className="text-center text-red-500">
            Vui lòng cập nhật thông tin cá nhân trong hồ sơ của bạn trước khi tải lên ảnh MRI
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">Tuổi</div>
                <div className="font-medium">{userProfile.age}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">Giới tính</div>
                <div className="font-medium">{userProfile.gender === "male" ? "Nam" : "Nữ"}</div>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#02646f] transition-colors">
              <input
                id="mri-file"
                type="file"
                accept=".nii,.nii.gz"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
              <label
                htmlFor="mri-file"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <FileUp className="h-12 w-12 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500 mb-1">Kéo thả file hoặc nhấp để tải lên</span>
                <span className="text-xs text-gray-400">Hỗ trợ các định dạng ảnh phổ biến</span>
              </label>
            </div>

            {file && (
              <div className="border rounded-lg p-3 bg-gray-50">
                <p className="font-medium text-sm truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                {file.type.startsWith('image/') && (
                  <div className="mt-2">
                    <img
                      src={URL.createObjectURL(file)}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded-lg"
                    />
                  </div>
                )}
              </div>
            )}

            {uploading && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-xs text-center text-gray-500">{Math.round(progress)}% hoàn thành</p>
              </div>
            )}

            {diagnosisResult && (
              <Card className={`border ${diagnosisResult.status === "success" ? "border-green-200 bg-green-50" :
                diagnosisResult.status === "warning" ? "border-yellow-200 bg-yellow-50" :
                  "border-red-200 bg-red-50"
                } p-4`}>
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-full ${diagnosisResult.status === "success" ? "bg-green-100" :
                    diagnosisResult.status === "warning" ? "bg-yellow-100" :
                      "bg-red-100"
                    }`}>
                    {diagnosisResult.status === "success" ? (
                      <Brain className="h-6 w-6 text-green-600" />
                    ) : diagnosisResult.status === "warning" ? (
                      <AlertTriangle className="h-6 w-6 text-yellow-600" />
                    ) : (
                      <Activity className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">
                          {diagnosisResult.diagnosis && getDiagnosisLabel(diagnosisResult.diagnosis)}
                        </h3>
                        <Badge variant="secondary" className="ml-2">
                          {Math.round(diagnosisResult.confidence * 100)}% độ tin cậy
                        </Badge>
                      </div>

                      {mmseScore && (
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-medium">Điểm MMSE:</span>
                          <Badge variant="outline" className="font-medium">{mmseScore}/30</Badge>
                        </div>
                      )}

                      {diagnosisResult.uploadTime && (
                        <div className="text-xs text-gray-500 mt-1">
                          Thời gian phân tích: {diagnosisResult.uploadTime.toLocaleString('vi-VN')}
                        </div>
                      )}

                      <h3 className="text-sm text-gray-600 mt-2">
                        {diagnosisResult.diagnosis && getDiagnosisDescription(diagnosisResult.diagnosis)}
                      </h3>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <Button
              variant="brand"
              className="w-full"
              disabled={!file || uploading}
              onClick={handleUpload}
            >
              {uploading ? (
                <span className="flex items-center">
                  <Upload className="animate-pulse mr-2 h-4 w-4" /> Đang tải lên...
                </span>
              ) : (
                <span className="flex items-center">
                  <Upload className="mr-2 h-4 w-4" /> Tải lên và phân tích
                </span>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MriUpload;
