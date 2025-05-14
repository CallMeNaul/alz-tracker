import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, serverTimestamp, query, where, orderBy, DocumentData } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "../components/Navbar";
import { FileText, TrendingUp, TrendingDown, Minus, Clock, User, Plus, Filter } from "lucide-react";
import { motion } from "framer-motion";
import PatientSelector from "../components/PatientSelector";

interface ProgressNote {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  date: Date;
  notes: string;
  status: "improved" | "worsened" | "stable";
  createdBy: string;
  timestamp: any;
}

const formSchema = z.object({
  patientId: z.string().min(1, { message: "Vui lòng chọn bệnh nhân" }),
  notes: z.string().min(10, { message: "Ghi chú cần ít nhất 10 ký tự" }),
  status: z.enum(["improved", "worsened", "stable"], {
    required_error: "Vui lòng chọn trạng thái",
  }),
});

const ProgressNotes = () => {
  const { currentUser, userData } = useAuth();
  const [progressNotes, setProgressNotes] = useState<ProgressNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleItems, setVisibleItems] = useState<number[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [selectedPatientAge, setSelectedPatientAge] = useState<number>(0);
  
  const isPatient = userData?.role === "patient";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: "",
      notes: "",
      status: "stable",
    },
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setVisibleItems(prev => {
          if (prev.length >= progressNotes.length) {
            clearInterval(interval);
            return prev;
          }
          return [...prev, prev.length];
        });
      }, 100);
      
      return () => clearInterval(interval);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [progressNotes]);

  const fetchProgressNotes = async () => {
    try {
      setLoading(true);
      if (!currentUser) return;
      
      let q;
      
      if (isPatient) {
        q = query(
          collection(db, "progressNotes"),
          where("patientName", "==", userData?.displayName || ""),
          orderBy("timestamp", "desc")
        );
      } else {
        q = query(
          collection(db, "progressNotes"), 
          orderBy("timestamp", "desc")
        );
      }
      
      const querySnapshot = await getDocs(q);
      const notesData: ProgressNote[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as DocumentData;
        notesData.push({ 
          id: doc.id,
          patientId: data.patientId,
          patientName: data.patientName,
          patientAge: data.patientAge || 0,
          date: data.timestamp?.toDate() || new Date(),
          notes: data.notes,
          status: data.status,
          createdBy: data.createdBy,
          timestamp: data.timestamp,
        });
      });
      
      setProgressNotes(notesData);
      setVisibleItems([]);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu ghi chú:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu ghi chú tiến triển",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgressNotes();
  }, [currentUser, userData]);

  const handleSelectPatient = (patientId: string, patientName: string, patientAge: number) => {
    form.setValue("patientId", patientId);
    setSelectedPatientAge(patientAge);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (!currentUser) {
        toast({
          title: "Lỗi Xác Thực",
          description: "Bạn phải đăng nhập để thêm dữ liệu",
          variant: "destructive",
        });
        return;
      }

      const patientQuery = query(
        collection(db, "users"),
        where("__name__", "==", values.patientId)
      );
      
      const patientSnapshot = await getDocs(patientQuery);
      
      if (patientSnapshot.empty) {
        toast({
          title: "Lỗi",
          description: "Bệnh nhân không tồn tại",
          variant: "destructive",
        });
        return;
      }

      const patientData = patientSnapshot.docs[0].data();

      const newProgressNote = {
        patientId: values.patientId,
        patientName: patientData.displayName,
        patientAge: selectedPatientAge,
        notes: values.notes,
        status: values.status,
        createdBy: currentUser.email || currentUser.uid,
        userId: currentUser.uid,
        timestamp: serverTimestamp(),
      };

      await addDoc(collection(db, "progressNotes"), newProgressNote);
      
      toast({
        title: "Thành Công",
        description: "Đã thêm ghi chú tiến triển thành công",
      });
      
      form.reset();
      setSelectedPatientAge(0);
      fetchProgressNotes();
    } catch (error) {
      console.error("Lỗi khi thêm ghi chú:", error);
      toast({
        title: "Lỗi",
        description: "Không thể thêm ghi chú tiến triển",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "improved":
        return <TrendingUp className="text-green-500" />;
      case "worsened":
        return <TrendingDown className="text-red-500" />;
      case "stable":
        return <Minus className="text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "improved":
        return "Cải thiện";
      case "worsened":
        return "Xấu đi";
      case "stable":
        return "Ổn định";
      default:
        return "Không xác định";
    }
  };

  const filteredNotes = filter === "all" 
    ? progressNotes 
    : progressNotes.filter(note => note.status === filter);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 mb-8"
        >
          <div className="bg-gradient-to-br from-[#02646f] to-[#05A3B5] p-3 rounded-full text-white shadow-lg">
            <FileText className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#02646f] to-[#05A3B5] text-focus-in">
            Ghi Chép Tiến Triển Bệnh
          </h1>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {!isPatient && (
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-1"
            >
              <motion.div 
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Card className="shadow-lg border border-gray-200 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-[#02646f] to-[#05A3B5] text-white">
                    <div className="flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      <CardTitle>Thêm Ghi Chú Tiến Triển Mới</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 bg-white/95 backdrop-blur-sm">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="patientId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bệnh Nhân</FormLabel>
                              <PatientSelector 
                                doctorId={currentUser?.uid || ""}
                                onSelectPatient={handleSelectPatient}
                                value={field.value}
                                className="border border-gray-300 focus:ring-[#02646f] transition-all"
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {selectedPatientAge > 0 && (
                          <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-600">
                            <span className="font-medium">Tuổi bệnh nhân:</span> {selectedPatientAge}
                          </div>
                        )}
                        
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tình Trạng</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full border border-gray-300 focus:ring-[#02646f] transition-all">
                                    <SelectValue placeholder="Chọn tình trạng" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="improved" className="flex items-center gap-2">
                                    <div className="flex items-center gap-2">
                                      <TrendingUp className="h-4 w-4 text-green-500" />
                                      <span>Cải thiện</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="stable" className="flex items-center gap-2">
                                    <div className="flex items-center gap-2">
                                      <Minus className="h-4 w-4 text-yellow-500" />
                                      <span>Ổn định</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="worsened" className="flex items-center gap-2">
                                    <div className="flex items-center gap-2">
                                      <TrendingDown className="h-4 w-4 text-red-500" />
                                      <span>Xấu đi</span>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ghi Chú</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Nhập ghi chú về tiến triển của bệnh nhân" 
                                  className="min-h-[150px] border border-gray-300 focus:ring-[#02646f] transition-all resize-none" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full bg-gradient-to-r from-[#02646F] to-[#05A3B5] hover:from-[#FFAA67] hover:to-[#FFB980] text-white transition-all duration-300 transform hover:scale-[1.02] shadow-md hover:shadow-lg"
                          disabled={!form.getValues().patientId}
                        >
                          Lưu Ghi Chú Tiến Triển
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
          
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={isPatient ? "lg:col-span-3" : "lg:col-span-2"}
          >
            <Card className="shadow-lg border border-gray-200 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-[#02646f] to-[#05A3B5] text-white pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Lịch Sử Ghi Chú Tiến Triển
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <Select onValueChange={setFilter} defaultValue="all">
                      <SelectTrigger className="bg-white/10 border-white/30 w-[140px] h-8 text-sm">
                        <SelectValue placeholder="Lọc theo trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="improved">Cải thiện</SelectItem>
                        <SelectItem value="stable">Ổn định</SelectItem>
                        <SelectItem value="worsened">Xấu đi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <CardDescription className="text-white/80 mt-1">
                  {filter === "all" 
                    ? "Hiển thị tất cả các ghi chú" 
                    : `Hiển thị ghi chú có trạng thái ${getStatusText(filter)}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-10 h-10 border-4 border-gray-300 border-t-[#02646F] rounded-full animate-spin"></div>
                  </div>
                ) : filteredNotes.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300"
                  >
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium text-lg">
                      {isPatient
                        ? "Không có ghi chú tiến triển nào cho bạn."
                        : "Không có ghi chú tiến triển. Thêm ghi chú đầu tiên của bạn."}
                    </p>
                    <p className="text-gray-400 mt-1">
                      {filter !== "all" && "Thử thay đổi bộ lọc để xem các ghi chú khác."}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div 
                    className="space-y-4"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {filteredNotes.map((note, index) => (
                      <motion.div 
                        key={note.id}
                        variants={itemVariants}
                        custom={index}
                        initial="hidden"
                        animate={visibleItems.includes(index) ? "visible" : "hidden"}
                      >
                        <Card className="overflow-hidden bg-gradient-to-br from-[#02646f] to-[#035863] text-white border-white/20 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01]">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-white/70" />
                                  <h3 className="font-semibold text-lg text-white">{note.patientName}</h3>
                                </div>
                                <p className="text-sm text-white/70 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {note.date && format(note.date, "dd/MM/yyyy HH:mm")}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/10">
                                {getStatusIcon(note.status)}
                                <span className={`text-sm ${
                                  note.status === "improved" ? "text-green-300" : 
                                  note.status === "worsened" ? "text-red-300" : "text-yellow-300"
                                }`}>
                                  {getStatusText(note.status)}
                                </span>
                              </div>
                            </div>
                            <div className="mt-3 bg-white/5 rounded-lg p-3">
                              <p className="text-white/90 whitespace-pre-wrap">{note.notes}</p>
                            </div>
                            <div className="mt-3 text-xs text-white/70 flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Người ghi: {note.createdBy}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProgressNotes;
