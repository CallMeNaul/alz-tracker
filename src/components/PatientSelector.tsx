
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../services/firebase";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface Patient {
  id: string;
  displayName: string;
  age: number;
}

interface PatientSelectorProps {
  doctorId: string;
  onSelectPatient: (patientId: string, patientName?: string, patientAge?: number) => void;
  value?: string;
  className?: string;
  placeholder?: string;
}

const PatientSelector = ({ 
  doctorId, 
  onSelectPatient, 
  value, 
  className,
  placeholder = "Chọn bệnh nhân" 
}: PatientSelectorProps) => {
  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients', doctorId],
    queryFn: async () => {
      const q = query(
        collection(db, "users"),
        where("role", "==", "patient"),
        where("doctorId", "==", doctorId)
      );
      const querySnapshot = await getDocs(q);
      const patientsData: Patient[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        patientsData.push({
          id: doc.id,
          displayName: data.displayName,
          age: data.age || 0
        });
      });
      return patientsData;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Đang tải danh sách bệnh nhân...
      </div>
    );
  }

  return (
    <Select 
      value={value}
      onValueChange={(value) => {
        const patient = patients?.find(p => p.id === value);
        if (patient) {
          onSelectPatient(patient.id, patient.displayName, patient.age);
        }
      }}
    >
      <SelectTrigger className={className || "w-full"}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {patients?.map((patient) => (
          <SelectItem key={patient.id} value={patient.id}>
            {patient.displayName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default PatientSelector;
