import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import PageLayout from "../components/PageLayout";
import { 
  MessageSquare, 
  Search, 
  Tag, 
  Calendar, 
  ThumbsUp, 
  MessageCircle, 
  Trash2, 
  Plus, 
  Send, 
  User, 
  Edit, 
  X, 
  ArrowLeft,
  FileX,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Topic {
  id: string;
  title: string;
  content: string;
  category: string;
  authorId: string;
  authorName: string;
  timestamp: any;
  replyCount: number;
  role?: string;
}

interface Reply {
  id: string;
  topicId: string;
  content: string;
  authorId: string;
  authorName: string;
  timestamp: any;
  role?: string;
}

const Forum = () => {
  const { currentUser, userData } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [replies, setReplies] = useState<Record<string, Reply[]>>({});
  const [loading, setLoading] = useState(true);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicContent, setNewTopicContent] = useState("");
  const [newTopicCategory, setNewTopicCategory] = useState("");
  const [newReplyContent, setNewReplyContent] = useState<Record<string, string>>({});
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showNewTopicForm, setShowNewTopicForm] = useState(false);
  
  const isDoctor = userData?.role === "doctor";

  const categories = [
    "Tư vấn tổng quát",
    "Điều trị",
    "Hỗ trợ người chăm sóc",
    "Nghiên cứu mới",
    "Chia sẻ kinh nghiệm",
    "Câu hỏi và đáp",
  ];

  const fetchTopics = async () => {
    try {
      setLoading(true);
      if (!currentUser) return;
      
      const q = query(
        collection(db, "forumTopics"), 
        orderBy("timestamp", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const topicsData: Topic[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        topicsData.push({ 
          id: doc.id,
          title: data.title,
          content: data.content,
          category: data.category,
          authorId: data.authorId,
          authorName: data.authorName,
          timestamp: data.timestamp,
          replyCount: data.replyCount || 0,
          role: data.role || null
        });
      });
      
      setTopics(topicsData);
      
      const initialReplyContent: Record<string, string> = {};
      topicsData.forEach(topic => {
        initialReplyContent[topic.id] = "";
      });
      setNewReplyContent(initialReplyContent);
    } catch (error) {
      console.error("Lỗi khi lấy chủ đề diễn đàn:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải chủ đề diễn đàn",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async (topicId: string) => {
    if (!currentUser) return;
    
    try {
      const q = query(
        collection(db, "forumReplies"), 
        where("topicId", "==", topicId),
        orderBy("timestamp", "asc")
      );
      
      const querySnapshot = await getDocs(q);
      const repliesData: Reply[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        repliesData.push({ 
          id: doc.id,
          topicId: data.topicId,
          content: data.content,
          authorId: data.authorId,
          authorName: data.authorName,
          timestamp: data.timestamp,
          role: data.role || null
        });
      });
      
      setReplies(prev => ({
        ...prev,
        [topicId]: repliesData
      }));
    } catch (error) {
      console.error("Lỗi khi lấy trả lời:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải trả lời cho chủ đề này",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [currentUser, userData]);

  const createTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !userData) {
      toast({
        title: "Lỗi Xác Thực",
        description: "Bạn phải đăng nhập để tạo chủ đề",
        variant: "destructive",
      });
      return;
    }
    
    if (!newTopicTitle.trim() || !newTopicContent.trim() || !newTopicCategory) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ tiêu đề, nội dung và chọn danh mục",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const newTopic = {
        title: newTopicTitle,
        content: newTopicContent,
        category: newTopicCategory,
        authorId: currentUser.uid,
        authorName: userData.displayName || currentUser.email,
        timestamp: serverTimestamp(),
        replyCount: 0,
        role: userData.role
      };
      
      await addDoc(collection(db, "forumTopics"), newTopic);
      
      toast({
        title: "Thành Công",
        description: "Đã tạo chủ đề thành công",
      });
      
      setNewTopicTitle("");
      setNewTopicContent("");
      setNewTopicCategory("");
      setShowNewTopicForm(false);
      
      fetchTopics();
    } catch (error) {
      console.error("Lỗi khi tạo chủ đề:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tạo chủ đề mới",
        variant: "destructive",
      });
    }
  };

  const deleteTopic = async (topicId: string) => {
    if (!currentUser) return;
    
    try {
      await deleteDoc(doc(db, "forumTopics", topicId));
      
      const repliesQuery = query(
        collection(db, "forumReplies"),
        where("topicId", "==", topicId)
      );
      
      const repliesSnapshot = await getDocs(repliesQuery);
      
      repliesSnapshot.forEach(async (replyDoc) => {
        await deleteDoc(doc(db, "forumReplies", replyDoc.id));
      });
      
      toast({
        title: "Thành Công",
        description: "Đã xóa chủ đề thành công",
      });
      
      if (selectedTopic === topicId) {
        setSelectedTopic(null);
      }
      
      fetchTopics();
    } catch (error) {
      console.error("Lỗi khi xóa chủ đề:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa chủ đề",
        variant: "destructive",
      });
    }
  };

  const addReply = async (topicId: string) => {
    if (!currentUser || !userData) {
      toast({
        title: "Lỗi Xác Thực",
        description: "Bạn phải đăng nhập để trả lời",
        variant: "destructive",
      });
      return;
    }
    
    if (!newReplyContent[topicId]?.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập nội dung trả lời",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const newReply = {
        topicId,
        content: newReplyContent[topicId],
        authorId: currentUser.uid,
        authorName: userData.displayName || currentUser.email,
        timestamp: serverTimestamp(),
        role: userData.role
      };
      
      await addDoc(collection(db, "forumReplies"), newReply);
      
      const topic = topics.find(t => t.id === topicId);
      if (topic) {
        const replyCount = (topic.replyCount || 0) + 1;
        
        const topicRef = doc(db, "forumTopics", topicId);
        await updateDoc(topicRef, { replyCount });
        
        setTopics(prev => prev.map(t => 
          t.id === topicId ? { ...t, replyCount } : t
        ));
      }
      
      toast({
        title: "Thành Công",
        description: "Đã thêm trả lời thành công",
      });
      
      setNewReplyContent(prev => ({
        ...prev,
        [topicId]: ""
      }));
      
      fetchReplies(topicId);
    } catch (error) {
      console.error("Lỗi khi thêm trả lời:", error);
      toast({
        title: "Lỗi",
        description: "Không thể thêm trả lời",
        variant: "destructive",
      });
    }
  };

  const deleteReply = async (replyId: string, topicId: string) => {
    if (!currentUser) return;
    
    try {
      await deleteDoc(doc(db, "forumReplies", replyId));
      
      const topic = topics.find(t => t.id === topicId);
      if (topic) {
        const replyCount = Math.max((topic.replyCount || 0) - 1, 0);
        
        const topicRef = doc(db, "forumTopics", topicId);
        await updateDoc(topicRef, { replyCount });
        
        setTopics(prev => prev.map(t => 
          t.id === topicId ? { ...t, replyCount } : t
        ));
      }
      
      toast({
        title: "Thành Công",
        description: "Đã xóa trả lời thành công",
      });
      
      fetchReplies(topicId);
    } catch (error) {
      console.error("Lỗi khi xóa trả lời:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa trả lời",
        variant: "destructive",
      });
    }
  };

  const selectTopic = (topicId: string | null) => {
    setSelectedTopic(topicId);
    
    if (topicId) {
      fetchReplies(topicId);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getAvatarColor = (role?: string) => {
    if (role === "doctor") return "bg-blue-500";
    if (role === "patient") return "bg-green-500";
    return "bg-gray-500";
  };

  const getRoleBadge = (role?: string) => {
    if (role === "doctor") {
      return <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">Bác sĩ</span>;
    }
    if (role === "patient") {
      return <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-800">Bệnh nhân</span>;
    }
    return null;
  };

  const filteredTopics = topics
    .filter(topic => 
      topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.authorName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(topic =>
      activeCategory ? topic.category === activeCategory : true
    );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const formVariants = {
    hidden: { opacity: 0, height: 0, overflow: 'hidden' },
    show: { 
      opacity: 1, 
      height: 'auto',
      transition: { duration: 0.3 }
    }
  };

  return (
    <PageLayout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="flex items-center gap-3 mb-8">
          <MessageSquare className="h-7 w-7 text-[#02646F]" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#02646F] to-[#4D8F97] bg-clip-text text-transparent text-focus-in">
            Diễn Đàn
          </h1>
        </div>
        
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <Card className="overflow-hidden border-none shadow-lg">
                <CardHeader className="bg-gradient-to-r from-[#02646F] to-[#4D8F97] text-white p-4">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Tìm Kiếm & Lọc
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Tìm kiếm chủ đề..."
                        className="pl-8 border-gray-300 focus:border-[#02646F] focus:ring focus:ring-[#02646F]/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Danh Mục
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={activeCategory === null ? "default" : "outline"}
                          size="sm"
                          className={activeCategory === null ? "bg-[#02646F]" : "border-[#02646F] text-[#02646F]"}
                          onClick={() => setActiveCategory(null)}
                        >
                          Tất cả
                        </Button>
                        {categories.map(category => (
                          <Button
                            key={category}
                            variant={activeCategory === category ? "default" : "outline"}
                            size="sm"
                            className={activeCategory === category ? "bg-[#02646F]" : "border-[#02646F] text-[#02646F]"}
                            onClick={() => setActiveCategory(category)}
                          >
                            {category}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    <Button
                      className="w-full bg-[#02646F] hover:bg-[#FFAA67] flex items-center gap-2"
                      onClick={() => setShowNewTopicForm(!showNewTopicForm)}
                    >
                      {showNewTopicForm ? (
                        <>
                          <X className="h-4 w-4" />
                          Hủy Tạo Chủ Đề
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Tạo Chủ Đề Mới
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <AnimatePresence>
                {showNewTopicForm && (
                  <motion.div
                    variants={formVariants}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                  >
                    <Card className="border-none shadow-lg">
                      <CardHeader className="bg-gradient-to-r from-[#02646F] to-[#4D8F97] text-white p-4">
                        <CardTitle className="text-white flex items-center gap-2">
                          <MessageCircle className="h-5 w-5" />
                          Tạo Chủ Đề Mới
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <form onSubmit={createTopic} className="space-y-4">
                          <div>
                            <Label htmlFor="title" className="text-gray-700">Tiêu đề</Label>
                            <Input
                              id="title"
                              value={newTopicTitle}
                              onChange={(e) => setNewTopicTitle(e.target.value)}
                              className="border-gray-300 focus:border-[#02646F] focus:ring focus:ring-[#02646F]/20"
                              placeholder="Nhập tiêu đề chủ đề..."
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="category" className="text-gray-700">Danh mục</Label>
                            <select
                              id="category"
                              value={newTopicCategory}
                              onChange={(e) => setNewTopicCategory(e.target.value)}
                              className="w-full h-10 rounded-md border border-gray-300 bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02646F] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                            >
                              <option value="">-- Chọn danh mục --</option>
                              {categories.map(category => (
                                <option key={category} value={category}>
                                  {category}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <Label htmlFor="content" className="text-gray-700">Nội dung</Label>
                            <Textarea
                              id="content"
                              value={newTopicContent}
                              onChange={(e) => setNewTopicContent(e.target.value)}
                              className="min-h-[150px] border-gray-300 focus:border-[#02646F] focus:ring focus:ring-[#02646F]/20"
                              placeholder="Nhập nội dung chủ đề..."
                            />
                          </div>
                          
                          <Button 
                            type="submit" 
                            className="w-full bg-[#02646F] hover:bg-[#FFAA67]"
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Đăng Chủ Đề
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="lg:col-span-3">
              {loading ? (
                <div className="text-center py-8 flex flex-col items-center">
                  <motion.div
                    animate={{ 
                      rotate: 360,
                    }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="h-10 w-10 text-[#02646F]" />
                  </motion.div>
                  <p className="mt-3 text-gray-600">Đang tải dữ liệu...</p>
                </div>
              ) : selectedTopic ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={() => selectTopic(null)}
                      className="border-[#02646F] text-[#02646F]"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Quay lại danh sách
                    </Button>
                    {(isDoctor || (currentUser && topics.find(t => t.id === selectedTopic)?.authorId === currentUser.uid)) && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteTopic(selectedTopic)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Xóa chủ đề
                      </Button>
                    )}
                  </div>
                  
                  {topics.find(topic => topic.id === selectedTopic) && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="border-none shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-[#02646F] to-[#4D8F97] text-white p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-white text-xl">
                                {topics.find(topic => topic.id === selectedTopic)?.title}
                              </CardTitle>
                              <CardDescription className="text-white/80 mt-1">
                                <div className="flex items-center gap-2">
                                  <Tag className="h-4 w-4" />
                                  {topics.find(topic => topic.id === selectedTopic)?.category}
                                </div>
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              {getRoleBadge(topics.find(topic => topic.id === selectedTopic)?.role)}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <Avatar className={`${getAvatarColor(topics.find(topic => topic.id === selectedTopic)?.role)} h-10 w-10`}>
                              <AvatarFallback>
                                {getInitials(topics.find(topic => topic.id === selectedTopic)?.authorName || "")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="font-medium text-[#02646F]">
                                  {topics.find(topic => topic.id === selectedTopic)?.authorName}
                                </div>
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {topics.find(topic => topic.id === selectedTopic)?.timestamp 
                                    ? format(topics.find(topic => topic.id === selectedTopic)?.timestamp.toDate(), "dd/MM/yyyy HH:mm") 
                                    : "N/A"}
                                </div>
                              </div>
                              <div className="mt-2 whitespace-pre-wrap text-gray-700">
                                {topics.find(topic => topic.id === selectedTopic)?.content}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-[#02646F] mb-4 flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      Trả Lời 
                      {replies[selectedTopic]?.length > 0 && (
                        <span className="text-sm bg-[#02646F] text-white px-2 py-0.5 rounded-full">
                          {replies[selectedTopic]?.length}
                        </span>
                      )}
                    </h3>
                    
                    <motion.div 
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                      className="space-y-4"
                    >
                      {replies[selectedTopic]?.length > 0 ? (
                        replies[selectedTopic].map((reply, index) => (
                          <motion.div 
                            key={reply.id}
                            variants={itemVariants}
                            custom={index}
                          >
                            <Card className="border border-gray-200 shadow-sm">
                              <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                  <Avatar className={`${getAvatarColor(reply.role)} h-10 w-10`}>
                                    <AvatarFallback>
                                      {getInitials(reply.authorName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-[#02646F]">
                                          {reply.authorName}
                                        </span>
                                        {getRoleBadge(reply.role)}
                                      </div>
                                      <div className="text-sm text-gray-500 flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {reply.timestamp 
                                          ? format(reply.timestamp.toDate(), "dd/MM/yyyy HH:mm") 
                                          : "N/A"}
                                      </div>
                                    </div>
                                    <div className="mt-2 whitespace-pre-wrap text-gray-700">
                                      {reply.content}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                              {(isDoctor || (currentUser && reply.authorId === currentUser.uid)) && (
                                <CardFooter className="py-1 px-4 bg-gray-50 flex justify-end">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => deleteReply(reply.id, selectedTopic)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </CardFooter>
                              )}
                            </Card>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          Chưa có trả lời nào cho chủ đề này
                        </div>
                      )}
                    </motion.div>
                    
                    <Card className="mt-6 border border-gray-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg text-[#02646F]">Trả lời chủ đề</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-4">
                          <Avatar className={`${getAvatarColor(userData?.role)} h-10 w-10`}>
                            <AvatarFallback>
                              {getInitials(userData?.displayName || "User")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <Textarea
                              value={newReplyContent[selectedTopic] || ""}
                              onChange={(e) => setNewReplyContent(prev => ({
                                ...prev,
                                [selectedTopic]: e.target.value
                              }))}
                              placeholder="Nhập trả lời của bạn..."
                              className="min-h-[100px] border-gray-300 focus:border-[#02646F] focus:ring focus:ring-[#02646F]/20"
                            />
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-end">
                        <Button 
                          className="bg-[#02646F] hover:bg-[#FFAA67]"
                          onClick={() => addReply(selectedTopic)}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Gửi Trả Lời
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </div>
              ) : (
                <>
                  <Card className="overflow-hidden border-none shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-[#02646F] to-[#4D8F97] text-white p-4">
                      <CardTitle className="text-white flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Danh Sách Chủ Đề
                      </CardTitle>
                      <CardDescription className="text-white/80">
                        Trao đổi, thảo luận về Alzheimer
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      {filteredTopics.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 flex flex-col items-center">
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                          >
                            <FileX className="h-12 w-12 text-gray-400 mb-3" />
                          </motion.div>
                          <p>Không tìm thấy chủ đề nào</p>
                        </div>
                      ) : (
                        <motion.div 
                          variants={containerVariants}
                          initial="hidden"
                          animate="show"
                          className="divide-y divide-gray-200"
                        >
                          {filteredTopics.map((topic, index) => (
                            <motion.div 
                              key={topic.id}
                              variants={itemVariants}
                              custom={index}
                              className="hover:bg-gray-50 transition-colors cursor-pointer"
                              onClick={() => selectTopic(topic.id)}
                              whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.02)" }}
                            >
                              <div className="p-4">
                                <div className="flex justify-between">
                                  <h3 className="text-lg font-semibold line-clamp-1 text-[#02646F]">
                                    {topic.title}
                                  </h3>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 flex items-center gap-1">
                                      <MessageCircle className="h-3 w-3" />
                                      {topic.replyCount || 0}
                                    </span>
                                    {getRoleBadge(topic.role)}
                                  </div>
                                </div>
                                
                                <div className="mt-2 text-sm line-clamp-2 text-gray-600">
                                  {topic.content}
                                </div>
                                
                                <div className="mt-3 flex justify-between items-center text-xs text-gray-500">
                                  <div className="flex items-center gap-2">
                                    <Avatar className={`${getAvatarColor(topic.role)} h-6 w-6`}>
                                      <AvatarFallback className="text-xs">
                                        {getInitials(topic.authorName)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>{topic.authorName}</span>
                                  </div>
                                  <div className="flex gap-4">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      <span>
                                        {topic.timestamp ? format(topic.timestamp.toDate(), "dd/MM/yyyy") : "N/A"}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Tag className="h-3 w-3" />
                                      <span>{topic.category}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </PageLayout>
  );
};

export default Forum;
