
import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";

interface PageLayoutProps {
  children: React.ReactNode;
}

const PageLayout = ({ children }: PageLayoutProps) => {
  const location = useLocation();
  
  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-white">
      <Navbar />
      <div className="pt-6">  {/* Reduced from pt-16 to pt-12 */}
        {children}
      </div>
    </div>
  );
};

export default PageLayout;
