
import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer } from "recharts";
import { BarChart2 } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { format } from "date-fns";

interface ChartSectionProps {
  chartOption: 'mmse' | 'cognitive';
  mmseData: any[];
  cognitiveData: any[];
}

const ChartSection: React.FC<ChartSectionProps> = ({ chartOption, mmseData, cognitiveData }) => {
  return (
    <div className="h-[400px] mb-8 p-4 bg-white rounded-xl shadow-md">
      {chartOption === 'mmse' ? (
        mmseData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ChartContainer
              config={{
                mmseScore: {
                  label: "Điểm MMSE",
                  color: "#02646F",
                }
              }}
            >
              <LineChart data={mmseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 30]} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent 
                      labelKey="date"
                      formatter={(value, name) => {
                        return [value, name === "mmseScore" ? "Điểm MMSE" : name];
                      }}
                    />
                  }
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="mmseScore" 
                  stroke="#02646F" 
                  activeDot={{ r: 8 }} 
                  strokeWidth={2}
                />
              </LineChart>
            </ChartContainer>
          </ResponsiveContainer>
        ) : (
          <EmptyChartState />
        )
      ) : (
        cognitiveData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ChartContainer
              config={{
                memory: {
                  label: "Trí Nhớ",
                  color: "#02646F",
                },
                orientation: {
                  label: "Định Hướng",
                  color: "#FFAA67",
                },
                communication: {
                  label: "Giao Tiếp",
                  color: "#3B82F6",
                },
                attention: {
                  label: "Sự Chú Ý",
                  color: "#10B981",
                },
                visualSpatial: {
                  label: "Thị Giác-Không Gian",
                  color: "#8B5CF6",
                }
              }}
            >
              <BarChart data={cognitiveData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 5]} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent 
                      labelKey="date"
                      formatter={(value, name) => {
                        const labels: Record<string, string> = {
                          memory: "Trí Nhớ",
                          orientation: "Định Hướng",
                          communication: "Giao Tiếp",
                          attention: "Sự Chú Ý",
                          visualSpatial: "Thị Giác-Không Gian"
                        };
                        return [value, labels[name] || name];
                      }}
                    />
                  }
                />
                <Legend />
                <Bar dataKey="memory" fill="#02646F" />
                <Bar dataKey="orientation" fill="#FFAA67" />
                <Bar dataKey="communication" fill="#3B82F6" />
                <Bar dataKey="attention" fill="#10B981" />
                <Bar dataKey="visualSpatial" fill="#8B5CF6" />
              </BarChart>
            </ChartContainer>
          </ResponsiveContainer>
        ) : (
          <EmptyChartState />
        )
      )}
    </div>
  );
};

const EmptyChartState = () => (
  <div className="h-full flex items-center justify-center text-gray-500">
    <div className="text-center">
      <BarChart2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
      <p>Không có dữ liệu cho biểu đồ này</p>
    </div>
  </div>
);

export default ChartSection;

