import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, where, orderBy, DocumentData } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Bell, Calendar, Clock, Trash2, Plus, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import PageLayout from "../components/PageLayout";
import PatientSelector from "../components/PatientSelector";

interface Reminder {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  title: string;
  description: string;
  date: string;
  time: string;
  type: string;
  sendEmail: boolean;
  createdBy: string;
  timestamp: any;
}

const reminderSchema = z.object({
  patientId: z.string().min(1, { message: "Vui lòng chọn bệnh nhân" }),
  title: z.string().min(3, { message: "Tiêu đề phải có ít nhất 3 ký tự" }),
  description: z.string(),
  date: z.string().min(1, { message: "Ngày là bắt buộc" }),
  time: z.string().min(1, { message: "Thời gian là bắt buộc" }),
  type: z.enum(["appointment", "medication", "other"], {
    required_error: "Loại nhắc nhở là bắt buộc",
  }),
  sendEmail: z.boolean().default(false),
});

const Reminders = () => {
  const { currentUser, userData } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatientAge, setSelectedPatientAge] = useState<number>(0);
  const [selectedPatientEmail, setSelectedPatientEmail] = useState<string>("");
  
  const isPatient = userData?.role === "patient";

  const form = useForm<z.infer<typeof reminderSchema>>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      patientId: "",
      title: "",
      description: "",
      date: new Date().toISOString().split('T')[0], // Today's date
      time: "09:00",
      type: "appointment",
      sendEmail: false,
    },
  });

  const fetchReminders = async () => {
    try {
      setLoading(true);
      if (!currentUser) return;
      
      let remindersQuery;
      
      if (isPatient) {
        remindersQuery = query(
          collection(db, "reminders"),
          where("patientName", "==", userData?.displayName || ""),
          orderBy("date", "asc"),
          orderBy("time", "asc")
        );
      } else {
        remindersQuery = query(
          collection(db, "reminders"),
          where("userId", "==", currentUser.uid),
          orderBy("date", "asc"),
          orderBy("time", "asc")
        );
      }
      
      const querySnapshot = await getDocs(remindersQuery);
      const remindersData: Reminder[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as DocumentData;
        remindersData.push({ 
          id: doc.id,
          patientId: data.patientId || "",
          patientName: data.patientName,
          patientAge: data.patientAge || 0,
          title: data.title,
          description: data.description,
          date: data.date,
          time: data.time,
          type: data.type,
          sendEmail: data.sendEmail || false,
          createdBy: data.createdBy,
          timestamp: data.timestamp,
        });
      });
      
      setReminders(remindersData);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu nhắc nhở:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu nhắc nhở",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [currentUser, userData]);

  const handleSelectPatient = async (patientId: string, patientName: string, patientAge: number) => {
    form.setValue("patientId", patientId);
    setSelectedPatientAge(patientAge);
    
    // Get patient email
    try {
      const userDoc = await getDocs(query(collection(db, "users"), where("__name__", "==", patientId)));
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        setSelectedPatientEmail(userData.email || "");
      }
    } catch (error) {
      console.error("Error fetching patient email:", error);
      setSelectedPatientEmail("");
    }
  };

  const onSubmit = async (values: z.infer<typeof reminderSchema>) => {
    try {
      if (!currentUser) {
        toast({
          title: "Lỗi Xác Thực",
          description: "Bạn phải đăng nhập để thêm nhắc nhở",
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

      const newReminder = {
        patientId: values.patientId,
        patientName: patientData.displayName,
        patientAge: selectedPatientAge,
        title: values.title,
        description: values.description,
        date: values.date,
        time: values.time,
        type: values.type,
        sendEmail: values.sendEmail,
        patientEmail: patientData.email || "",
        createdBy: currentUser.email || currentUser.uid,
        userId: currentUser.uid,
        timestamp: serverTimestamp(),
      };

      await addDoc(collection(db, "reminders"), newReminder);
      
      const emailMsg = values.sendEmail ? " và đã gửi thông báo đến email bệnh nhân" : "";
      toast({
        title: "Thành Công",
        description: `Đã thêm nhắc nhở mới${emailMsg}`,
      });
      
      form.reset({
        patientId: "",
        title: "",
        description: "",
        date: new Date().toISOString().split('T')[0],
        time: "09:00",
        type: "appointment",
        sendEmail: false,
      });
      setSelectedPatientAge(0);
      setSelectedPatientEmail("");
      
      fetchReminders();
    } catch (error) {
      console.error("Lỗi khi thêm nhắc nhở:", error);
      toast({
        title: "Lỗi",
        description: "Không thể thêm nhắc nhở",
        variant: "destructive",
      });
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      await deleteDoc(doc(db, "reminders", id));
      
      toast({
        title: "Đã Xóa",
        description: "Nhắc nhở đã được xóa thành công",
      });
      
      setReminders(reminders.filter(reminder => reminder.id !== id));
    } catch (error) {
      console.error("Lỗi khi xóa nhắc nhở:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa nhắc nhở",
        variant: "destructive",
      });
    }
  };

  const getReminderTypeLabel = (type: string) => {
    switch (type) {
      case "appointment":
        return "Cuộc Hẹn";
      case "medication":
        return "Thuốc";
      case "other":
        return "Khác";
      default:
        return "Không xác định";
    }
  };

  const getReminderIconByType = (type: string) => {
    switch (type) {
      case "appointment":
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case "medication":
        return <Clock className="h-5 w-5 text-green-500" />;
      case "other":
        return <Bell className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const isReminderToday = (date: string) => {
    const today = new Date().toISOString().split('T')[0];
    return date === today;
  };

  const isReminderUpcoming = (date: string) => {
    const today = new Date().toISOString().split('T')[0];
    return date > today;
  };

  const isReminderPast = (date: string) => {
    const today = new Date().toISOString().split('T')[0];
    return date < today;
  };

  const formatDate = (date: string) => {
    try {
      const [year, month, day] = date.split('-');
      return `${day}/${month}/${year}`;
    } catch (e) {
      return date;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1,
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

  const cardHoverEffect = {
    rest: { scale: 1 },
    hover: { 
      scale: 1.02,
      boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
      transition: { duration: 0.3 }
    }
  };

  return (
    <PageLayout>
      <motion.div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="flex items-center gap-2 mb-8">
          <motion.div 
            className="h-10 w-1 bg-gradient-to-b from-[#02646F] to-[#FFAA67] rounded-full mr-3"
            animate={{ height: [40, 48, 40] }}
            transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
          />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#02646F] to-[#FFAA67] text-transparent bg-clip-text text-focus-in">
            Nhắc Nhở và Thông Báo
          </h1>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {!isPatient && (
            <motion.div variants={itemVariants} className="lg:col-span-1">
              <motion.div 
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Card className="border-none shadow-lg overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-[#02646F] to-[#02646F]/90 text-white">
                    <div className="flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      <CardTitle>Tạo Nhắc Nhở Mới</CardTitle>
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
                                className="border-[#02646F]/20 focus-visible:ring-[#FFAA67]"
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tiêu Đề</FormLabel>
                                <FormControl>
                                  <Input placeholder="Nhập tiêu đề nhắc nhở" className="border-[#02646F]/20 focus-visible:ring-[#FFAA67]" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Loại Nhắc Nhở</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger className="border-[#02646F]/20 focus-visible:ring-[#FFAA67]">
                                      <SelectValue placeholder="Chọn loại nhắc nhở" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="appointment">Cuộc Hẹn</SelectItem>
                                    <SelectItem value="medication">Thuốc</SelectItem>
                                    <SelectItem value="other">Khác</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mô Tả</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Nhập mô tả chi tiết" 
                                  className="min-h-[100px] border-[#02646F]/20 focus-visible:ring-[#FFAA67]" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ngày</FormLabel>
                                <FormControl>
                                  <Input type="date" className="border-[#02646F]/20 focus-visible:ring-[#FFAA67]" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="time"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Thời Gian</FormLabel>
                                <FormControl>
                                  <Input type="time" className="border-[#02646F]/20 focus-visible:ring-[#FFAA67]" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="sendEmail"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  Gửi thông báo đến email bệnh nhân
                                </FormLabel>
                                {selectedPatientEmail && (
                                  <FormDescription>
                                    Email: {selectedPatientEmail}
                                  </FormDescription>
                                )}
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <motion.div 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button 
                            type="submit" 
                            className="w-full bg-gradient-to-r from-[#02646F] to-[#FFAA67] hover:from-[#FFAA67] hover:to-[#02646F] text-white transition-all duration-300"
                            disabled={!form.getValues().patientId}
                          >
                            <Plus className="mr-2 h-4 w-4" /> Tạo Nhắc Nhở
                          </Button>
                        </motion.div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
          
          <motion.div variants={itemVariants} className={isPatient ? "lg:col-span-3" : "lg:col-span-2"}>
            <motion.div 
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Card className="border-none shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-[#02646F] to-[#02646F]/90 text-white">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    <CardTitle>Danh Sách Nhắc Nhở</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 bg-white/95 backdrop-blur-sm">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <motion.div 
                        className="h-12 w-12 rounded-full border-4 border-[#FFAA67] border-t-transparent"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                  ) : reminders.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-12 text-gray-500"
                    >
                      <AlertCircle className="h-16 w-16 text-gray-300 mb-4" />
                      <p className="text-lg font-medium">
                        {isPatient 
                          ? "Không có nhắc nhở nào dành cho bạn."
                          : "Không có nhắc nhở nào. Thêm nhắc nhở đầu tiên của bạn."}
                      </p>
                    </motion.div>
                  ) : (
                    <div className="space-y-8">
                      {/* Today's reminders */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <h3 className="font-semibold text-lg mb-3 flex items-center">
                          <span className="h-2 w-2 rounded-full bg-blue-500 mr-2"></span>
                          Hôm Nay
                        </h3>
                        <AnimatePresence>
                          {reminders.filter(reminder => isReminderToday(reminder.date)).length > 0 ? (
                            <div className="space-y-3">
                              {reminders
                                .filter(reminder => isReminderToday(reminder.date))
                                .map((reminder, index) => (
                                  <motion.div
                                    key={reminder.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileHover="hover"
                                    variants={cardHoverEffect}
                                    custom={index}
                                    animate={{ 
                                      opacity: 1, 
                                      y: 0
                                    }}
                                    transition={{ delay: index * 0.1 }}
                                  >
                                    <Card className="border-l-4 border-l-blue-500 shadow-md overflow-hidden">
                                      <CardContent className="p-4 bg-gradient-to-br from-white to-blue-50/30">
                                        <div className="flex justify-between items-start">
                                          <div className="flex items-start gap-3">
                                            <div className="bg-blue-100 p-2 rounded-full">
                                              {getReminderIconByType(reminder.type)}
                                            </div>
                                            <div>
                                              <h4 className="font-semibold">{reminder.title}</h4>
                                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {formatDate(reminder.date)} 
                                                <Clock className="h-3 w-3 ml-2" />
                                                {reminder.time}
                                              </p>
                                              <div className="mt-1 text-xs inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                                                {getReminderTypeLabel(reminder.type)}
                                              </div>
                                              <p className="mt-2 text-sm">{reminder.description}</p>
                                              <p className="mt-1 text-xs text-gray-500">
                                                Bệnh nhân: {reminder.patientName}
                                              </p>
                                            </div>
                                          </div>
                                          {!isPatient && (
                                            <motion.div
                                              whileHover={{ scale: 1.1, rotate: 5 }}
                                              whileTap={{ scale: 0.9 }}
                                            >
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteReminder(reminder.id)}
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </motion.div>
                                          )}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </motion.div>
                                ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic px-4 py-3 bg-gray-50 rounded-lg">Không có nhắc nhở cho hôm nay</p>
                          )}
                        </AnimatePresence>
                      </motion.div>
                      
                      {/* Upcoming reminders */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <h3 className="font-semibold text-lg mb-3 flex items-center">
                          <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                          Sắp Tới
                        </h3>
                        <AnimatePresence>
                          {reminders.filter(reminder => isReminderUpcoming(reminder.date)).length > 0 ? (
                            <div className="space-y-3">
                              {reminders
                                .filter(reminder => isReminderUpcoming(reminder.date))
                                .map((reminder, index) => (
                                  <motion.div
                                    key={reminder.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileHover="hover"
                                    variants={cardHoverEffect}
                                    custom={index}
                                    animate={{ 
                                      opacity: 1, 
                                      y: 0
                                    }}
                                    transition={{ delay: 0.4 + index * 0.1 }}
                                  >
                                    <Card className="border-l-4 border-l-green-500 shadow-md overflow-hidden">
                                      <CardContent className="p-4 bg-gradient-to-br from-white to-green-50/30">
                                        <div className="flex justify-between items-start">
                                          <div className="flex items-start gap-3">
                                            <div className="bg-green-100 p-2 rounded-full">
                                              {getReminderIconByType(reminder.type)}
                                            </div>
                                            <div>
                                              <h4 className="font-semibold">{reminder.title}</h4>
                                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {formatDate(reminder.date)} 
                                                <Clock className="h-3 w-3 ml-2" />
                                                {reminder.time}
                                              </p>
                                              <div className="mt-1 text-xs inline-block px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                                                {getReminderTypeLabel(reminder.type)}
                                              </div>
                                              <p className="mt-2 text-sm">{reminder.description}</p>
                                              <p className="mt-1 text-xs text-gray-500">
                                                Bệnh nhân: {reminder.patientName}
                                              </p>
                                            </div>
                                          </div>
                                          {!isPatient && (
                                            <motion.div
                                              whileHover={{ scale: 1.1, rotate: 5 }}
                                              whileTap={{ scale: 0.9 }}
                                            >
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteReminder(reminder.id)}
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </motion.div>
                                          )}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </motion.div>
                                ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic px-4 py-3 bg-gray-50 rounded-lg">Không có nhắc nhở sắp tới</p>
                          )}
                        </AnimatePresence>
                      </motion.div>
                      
                      {/* Past reminders */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                      >
                        <h3 className="font-semibold text-lg mb-3 flex items-center">
                          <span className="h-2 w-2 rounded-full bg-gray-400 mr-2"></span>
                          Đã Qua
                        </h3>
                        <AnimatePresence>
                          {reminders.filter(reminder => isReminderPast(reminder.date)).length > 0 ? (
                            <div className="space-y-3">
                              {reminders
                                .filter(reminder => isReminderPast(reminder.date))
                                .slice(0, 5) // Show only recent past reminders
                                .map((reminder, index) => (
                                  <motion.div
                                    key={reminder.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileHover="hover"
                                    variants={cardHoverEffect}
                                    custom={index}
                                    animate={{ 
                                      opacity: 0.7, 
                                      y: 0
                                    }}
                                    transition={{ delay: 0.6 + index * 0.1 }}
                                  >
                                    <Card className="border-l-4 border-l-gray-400 shadow-md overflow-hidden">
                                      <CardContent className="p-4 bg-gradient-to-br from-white to-gray-50/30">
                                        <div className="flex justify-between items-start">
                                          <div className="flex items-start gap-3">
                                            <div className="bg-gray-100 p-2 rounded-full">
                                              {getReminderIconByType(reminder.type)}
                                            </div>
                                            <div>
                                              <h4 className="font-semibold">{reminder.title}</h4>
                                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {formatDate(reminder.date)} 
                                                <Clock className="h-3 w-3 ml-2" />
                                                {reminder.time}
                                              </p>
                                              <div className="mt-1 text-xs inline-block px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full">
                                                {getReminderTypeLabel(reminder.type)}
                                              </div>
                                              <p className="mt-1 text-xs text-gray-500">
                                                Bệnh nhân: {reminder.patientName}
                                              </p>
                                            </div>
                                          </div>
                                          {!isPatient && (
                                            <motion.div
                                              whileHover={{ scale: 1.1, rotate: 5 }}
                                              whileTap={{ scale: 0.9 }}
                                            >
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteReminder(reminder.id)}
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </motion.div>
                                          )}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </motion.div>
                                ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic px-4 py-3 bg-gray-50 rounded-lg">Không có nhắc nhở đã qua</p>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </PageLayout>
  );
};

export default Reminders;
