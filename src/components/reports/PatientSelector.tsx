
import React from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

interface Patient {
  id: string;
  name: string;
}

interface PatientSelectorProps {
  patients: Patient[];
  selectedPatient: string | null;
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPatientSelect: (name: string) => void;
  currentUser: any;
}

const PatientSelector: React.FC<PatientSelectorProps> = ({
  patients,
  selectedPatient,
  searchTerm,
  onSearchChange,
  onPatientSelect,
  currentUser,
}) => {
  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Tìm kiếm bệnh nhân..."
            className="pl-8 border-[#02646F]/20 focus-visible:ring-[#FFAA67]"
            value={searchTerm}
            onChange={onSearchChange}
          />
        </div>
      </div>
      
      <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
        {filteredPatients.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            Không tìm thấy bệnh nhân
          </div>
        ) : (
          filteredPatients.map((patient) => (
            <motion.div
              key={patient.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                className={`p-3 rounded-md cursor-pointer transition-colors flex items-center ${
                  selectedPatient === patient.name 
                    ? "bg-[#02646F] text-white" 
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
                onClick={() => onPatientSelect(patient.name)}
              >
                <div className="flex-1">
                  <div className="font-medium">{patient.name}</div>
                  <div className="text-sm opacity-80">
                    {selectedPatient === patient.name ? "Đang xem báo cáo" : "Nhấp để xem báo cáo"}
                  </div>
                </div>
                <ChevronRight className={`h-5 w-5 ${selectedPatient === patient.name ? "text-white" : "text-gray-400"}`} />
              </div>
            </motion.div>
          ))
        )}
      </div>

      {currentUser?.displayName && !patients.length && (
        <div className="text-center py-4">
          <motion.div 
            whileHover={{ scale: 1.03 }}
            className="p-3 rounded-md bg-gradient-to-r from-[#02646F] to-[#02646F]/90 text-white"
          >
            <div className="font-medium">{currentUser.displayName}</div>
            <div className="text-sm opacity-80 mt-1">
              Đang xem báo cáo của bạn
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PatientSelector;

