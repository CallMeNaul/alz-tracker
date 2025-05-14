import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import Navbar from "../components/Navbar";
import LoadingScreen from "../components/LoadingScreen";
import EmptyStateMessage from "../components/mri/EmptyStateMessage";
import { 
  FileText, ClipboardCheck, Book, 
  FileBarChart2, 
  MessageSquare, Bell, Image, 
  Brain, Activity, Star, Zap, Sparkles,
  ShieldCheck, Layout, Microscope, Users
} from "lucide-react";

const Index = () => {
  const { currentUser, userData } = useAuth();
  const isPatient = userData?.role === "patient";
  const isDoctor = userData?.role === "doctor";
  const isAdmin = userData?.role === "admin";
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCards, setVisibleCards] = useState<number[]>([]);
  const [visibleDiagnosticCards, setVisibleDiagnosticCards] = useState<number[]>([]);
  const diagnosticParamsRef = useRef<HTMLDivElement>(null);
  const featuresSectionRef = useRef<HTMLDivElement>(null);
  const [featureCardsVisible, setFeatureCardsVisible] = useState(false);
  const [featureCardAppear, setFeatureCardAppear] = useState<number[]>([]);
  const navigate = useNavigate();

  const navigateWithEffect = (to: string) => {
    navigate(to);
  };

  useEffect(() => {
    if (!isLoading) {
      setIsVisible(true);
    }
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading) {
      setVisibleDiagnosticCards([0, 1, 2, 3]);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            console.log("Diagnostic section is in view!");
            const allCards = Array.from({ length: 4 }, (_, i) => i);
            setVisibleDiagnosticCards(allCards);
          }
        });
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -100px 0px"
      }
    );

    if (diagnosticParamsRef.current) {
      observer.observe(diagnosticParamsRef.current);
    }

    return () => observer.disconnect();
  }, [isLoading]);

  useEffect(() => {
    if (!currentUser || isLoading) return;
    if (!featuresSectionRef.current) return;

    let hasAnimated = false;
    const startCardsAnimation = () => {
      if (hasAnimated) return;
      hasAnimated = true;
      const allCards = Array.from({ length: getFeatureList().length }, (_, i) => i);
      let idx = 0;
      const interval = setInterval(() => {
        setFeatureCardAppear((prev) => {
          if (prev.length < allCards.length) {
            return [...prev, prev.length];
          } else {
            clearInterval(interval);
            return prev;
          }
        });
        idx++;
      }, 150);
    };

    const observer = new window.IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setFeatureCardsVisible(true);
            startCardsAnimation();
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    observer.observe(featuresSectionRef.current);

    return () => observer.disconnect();
  }, [currentUser, isLoading]);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  if (isLoading) {
    return <LoadingScreen onLoadingComplete={handleLoadingComplete} />;
  }

  const renderPatientDiagnosisPanel = () => {
    if (!isPatient) return null;
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 my-8">
        <h2 className="text-xl font-semibold mb-4 text-[#02646f] flex items-center">
          <ClipboardCheck className="mr-2 h-5 w-5" />
          Hồ Sơ Chẩn Đoán Của Tôi
        </h2>
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 dark:bg-gray-900 p-4 border-b">
            <h3 className="font-medium">Thông Tin Chẩn Đoán Gần Đây</h3>
          </div>
          <div className="p-4">
            <EmptyStateMessage type="no-diagnosis" className="py-8" />
            <div className="flex justify-center mt-4">
              <Link to="/diagnosis">
                <Button variant="outline" className="border-[#02646f] text-[#02646f]">
                  Xem Chi Tiết Chẩn Đoán
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

  function getFeatureList() {
    return [
      {
        to: "/progress-notes",
        icon: FileText,
        title: "Ghi Chép Tiến Triển",
        description: "Ghi chép sự thay đổi tình trạng của bệnh nhân theo thời gian, đánh dấu các dấu hiệu cải thiện hoặc xấu đi."
      },
      {
        to: "/diagnosis",
        icon: ClipboardCheck,
        title: "Chẩn Đoán và Đánh Giá",
        description: "Thực hiện các bài kiểm tra chẩn đoán Alzheimer và ghi lại kết quả từ MMSE, CDR và các thông số khác."
      },
      {
        to: "/medical-history",
        icon: Book,
        title: "Lịch Sử Bệnh Lý",
        description: "Lưu trữ lịch sử bệnh lý của bệnh nhân, bao gồm các lần thăm khám, điều trị và các thông số đã thu thập."
      },
      {
        to: "/reports",
        icon: FileBarChart2,
        title: "Báo Cáo và Phân Tích",
        description: "Tạo báo cáo về tình trạng của bệnh nhân, in ấn và xem các biểu đồ để theo dõi sự tiến triển."
      },
      {
        to: "/forum",
        icon: MessageSquare,
        title: "Diễn Đàn",
        description: "Chia sẻ kinh nghiệm, đặt câu hỏi và trao đổi với cộng đồng về chăm sóc người bệnh Alzheimer."
      },
      {
        to: "/reminders",
        icon: Bell,
        title: "Nhắc Nhở",
        description: "Tạo nhắc nhở cho cuộc hẹn, dùng thuốc hoặc các hoạt động quan trọng với người bệnh Alzheimer."
      },
      isPatient && {
        to: "/my-mri-scans",
        icon: Image,
        title: "Ảnh MRI Của Tôi",
        description: "Tải lên và quản lý ảnh MRI 3D của bạn (định dạng .nii hoặc .nii.gz) để bác sĩ phân tích và chẩn đoán."
      },
      isDoctor && {
        to: "/doctor/mri-management",
        icon: Image,
        title: "Quản Lý MRI Bệnh Nhân",
        description: "Xem và quản lý kết quả chụp MRI của các bệnh nhân được phân công."
      },
      isAdmin && {
        to: "/admin/doctor-accounts",
        icon: Users,
        title: "Quản Lý Tài Khoản Bác Sĩ",
        description: "Xem và quản lý danh sách các tài khoản bác sĩ trong hệ thống."
      }
    ].filter(Boolean);
  }

  const handleFeatureClick = (to: string) => {
    if (!currentUser) {
      navigateWithEffect('/login');
      return;
    }
    navigateWithEffect(to);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 dark:text-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div id="intro" className={`py-12 md:py-20 pt-24 transition-all duration-1000 ease-out transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 rounded-full bg-gradient-to-r from-[#02646f]/20 to-[#ffaa67]/20 blur-3xl animate-pulse"></div>
              </div>
              <div className="relative">
                <Brain className="h-16 w-16 text-[#02646f] mx-auto mb-4 animate-pulse" />
              </div>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
              <span className="block animated-gradient-text bg-gradient-to-r from-[#02646f] via-[#ffaa67] to-[#02646f] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient tracking-in-expand-fwd-top">
                <span className="gradient-text">Trung Tâm Dữ Liệu</span>
              </span>
              <span className="block tracking-in-expand-fwd-top" style={{ animationDelay: "0.3s" }}>
                <span className="gradient-text">Chẩn Đoán Alzheimer</span>
              </span>
            </h1>
            
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-300 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Nền tảng bảo mật để lưu trữ, quản lý và phân tích các thông số chẩn đoán bệnh Alzheimer
            </p>
            
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
              <div className="puff-in-center bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md transform transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col items-center text-center group" style={{ animationDelay: '0.2s' }}>
                <div className="bg-[#02646f]/10 dark:bg-[#02646f]/30 p-3 rounded-full mb-4 group-hover:bg-[#ffaa67]/30 transition-colors duration-300">
                  <ShieldCheck className="h-8 w-8 text-[#02646f] dark:text-[#17d3ba] group-hover:text-[#ffaa67] transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-[#02646f] dark:text-[#17d3ba] group-hover:text-[#ffaa67] transition-colors duration-300">Lưu Trữ An Toàn</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Lưu trữ dữ liệu chẩn đoán bệnh nhân với khả năng bảo mật và kiểm soát quyền riêng tư cấp doanh nghiệp.
                </p>
              </div>
              
              <div className="puff-in-center bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md transform transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col items-center text-center group" style={{ animationDelay: '0.4s' }}>
                <div className="bg-[#02646f]/10 dark:bg-[#02646f]/30 p-3 rounded-full mb-4 group-hover:bg-[#ffaa67]/30 transition-colors duration-300">
                  <Layout className="h-8 w-8 text-[#02646f] dark:text-[#17d3ba] group-hover:text-[#ffaa67] transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-[#02646f] dark:text-[#17d3ba] group-hover:text-[#ffaa67] transition-colors duration-300">Quản Lý Dễ Dàng</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Giao diện trực quan để thêm, xem và quản lý các thông số chẩn đoán Alzheimer.
                </p>
              </div>
              
              <div className="puff-in-center bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md transform transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col items-center text-center group" style={{ animationDelay: '0.6s' }}>
                <div className="bg-[#02646f]/10 dark:bg-[#02646f]/30 p-3 rounded-full mb-4 group-hover:bg-[#ffaa67]/30 transition-colors duration-300">
                  <Microscope className="h-8 w-8 text-[#02646f] dark:text-[#17d3ba] group-hover:text-[#ffaa67] transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-[#02646f] dark:text-[#17d3ba] group-hover:text-[#ffaa67] transition-colors duration-300">Sẵn Sàng Nghiên Cứu</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Chuẩn bị và tổ chức dữ liệu của bạn để hỗ trợ nghiên cứu và ứng dụng lâm sàng.
                </p>
              </div>
            </div>
            
            <div className="mt-6 sm:flex sm:justify-center">
              {currentUser ? (
                <Link to="/dashboard">
                  <Button variant="brand" size="lg" className="px-8 group relative overflow-hidden">
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#02646f] to-[#17d3ba] opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    <span className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                      Đi đến Bảng Điều Khiển <Zap className="ml-2 h-5 w-5 animate-pulse" />
                    </span>
                    <span className="invisible">Đi đến Bảng Điều Khiển</span>
                  </Button>
                </Link>
              ) : (
                <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:items-center">
                  <Link to="/login">
                    <Button variant="outline" size="lg" className="px-8 border-[#02646f] text-[#02646f] hover:bg-[#ffaa67] hover:text-white hover:border-[#ffaa67] transition-all duration-300 w-full sm:w-auto mb-3 sm:mb-0">
                      <span className="relative overflow-hidden">
                        Đăng Nhập <Star className="ml-2 inline-block h-4 w-4 animate-spin" />
                      </span>
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="brand" size="lg" className="px-8 group relative overflow-hidden w-full sm:w-auto mb-3 sm:mb-0">
                      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#02646f] to-[#17d3ba] opacity-0 group-hover:opacity-100 transition-opacity"></span>
                      <span className="relative">Đăng Ký (Bác Sĩ)</span>
                    </Button>
                  </Link>
                  <Link to="/patient-register">
                    <Button variant="outline" size="lg" className="px-8 border-[#02646f] text-[#02646f] hover:bg-[#ffaa67] hover:text-white hover:border-[#ffaa67] transition-all duration-300 w-full sm:w-auto">
                      <span className="relative overflow-hidden">
                        Đăng Ký (Bệnh Nhân)
                      </span>
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {renderPatientDiagnosisPanel()}

        <div className="w-full h-24 relative overflow-hidden">
          <svg className="absolute bottom-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
            <path fill="#02646f" fillOpacity="0.05" d="M0,288L48,272C96,256,192,224,288,197.3C384,171,480,149,576,165.3C672,181,768,235,864,250.7C960,267,1056,245,1152,224C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>

        {(currentUser) && (
          <div id="features" ref={featuresSectionRef} className="py-12 mb-12 pt-20 relative">
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10" 
              style={{ backgroundImage: 'url(https://i.postimg.cc/bvpxrNMB/Chat-GPT-Image-17-23-20-19-thg-4-2025.png)' }}>
            </div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-center mb-8 flex items-center justify-center">
                <Sparkles className="mr-2 h-6 w-6 text-[#ffaa67]" />
                <span>Các Tính Năng Chính</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFeatureList().map((feature, index) => (
                  <Link to={feature.to} className="block" key={index}>
                    <div 
                      className={`
                        feature-card
                        bg-gradient-to-br from-[#02646f] to-[#03a7b9] text-white shadow-md rounded-lg p-6 hover:shadow-lg hover:border-[#17d3ba] hover:bg-gradient-to-br hover:from-[#ffaa67] hover:to-[#ffaa67] 
                        transition-all duration-300 h-full transform group relative overflow-hidden
                        ${featureCardsVisible && featureCardAppear.includes(index) 
                          ? "animate__animated bounce-in-top opacity-100 translate-y-0" 
                          : "opacity-0 translate-y-12"}
                      `}
                      style={{
                        animationDelay: `${index * 0.13 + 0.1}s`,
                        WebkitAnimationDelay: `${index * 0.13 + 0.1}s`
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ffaa67]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-white/20 p-3 rounded-full group-hover:bg-white/30 transition-colors duration-300">
                          <feature.icon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold">{feature.title}</h3>
                      </div>
                      <p className="text-white/90">
                        {feature.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              
              <div className="flex justify-center mt-8">
                <Link to="/dashboard">
                  <Button 
                    variant="brand" 
                    size="lg" 
                    className="px-8 py-3 bg-[#02646f] hover:bg-[#037884] transition-all duration-300 group shadow-md"
                  >
                    <span className="flex items-center">
                      Đi đến Bảng Điều Khiển
                      <Zap className="ml-2 h-5 w-5 group-hover:animate-pulse" />
                    </span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
        
        <div 
          id="diagnosticParams" 
          ref={diagnosticParamsRef} 
          className="py-12 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-lg shadow-md p-8 my-12 pt-16"
        >
          <style>{`
            .diagnostic-card {
              opacity: 0;
              transform: translateY(20px);
              transition: opacity 0.6s ease-out, transform 0.6s ease-out;
            }
            .diagnostic-card.visible {
              opacity: 1;
              transform: translateY(0);
            }
            .bounce-in-top {
              -webkit-animation: bounce-in-top 1.1s both;
                      animation: bounce-in-top 1.1s both;
            }
            @-webkit-keyframes bounce-in-top {
              0% {
                -webkit-transform: translateY(-500px);
                        transform: translateY(-500px);
                -webkit-animation-timing-function: ease-in;
                        animation-timing-function: ease-in;
                opacity: 0;
              }
              38% {
                -webkit-transform: translateY(0);
                        transform: translateY(0);
                -webkit-animation-timing-function: ease-out;
                        animation-timing-function: ease-out;
                opacity: 1;
              }
              55% {
                -webkit-transform: translateY(-65px);
                        transform: translateY(-65px);
                -webkit-animation-timing-function: ease-in;
                        animation-timing-function: ease-in;
              }
              72% {
                -webkit-transform: translateY(0);
                        transform: translateY(0);
                -webkit-animation-timing-function: ease-out;
                        animation-timing-function: ease-out;
              }
              81% {
                -webkit-transform: translateY(-28px);
                        transform: translateY(-28px);
                -webkit-animation-timing-function: ease-in;
                        animation-timing-function: ease-in;
              }
              90% {
                -webkit-transform: translateY(0);
                        transform: translateY(0);
                -webkit-animation-timing-function: ease-out;
                        animation-timing-function: ease-out;
              }
              95% {
                -webkit-transform: translateY(-8px);
                        transform: translateY(-8px);
                -webkit-animation-timing-function: ease-in;
                        animation-timing-function: ease-in;
              }
              100% {
                -webkit-transform: translateY(0);
                        transform: translateY(0);
                -webkit-animation-timing-function: ease-out;
                        animation-timing-function: ease-out;
              }
            }
            @keyframes bounce-in-top {
              0% {
                -webkit-transform: translateY(-500px);
                        transform: translateY(-500px);
                -webkit-animation-timing-function: ease-in;
                        animation-timing-function: ease-in;
                opacity: 0;
              }
              38% {
                -webkit-transform: translateY(0);
                        transform: translateY(0);
                -webkit-animation-timing-function: ease-out;
                        animation-timing-function: ease-out;
                opacity: 1;
              }
              55% {
                -webkit-transform: translateY(-65px);
                        transform: translateY(-65px);
                -webkit-animation-timing-function: ease-in;
                        animation-timing-function: ease-in;
              }
              72% {
                -webkit-transform: translateY(0);
                        transform: translateY(0);
                -webkit-animation-timing-function: ease-out;
                        animation-timing-function: ease-out;
              }
              81% {
                -webkit-transform: translateY(-28px);
                        transform: translateY(-28px);
                -webkit-animation-timing-function: ease-in;
                        animation-timing-function: ease-in;
              }
              90% {
                -webkit-transform: translateY(0);
                        transform: translateY(0);
                -webkit-animation-timing-function: ease-out;
                        animation-timing-function: ease-out;
              }
              95% {
                -webkit-transform: translateY(-8px);
                        transform: translateY(-8px);
                -webkit-animation-timing-function: ease-in;
                        animation-timing-function: ease-in;
              }
              100% {
                -webkit-transform: translateY(0);
                        transform: translateY(0);
                -webkit-animation-timing-function: ease-out;
                        animation-timing-function: ease-out;
              }
            }
          `}</style>
          
          <h2 className="text-3xl font-bold text-center mb-10 dark:text-white relative">
            <span className="relative z-10">Các Thông Số Chẩn Đoán Alzheimer Chính</span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-8 bg-[#02646f]/10 dark:bg-[#02646f]/20 rounded-full blur-md"></div>
            </div>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 jello-horizontal">
            {[
              {
                title: "Đánh Giá Trạng Thái Tâm Thần Mini (MMSE)",
                description: "Bảng câu hỏi 30 điểm được sử dụng rộng rãi trong môi trường lâm sàng và nghiên cứu để đo lường suy giảm nhận thức.",
                icon: Brain,
                bgColor: "bg-gradient-to-br from-[#02646f]/10 to-[#03a7b9]/10"
              },
              {
                title: "Đánh Giá Sa Sút Trí Tuệ Lâm Sàng (CDR)",
                description: "Thang đo số được sử dụng để lượng hóa mức độ nghiêm trọng của các triệu chứng sa sút trí tuệ.",
                icon: Activity,
                bgColor: "bg-gradient-to-br from-[#ffaa67]/10 to-[#ffcc99]/10"
              },
              {
                title: "Phân Tích Dấu Ấn Sinh Học",
                description: "Kết quả xét nghiệm phòng thí nghiệm bao gồm các dấu ấn sinh học trong dịch não tủy (CSF) như Aβ42, tau tổng và tau phosphorylated.",
                icon: Microscope,
                bgColor: "bg-gradient-to-br from-[#ffaa67]/10 to-[#ffcc99]/10"
              },
              {
                title: "Kết Quả Chụp Hình Não",
                description: "Kết quả chụp MRI, PET thể hiện mô hình teo não hoặc lắng đọng amyloid/tau.",
                icon: Image,
                bgColor: "bg-gradient-to-br from-[#02646f]/10 to-[#03a7b9]/10"
              }
            ].map((item, index) => (
              <div 
                key={index} 
                className={`bounce-in-top hover:jello-horizontal ${visibleDiagnosticCards.includes(index) ? 'opacity-100' : 'opacity-0'} ${item.bgColor} rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:translate-y-[-5px] border border-gray-100 dark:border-gray-700 overflow-hidden relative group`}
                style={{ 
                  animationDelay: `${index * 0.2}s`,
                  visibility: visibleDiagnosticCards.includes(index) ? 'visible' : 'hidden'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="flex items-start gap-4">
                  <div className="bg-[#02646f]/20 dark:bg-[#02646f]/30 p-4 rounded-full">
                    <item.icon className="h-8 w-8 text-[#02646f] dark:text-[#17d3ba]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl mb-3 text-[#02646f] dark:text-[#17d3ba] group-hover:text-[#037884] transition-colors duration-300">{item.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-[#02646f]/5 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-[#ffaa67]/5 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>

      <footer className="bg-[#02646f] text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div className="flex items-center mb-4 md:mb-0">
              <Brain className="h-8 w-8 text-white mr-2" />
              <span className="font-space-mono text-xl font-bold text-white">AlzTracker</span>
            </div>
          </div>
          <p className="text-center text-white/80 text-sm">
            © {new Date().getFullYear()} <span className="font-space-mono">AlzTracker</span>. Tất cả các quyền được bảo lưu.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
