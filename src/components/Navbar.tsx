import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu, FileText, Clipboard, Book, FileBarChart2, MessageSquare,
  Bell, Image, User, LogOut, UserPlus, Home, Info, ListChecks,
  FlaskConical, Contact, Zap, Settings
} from "lucide-react";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";

const Navbar = () => {
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isHomePage = location.pathname === '/';
  const isContactPage = location.pathname === '/contact';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isDropdownOpen &&
        avatarRef.current &&
        !avatarRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Đăng xuất thất bại:", error);
    }
  };

  const getInitial = () => {
    if (currentUser?.displayName) {
      return currentUser.displayName[0].toUpperCase();
    }
    if (currentUser?.email) {
      return currentUser.email[0].toUpperCase();
    }
    return "U";
  };

  const isAdmin = userData?.role === "admin";
  const isDoctor = userData?.role === "doctor";
  const isPatient = userData?.role === "patient";

  const navigateWithEffect = (path: string) => {
    document.body.classList.add('page-exit');

    setTimeout(() => {
      navigate(path);
      window.scrollTo(0, 0); // Ensure we're at the top
      document.body.classList.remove('page-exit');
      document.body.classList.add('page-enter');

      setTimeout(() => {
        document.body.classList.remove('page-enter');
      }, 500);
    }, 300);
  };

  const navigateHome = () => {
    navigate('/');
  };

  const scrollToSection = (id: string) => {
    if (location.pathname !== '/') {
      navigate('/');
      // Allow time for navigation to complete before scrolling
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleContactClick = () => {
    window.open('https://github.com/CallMeNaul', '_blank');
  };

  return (
    <nav className="bg-[#02646f] shadow-sm text-white fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <img
                src="https://i.postimg.cc/jqfHbSsP/black-on-white-removebg-preview.png"
                alt="AlzTracker Logo"
                className="h-8 w-8 mr-2"
              />
              <span className="text-xl font-bold text-white font-space-mono">AlzTracker</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-2">
            {isHomePage ? (
              <>
                <Button
                  variant="ghost"
                  className="text-white hover:text-white hover:bg-[#037884] transition-all duration-300"
                  onClick={() => scrollToSection('intro')}
                >
                  <Info className="mr-2 h-4 w-4" />
                  Giới Thiệu
                </Button>
                <Button
                  variant="ghost"
                  className="text-white hover:text-white hover:bg-[#037884] transition-all duration-300"
                  onClick={() => scrollToSection('features')}
                >
                  <ListChecks className="mr-2 h-4 w-4" />
                  Tính Năng
                </Button>
                <Button
                  variant="ghost"
                  className="text-white hover:text-white hover:bg-[#037884] transition-all duration-300"
                  onClick={() => scrollToSection('diagnosticParams')}
                >
                  <FlaskConical className="mr-2 h-4 w-4" />
                  Các Thông Số Chẩn Đoán
                </Button>
                <Button
                  variant="ghost"
                  className="text-white hover:text-white hover:bg-[#037884] transition-all duration-300"
                  onClick={() => navigateWithEffect('/contact')}
                >
                  <Contact className="mr-2 h-4 w-4" />
                  Liên Hệ
                </Button>
              </>
            ) : null}

            {isContactPage && (
              <Button
                variant="ghost"
                className="text-white hover:text-white hover:bg-[#037884] transition-all duration-300"
                onClick={navigateHome}
              >
                <Home className="mr-2 h-4 w-4" />
                Trang Chủ
              </Button>
            )}

            {currentUser && !isHomePage && (
              <>
                <Button
                  variant="ghost"
                  className={`text-white hover:text-white hover:bg-[#037884] transition-all duration-300 ${location.pathname === '/dashboard' ? 'bg-[#037884] shadow-md' : ''}`}
                  onClick={() => navigateWithEffect("/dashboard")}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Bảng Điều Khiển
                </Button>

                {isAdmin && (
                  <Button
                    variant="ghost"
                    className={`text-white hover:text-white hover:bg-[#037884] transition-all duration-300 ${location.pathname === '/admin/doctor-register' ? 'bg-[#037884] shadow-md' : ''}`}
                    onClick={() => navigateWithEffect("/admin/doctor-register")}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Đăng Ký Bác Sĩ
                  </Button>
                )}

                <NavigationMenu>
                  <NavigationMenuList>
                    <NavigationMenuItem>
                      <NavigationMenuTrigger className="bg-transparent text-white hover:text-white hover:bg-[#037884]">
                        <Settings className="mr-2 h-4 w-4" />
                        Tính Năng
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-1 p-2 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                          <li className="row-span-3">
                            <NavigationMenuLink asChild>
                              <a
                                className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-[#037884] to-[#02646f] p-6 no-underline outline-none focus:shadow-md"
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigateWithEffect("/progress-notes");
                                }}
                              >
                                <FileText className="h-6 w-6 text-white" />
                                <div className="mb-2 mt-4 text-lg font-medium text-white">
                                  Tính Năng AlzTracker
                                </div>
                                <p className="text-sm leading-tight text-white/90">
                                  Theo dõi và quản lý bệnh Alzheimer với các công cụ tiên tiến
                                </p>
                              </a>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink asChild>
                              <a
                                className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-[#02646f] hover:text-white"
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigateWithEffect("/progress-notes");
                                }}
                              >
                                <div className="flex items-center">
                                  <FileText className="mr-2 h-4 w-4" />
                                  <div className="text-sm font-medium leading-none">
                                    Ghi Chép Tiến Triển
                                  </div>
                                </div>
                              </a>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink asChild>
                              <a
                                className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-[#02646f] hover:text-white"
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigateWithEffect("/diagnosis");
                                }}
                              >
                                <div className="flex items-center">
                                  <Clipboard className="mr-2 h-4 w-4" />
                                  <div className="text-sm font-medium leading-none">
                                    Chẩn Đoán và Đánh Giá
                                  </div>
                                </div>
                              </a>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink asChild>
                              <a
                                className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-[#02646f] hover:text-white"
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigateWithEffect("/medical-history");
                                }}
                              >
                                <div className="flex items-center">
                                  <Book className="mr-2 h-4 w-4" />
                                  <div className="text-sm font-medium leading-none">
                                    Lịch Sử Bệnh Lý
                                  </div>
                                </div>
                              </a>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink asChild>
                              <a
                                className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-[#02646f] hover:text-white"
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigateWithEffect("/reports");
                                }}
                              >
                                <div className="flex items-center">
                                  <FileBarChart2 className="mr-2 h-4 w-4" />
                                  <div className="text-sm font-medium leading-none">
                                    Báo Cáo và Phân Tích
                                  </div>
                                </div>
                              </a>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink asChild>
                              <a
                                className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-[#02646f] hover:text-white"
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigateWithEffect("/forum");
                                }}
                              >
                                <div className="flex items-center">
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  <div className="text-sm font-medium leading-none">
                                    Diễn Đàn
                                  </div>
                                </div>
                              </a>
                            </NavigationMenuLink>
                          </li>
                          <li>
                            <NavigationMenuLink asChild>
                              <a
                                className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-[#02646f] hover:text-white"
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigateWithEffect("/reminders");
                                }}
                              >
                                <div className="flex items-center">
                                  <Bell className="mr-2 h-4 w-4" />
                                  <div className="text-sm font-medium leading-none">
                                    Nhắc Nhở
                                  </div>
                                </div>
                              </a>
                            </NavigationMenuLink>
                          </li>
                          {isPatient && (
                            <li>
                              <NavigationMenuLink asChild>
                                <a
                                  className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-[#02646f] hover:text-white"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    navigateWithEffect("/my-mri-scans");
                                  }}
                                >
                                  <div className="flex items-center">
                                    <Image className="mr-2 h-4 w-4" />
                                    <div className="text-sm font-medium leading-none">
                                      Ảnh MRI Của Tôi
                                    </div>
                                  </div>
                                </a>
                              </NavigationMenuLink>
                            </li>
                          )}
                          {isDoctor && (
                            <li>
                              <NavigationMenuLink asChild>
                                <a
                                  className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-[#02646f] hover:text-white"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    navigateWithEffect("/doctor/mri-management");
                                  }}
                                >
                                  <div className="flex items-center">
                                    <Image className="mr-2 h-4 w-4" />
                                    <div className="text-sm font-medium leading-none">
                                      Quản Lý MRI Bệnh Nhân
                                    </div>
                                  </div>
                                </a>
                              </NavigationMenuLink>
                            </li>
                          )}
                          {isAdmin && (
                            <li>
                              <NavigationMenuLink asChild>
                                <a
                                  className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-[#02646f] hover:text-white"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    navigateWithEffect("/admin/doctor-accounts");
                                  }}
                                >
                                  <div className="flex items-center">
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    <div className="text-sm font-medium leading-none">
                                      Quản Lý Tài Khoản Bác Sĩ
                                    </div>
                                  </div>
                                </a>
                              </NavigationMenuLink>
                            </li>
                          )}
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {currentUser ? (
              <>
                <div
                  ref={avatarRef}
                  className="relative"
                  onMouseEnter={() => setIsDropdownOpen(true)}
                >
                  <Avatar className="h-8 w-8 bg-[#ffaa67] text-white cursor-pointer hover:scale-110 transition-transform duration-200">
                    <AvatarFallback className="bg-[#ffaa67] text-white">{getInitial()}</AvatarFallback>
                  </Avatar>

                  <div
                    ref={dropdownRef}
                    onMouseEnter={() => setIsDropdownOpen(true)}
                    onMouseLeave={() => setIsDropdownOpen(false)}
                    className={`absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none transition-all duration-200 z-50 ${isDropdownOpen ? 'transform scale-100 opacity-100' : 'transform scale-95 opacity-0 pointer-events-none'}`}
                  >
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b">
                        {isAdmin ?
                          `Administrator` :
                          `${isDoctor ? "Bác Sĩ" : "Bệnh Nhân"}: ${currentUser.displayName || "Người Dùng"}`}
                      </div>
                      <button
                        onClick={() => navigateWithEffect("/profile")}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#02646f] hover:text-white transition-colors duration-200"
                      >
                        <User className="inline-block mr-2 h-4 w-4" />
                        Hồ Sơ
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => navigateWithEffect("/admin/doctor-register")}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#02646f] hover:text-white transition-colors duration-200"
                        >
                          <UserPlus className="inline-block mr-2 h-4 w-4" />
                          Đăng Ký Bác Sĩ
                        </button>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#02646f] hover:text-white transition-colors duration-200"
                      >
                        <LogOut className="inline-block mr-2 h-4 w-4" />
                        Đăng Xuất
                      </button>
                    </div>
                  </div>
                </div>

                <div className="md:hidden">
                  <Button
                    variant="ghost"
                    className="text-white"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="text-white hover:text-white hover:bg-[#037884] transition-all duration-300"
                  onClick={() => navigateWithEffect("/login")}
                >
                  <User className="mr-2 h-4 w-4" />
                  Đăng Nhập
                </Button>
                <Button
                  variant="default"
                  className="bg-white text-[#02646f] hover:bg-gray-100 transition-all duration-300 hover:scale-105"
                  onClick={() => navigateWithEffect("/patient-register")}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Đăng Ký
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {mobileMenuOpen && currentUser && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-[#037884]">
            {isHomePage ? (
              <>
                <button onClick={() => scrollToSection('intro')} className="block w-full text-left px-3 py-2 rounded-md text-white hover:bg-[#02646f]">
                  Giới Thiệu
                </button>
                <button onClick={() => navigateWithEffect('/contact')} className="block w-full text-left px-3 py-2 rounded-md text-white hover:bg-[#02646f]">
                  Liên Hệ
                </button>
                <button onClick={() => scrollToSection('features')} className="block w-full text-left px-3 py-2 rounded-md text-white hover:bg-[#02646f]">
                  Tính Năng
                </button>
                <button onClick={() => scrollToSection('diagnosticParams')} className="block w-full text-left px-3 py-2 rounded-md text-white hover:bg-[#02646f]">
                  Các Thông Số Chẩn Đoán
                </button>
              </>
            ) : null}
            <Link to="/dashboard" className="block px-3 py-2 rounded-md text-white hover:bg-[#02646f]">
              Bảng Điều Khiển
            </Link>
            {isPatient && (
              <Link to="/my-mri-scans" className="block px-3 py-2 rounded-md text-white hover:bg-[#02646f]">
                Ảnh MRI Của Tôi
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin/doctor-register" className="block px-3 py-2 rounded-md text-white hover:bg-[#02646f]">
                Đăng Ký Bác Sĩ
              </Link>
            )}
            <Link to="/progress-notes" className="block px-3 py-2 rounded-md text-white hover:bg-[#02646f]">
              Ghi Chép Tiến Triển
            </Link>
            <Link to="/diagnosis" className="block px-3 py-2 rounded-md text-white hover:bg-[#02646f]">
              Chẩn Đoán và Đánh Giá
            </Link>
            <Link to="/medical-history" className="block px-3 py-2 rounded-md text-white hover:bg-[#02646f]">
              Lịch Sử Bệnh Lý
            </Link>
            <Link to="/reports" className="block px-3 py-2 rounded-md text-white hover:bg-[#02646f]">
              Báo Cáo và Phân Tích
            </Link>
            <Link to="/forum" className="block px-3 py-2 rounded-md text-white hover:bg-[#02646f]">
              Diễn Đàn
            </Link>
            <Link to="/reminders" className="block px-3 py-2 rounded-md text-white hover:bg-[#02646f]">
              Nhắc Nhở
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
