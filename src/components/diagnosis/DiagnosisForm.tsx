
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import PatientSelector from "../PatientSelector";

const formSchema = z.object({
  patientName: z.string().min(2, { message: "Tên bệnh nhân phải có ít nhất 2 ký tự" }),
  patientAge: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "Tuổi phải là số dương",
  }),
  mmseScore: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 0 && parseInt(val) <= 30, {
    message: "Điểm MMSE phải từ 0-30",
  }),
  cdRating: z.string().min(1, { message: "Đánh giá CDR là bắt buộc" }),
  memoryTest: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 0 && parseInt(val) <= 5, {
    message: "Điểm kiểm tra phải từ 0-5",
  }),
  orientationTest: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 0 && parseInt(val) <= 5, {
    message: "Điểm kiểm tra phải từ 0-5",
  }),
  communicationTest: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 0 && parseInt(val) <= 5, {
    message: "Điểm kiểm tra phải từ 0-5",
  }),
  attentionTest: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 0 && parseInt(val) <= 5, {
    message: "Điểm kiểm tra phải từ 0-5",
  }),
  visualSpatialTest: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 0 && parseInt(val) <= 5, {
    message: "Điểm kiểm tra phải từ 0-5",
  }),
  recommendations: z.string(),
  doctorNotes: z.string(),
});

interface DiagnosisFormProps {
  currentUser: any;
  onSubmit: (values: z.infer<typeof formSchema>) => void;
}

const DiagnosisForm = ({ currentUser, onSubmit }: DiagnosisFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientName: "",
      patientAge: "",
      mmseScore: "",
      cdRating: "",
      memoryTest: "",
      orientationTest: "",
      communicationTest: "",
      attentionTest: "",
      visualSpatialTest: "",
      recommendations: "",
      doctorNotes: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-md font-semibold">Thông Tin Bệnh Nhân</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="patientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên Bệnh Nhân</FormLabel>
                  <FormControl>
                    <PatientSelector 
                      doctorId={currentUser?.uid || ""} 
                      onSelectPatient={(id, name, age) => {
                        field.onChange(name);
                        form.setValue('patientAge', age.toString(), { shouldValidate: true });
                      }} 
                      value={field.value}
                      className="border-gray-300 focus:border-[#02646f] focus:ring-[#02646f] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="patientAge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tuổi</FormLabel>
                  <FormControl>
                    <Input type="text" {...field} readOnly className="bg-gray-100" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-md font-semibold">Đánh Giá Tổng Quát</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="mmseScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Điểm MMSE (0-30)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" max="30" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="cdRating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Đánh Giá CDR</FormLabel>
                  <FormControl>
                    <Input placeholder="CDR 0.5, CDR 1, CDR 2, ..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-md font-semibold">Lĩnh Vực Kiểm Tra Chi Tiết (0-5)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: "memoryTest", label: "Trí Nhớ" },
              { name: "orientationTest", label: "Định Hướng" },
              { name: "communicationTest", label: "Giao Tiếp" },
              { name: "attentionTest", label: "Sự Chú Ý" },
              { name: "visualSpatialTest", label: "Thị Giác-Không Gian" },
            ].map((field) => (
              <FormField
                key={field.name}
                control={form.control}
                name={field.name as keyof z.infer<typeof formSchema>}
                render={({ field: formField }) => (
                  <FormItem>
                    <FormLabel>{field.label}</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="5" {...formField} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-md font-semibold">Ghi Chú & Khuyến Nghị</h3>
          
          <FormField
            control={form.control}
            name="recommendations"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Khuyến Nghị Điều Trị</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Nhập khuyến nghị điều trị cho bệnh nhân" 
                    className="min-h-[80px]" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="doctorNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ghi Chú Bác Sĩ</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Nhập ghi chú cá nhân của bác sĩ" 
                    className="min-h-[80px]" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-[#02646F] hover:bg-[#FFAA67] text-white transition-colors"
        >
          Lưu Kết Quả Chẩn Đoán
        </Button>
      </form>
    </Form>
  );
};

export default DiagnosisForm;
