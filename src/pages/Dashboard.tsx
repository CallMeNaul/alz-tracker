import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, serverTimestamp, query, where, DocumentData } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Brain, CalendarClock, Users, Activity, AlertTriangle } from "lucide-react";
import PageLayout from "../components/PageLayout";
import { useTheme } from "next-themes";
import PatientSelector from "../components/PatientSelector";

interface DiagnosticData {
  id: string;
  patientName: string;
  age: number;
  mmseScore?: number;
  cdRating?: string;
  notes: string;
  timestamp: any;
}

const Dashboard = () => {
  const { currentUser, userData } = useAuth();
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    patientId: "",
    patientName: "",
    age: 0,
    mmseScore: "",
    cdRating: "",
    notes: "",
  });
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const isPatient = userData?.role === "patient";

  const fetchData = async () => {
    try {
      setLoading(true);
      if (!currentUser) return;

      let diagnosticsQuery;
      
      if (isPatient) {
        diagnosticsQuery = query(
          collection(db, "diagnostics"),
          where("patientName", "==", userData?.displayName || "")
        );
      } else {
        diagnosticsQuery = collection(db, "diagnostics");
      }
      
      const querySnapshot = await getDocs(diagnosticsQuery);
      const data: DiagnosticData[] = [];
      
      querySnapshot.forEach((doc) => {
        const docData = doc.data() as DocumentData;
        data.push({ 
          id: doc.id, 
          patientName: docData.patientName,
          age: docData.age,
          mmseScore: docData.mmseScore || 0,
          cdRating: docData.cdRating || "N/A",
          notes: docData.notes,
          timestamp: docData.timestamp,
        });
      });
      
      setDiagnosticData(data);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu chẩn đoán",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser, userData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectPatient = (patientId: string, patientName: string, patientAge: number) => {
    setFormData((prev) => ({
      ...prev,
      patientId,
      patientName,
      age: patientAge
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!currentUser) {
        toast({
          title: "Lỗi Xác Thực",
          description: "Bạn phải đăng nhập để thêm dữ liệu",
          variant: "destructive",
        });
        return;
      }

      const newData = {
        patientName: formData.patientName,
        age: formData.age,
        mmseScore: parseInt(formData.mmseScore),
        cdRating: formData.cdRating,
        notes: formData.notes,
        userId: currentUser.uid,
        timestamp: serverTimestamp(),
      };

      await addDoc(collection(db, "diagnostics"), newData);
      
      toast({
        title: "Thành Công",
        description: "Đã thêm dữ liệu chẩn đoán thành công",
      });
      
      setFormData({
        patientId: "",
        patientName: "",
        age: 0,
        mmseScore: "",
        cdRating: "",
        notes: "",
      });
      
      fetchData();
    } catch (error) {
      console.error("Lỗi khi thêm tài liệu:", error);
      toast({
        title: "Lỗi",
        description: "Không thể thêm dữ liệu chẩn đoán",
        variant: "destructive",
      });
    }
  };

  const ageChartData = Object.entries(diagnosticData.reduce((acc: Record<string, number>, curr) => {
    const ageGroup = Math.floor(curr.age / 10) * 10;
    const key = `${ageGroup}-${ageGroup + 9}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {})).map(([range, count]) => ({
    name: range,
    value: count
  }));

  const mmseChartData = [
    { name: "Bình thường (25-30)", value: diagnosticData.filter(d => (d.mmseScore || 0) >= 25).length },
    { name: "Nhẹ (20-24)", value: diagnosticData.filter(d => (d.mmseScore || 0) >= 20 && (d.mmseScore || 0) < 25).length },
    { name: "Trung bình (10-19)", value: diagnosticData.filter(d => (d.mmseScore || 0) >= 10 && (d.mmseScore || 0) < 20).length },
    { name: "Nặng (0-9)", value: diagnosticData.filter(d => (d.mmseScore || 0) < 10).length }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.4;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    if (percent === 0) return null;
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="#333"
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
      >
        {name} ({(percent * 100).toFixed(0)}%)
      </text>
    );
  };

  const stats = {
    totalPatients: [...new Set(diagnosticData.map(item => item.patientName))].length,
    avgMmseScore: diagnosticData.length > 0 
      ? Math.round(diagnosticData.reduce((acc, curr) => acc + (curr.mmseScore || 0), 0) / diagnosticData.length * 10) / 10 
      : 0,
    highRiskCount: diagnosticData.filter(d => (d.mmseScore || 0) < 20).length,
    latestAssessment: diagnosticData.length > 0 
      ? new Date(diagnosticData[0]?.timestamp?.toDate()).toLocaleDateString('vi-VN') 
      : 'Chưa có'
  };

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#02646f] to-[#ffaa67] bg-clip-text text-transparent inline-block">
            Bảng Điều Khiển Chẩn Đoán Alzheimer
          </h1>
          <p className="text-gray-500 dark:text-gray-300 mt-2">
            {isPatient 
              ? "Xem dữ liệu chẩn đoán của bạn" 
              : "Phân tích và quản lý dữ liệu chẩn đoán bệnh nhân"}
          </p>
        </div>
        
        {!isPatient && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="hover:shadow-lg transition-shadow duration-300 dark:bg-gray-800 bounce-in-top" style={{ animationDelay: '0.1s' }}>
              <CardContent className="flex items-center p-6">
                <div className="rounded-full bg-[#02646f]/10 p-3 mr-4">
                  <Users className="h-6 w-6 text-[#02646f] dark:text-[#17d3ba]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tổng Bệnh Nhân</p>
                  <h3 className="text-2xl font-bold dark:text-white">{stats.totalPatients}</h3>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow duration-300 dark:bg-gray-800 bounce-in-top" style={{ animationDelay: '0.2s' }}>
              <CardContent className="flex items-center p-6">
                <div className="rounded-full bg-[#ffaa67]/10 p-3 mr-4">
                  <Brain className="h-6 w-6 text-[#ffaa67]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Điểm MMSE Trung Bình</p>
                  <h3 className="text-2xl font-bold dark:text-white">{stats.avgMmseScore}</h3>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow duration-300 dark:bg-gray-800 bounce-in-top" style={{ animationDelay: '0.3s' }}>
              <CardContent className="flex items-center p-6">
                <div className="rounded-full bg-red-100 p-3 mr-4">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nguy Cơ Cao</p>
                  <h3 className="text-2xl font-bold dark:text-white">{stats.highRiskCount}</h3>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow duration-300 dark:bg-gray-800 bounce-in-top" style={{ animationDelay: '0.4s' }}>
              <CardContent className="flex items-center p-6">
                <div className="rounded-full bg-purple-100 p-3 mr-4">
                  <CalendarClock className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Đánh Giá Gần Nhất</p>
                  <h3 className="text-xl font-bold dark:text-white">{stats.latestAssessment}</h3>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <Tabs defaultValue={isPatient ? "records" : "overview"} className="w-full">
          <TabsList className="mb-6 w-full md:w-auto">
            {!isPatient && <TabsTrigger value="overview" className="text-sm md:text-base">Tổng Quan</TabsTrigger>}
            {!isPatient && <TabsTrigger value="new-record" className="text-sm md:text-base">Thêm Dữ Liệu Mới</TabsTrigger>}
            <TabsTrigger value="records" className="text-sm md:text-base">Hồ Sơ Chi Tiết</TabsTrigger>
          </TabsList>
          
          {!isPatient && (
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="dark:text-white">Phân Phối Độ Tuổi</CardTitle>
                    <CardDescription className="dark:text-gray-400">Số lượng bệnh nhân theo nhóm tuổi</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={ageChartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#374151" : "#e5e7eb"} />
                        <XAxis dataKey="name" stroke={isDarkMode ? "#9ca3af" : "#6b7280"} />
                        <YAxis stroke={isDarkMode ? "#9ca3af" : "#6b7280"} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: isDarkMode ? "#1f2937" : "#fff",
                            color: isDarkMode ? "#fff" : "#000",
                            border: isDarkMode ? "1px solid #374151" : "1px solid #e5e7eb"
                          }}
                        />
                        <Legend />
                        <Bar dataKey="value" name="Số bệnh nhân" fill="#02646f" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card className="dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="dark:text-white">Phân Loại Theo Điểm MMSE</CardTitle>
                    <CardDescription className="dark:text-gray-400">Mức độ nhận thức của bệnh nhân</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={mmseChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={renderCustomizedLabel}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {mmseChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: isDarkMode ? "#1f2937" : "#fff",
                            color: isDarkMode ? "#fff" : "#000",
                            border: isDarkMode ? "1px solid #374151" : "1px solid #e5e7eb"
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
          
          {!isPatient && (
            <TabsContent value="new-record">
              <Card className="dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="dark:text-white">Thêm Dữ Liệu Chẩn Đoán Mới</CardTitle>
                  <CardDescription className="dark:text-gray-400">Nhập thông tin bệnh nhân và kết quả chẩn đoán</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="patientName" className="dark:text-white">Bệnh Nhân</Label>
                      <PatientSelector 
                        doctorId={currentUser?.uid || ""} 
                        onSelectPatient={handleSelectPatient}
                        value={formData.patientId}
                        className="border-gray-300 focus:border-[#02646f] focus:ring-[#02646f] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="age" className="dark:text-white">Tuổi</Label>
                      <Input
                        id="age"
                        name="age"
                        type="number"
                        value={formData.age || ""}
                        readOnly
                        className="bg-gray-100 border-gray-300 focus:border-[#02646f] focus:ring-[#02646f] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="mmseScore" className="dark:text-white">Điểm MMSE (0-30)</Label>
                      <Input
                        id="mmseScore"
                        name="mmseScore"
                        type="number"
                        min="0"
                        max="30"
                        value={formData.mmseScore}
                        onChange={handleChange}
                        required
                        className="border-gray-300 focus:border-[#02646f] focus:ring-[#02646f] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cdRating" className="dark:text-white">Đánh Giá Sa Sút Trí Tuệ Lâm Sàng</Label>
                      <Input
                        id="cdRating"
                        name="cdRating"
                        placeholder="ví dụ: CDR 0.5, CDR 1"
                        value={formData.cdRating}
                        onChange={handleChange}
                        required
                        className="border-gray-300 focus:border-[#02646f] focus:ring-[#02646f] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notes" className="dark:text-white">Ghi Chú Lâm Sàng</Label>
                      <Input
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        className="border-gray-300 focus:border-[#02646f] focus:ring-[#02646f] dark:border-gray-700 dark:bg-gray-900 dark:text-white min-h-[100px]"
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-[#02646f] to-[#0596a3] hover:from-[#025059] hover:to-[#02646f] transition-all duration-300"
                      disabled={!formData.patientId}
                    >
                      <Activity className="mr-2 h-4 w-4" />
                      Lưu Dữ Liệu Chẩn Đoán
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          )}
          
          <TabsContent value="records">
            <Card className="dark:bg-gray-800 bounce-in-top" style={{ animationDelay: '0.5s' }}>
              <CardHeader>
                <CardTitle className="dark:text-white">Hồ Sơ Chẩn Đoán</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  {isPatient 
                    ? "Dữ liệu chẩn đoán của bạn" 
                    : "Tất cả dữ liệu chẩn đoán bệnh nhân"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#02646f] border-r-transparent dark:border-[#17d3ba] dark:border-r-transparent"></div>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">Đang tải dữ liệu...</p>
                  </div>
                ) : diagnosticData.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50 dark:bg-gray-700 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                    <Brain className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200">Không có dữ liệu</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {isPatient 
                        ? "Không có dữ liệu chẩn đoán cho bạn." 
                        : "Không có dữ liệu chẩn đoán. Thêm bản ghi đầu tiên của bạn."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableCaption>Danh sách hồ sơ chẩn đoán</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="dark:text-gray-300">Tên bệnh nhân</TableHead>
                          <TableHead className="dark:text-gray-300">Tuổi</TableHead>
                          <TableHead className="dark:text-gray-300">Điểm MMSE</TableHead>
                          <TableHead className="dark:text-gray-300">CDR</TableHead>
                          <TableHead className="dark:text-gray-300">Ghi chú</TableHead>
                          <TableHead className="dark:text-gray-300">Ngày</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {diagnosticData.map((item) => (
                          <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <TableCell className="font-medium dark:text-gray-200">{item.patientName}</TableCell>
                            <TableCell className="dark:text-gray-200">{item.age}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                (item.mmseScore || 0) >= 25 
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" 
                                  : (item.mmseScore || 0) >= 20 
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                                  : (item.mmseScore || 0) >= 10
                                  ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                              }`}>
                                {item.mmseScore || 0}/30
                              </span>
                            </TableCell>
                            <TableCell className="dark:text-gray-200">{item.cdRating || "N/A"}</TableCell>
                            <TableCell className="max-w-xs truncate dark:text-gray-200">{item.notes}</TableCell>
                            <TableCell className="dark:text-gray-200">
                              {item.timestamp ? new Date(item.timestamp.toDate()).toLocaleDateString('vi-VN') : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default Dashboard;
