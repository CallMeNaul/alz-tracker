
import React, { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

const Contact = () => {
  const [animationStarted, setAnimationStarted] = useState(false);
  const navigate = useNavigate();
  
  const teamMembers = [
    {
      id: 1,
      name: "Lê Minh Toàn",
      studentId: "21520485",
      email: "21520485@gm.uit.edu.vn",
      department: "Mạng máy tính và Truyền thông Dữ liệu",
      image: "https://i.postimg.cc/RV08Px42/lmt.png"
    },
    {
      id: 2,
      name: "Nguyễn Thành Luân",
      studentId: "21522308",
      email: "21522308@gm.uit.edu.vn",
      department: "Mạng máy tính và Truyền thông Dữ liệu",
      image: "https://i.postimg.cc/9FNkKgf0/ntl.png"
    }
  ];

  // Set initial animation classes with improved appearance effects
  useEffect(() => {
    // Make sure content is visible first, then animate
    setAnimationStarted(true);
    
    const header = document.querySelector('.header-animation');
    const cards = document.querySelectorAll('.card-animation');
    const footer = document.querySelector('.footer-animation');
    
    // Add animation classes after a small delay for a staggered effect
    setTimeout(() => {
      header?.classList.add('animate-in');
    }, 100);
    
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add('animate-in');
      }, 300 + index * 200);
    });
    
    setTimeout(() => {
      footer?.classList.add('animate-in');
    }, 800);
  }, []);

  const handleHomeClick = () => {
    // Navigate to home without animation effects
    navigate("/", { state: { skipLoading: true } });
  };

  return (
    <div className="container mx-auto px-4 py-8 overflow-hidden">
      <div className="mb-8 text-center mt-6 header-animation opacity-80 transform translate-y-8 transition-all duration-700">
        <h1 className="text-3xl font-bold text-[#02646f] dark:text-[#03a7b9] mb-2">Về Chúng Tôi</h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Chúng tôi là đội ngũ sinh viên đam mê công nghệ và phát triển các giải pháp y tế.
          AlzTracker là dự án phục vụ mục đích theo dõi và hỗ trợ bệnh nhân Alzheimer của chúng tôi.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {teamMembers.map((member, index) => (
          <Card 
            key={member.id} 
            className={`card-animation opacity-80 transform translate-y-8 transition-all duration-700 delay-${index * 100} overflow-hidden hover:shadow-lg dark:bg-gray-800 dark:border-gray-700 hover:transform hover:scale-[1.02] transition-transform`}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-center mb-4">
                <Avatar className="h-32 w-32 animate-bounce-slow">
                  <AvatarImage src={member.image} alt={member.name} className="object-cover" />
                  <AvatarFallback className="text-2xl bg-[#02646f] text-white">
                    {member.name.split(' ').map(name => name[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-center text-xl font-bold text-[#02646f] dark:text-[#03a7b9]">{member.name}</CardTitle>
              <CardDescription className="text-center">MSSV: {member.studentId}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-[#02646f] dark:text-[#03a7b9]" />
                  <span className="text-gray-700 dark:text-gray-300">{member.email}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Khoa: {member.department}
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center pt-2 pb-4">
              <a 
                href={`mailto:${member.email}`} 
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#02646f] rounded-md hover:bg-[#037884] transition-colors hover:shadow-md"
              >
                <Mail className="mr-2 h-4 w-4" />
                Liên hệ qua Email
              </a>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-16 text-center footer-animation opacity-80 transform translate-y-8 transition-all duration-700">
        <h2 className="text-2xl font-bold text-[#02646f] dark:text-[#03a7b9] mb-4">Dự Án AlzTracker</h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
          AlzTracker là ứng dụng được phát triển với mục đích hỗ trợ quản lý và theo dõi tình trạng bệnh Alzheimer.
          Dự án này là một phần của chương trình học tập và nghiên cứu tại trường Đại học Công nghệ Thông tin - ĐHQG TP.HCM.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          © 2025 AlzTracker - Lê Minh Toàn & Nguyễn Thành Luân
        </p>
      </div>
    </div>
  );
};

export default Contact;
