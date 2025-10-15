import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import { UserGroupIcon, ClipboardDocumentListIcon, ExclamationTriangleIcon } from "@heroicons/react/24/solid";

// API를 통해 받아올 데이터 예시
const kpiData = {
  activeWorkers: 2154,
  wbsInProgress: 85,
  stockAlerts: 12,
};

const weeklyProductionData = [
  { name: "10/09", 생산량: 15 }, { name: "10/10", 생산량: 18 },
  { name: "10/11", 생산량: 12 }, { name: "10/12", 생산량: 20 },
  { name: "10/13", 생산량: 25 }, { name: "10/14", 생산량: 22 },
  { name: "10/15", 생산량: 19 },
];

const projectStatusData = [
  { name: "진행 중", value: 8 }, { name: "계획", value: 5 },
  { name: "완료", value: 12 },
];
const PIE_COLORS = ["#60a5fa", "#a78bfa", "#4ade80"];

const materialCostByProcessData = [
  { name: "조립", "투입 비용": 5200 }, { name: "절단", "투입 비용": 4500 },
  { name: "탑재", "투입 비용": 3500 }, { name: "가공", "투입 비용": 2800 },
  { name: "도장", "투입 비용": 1800 },
];

export default function MainPage() {
  const cardBox ="bg-white rounded-2xl shadow-md p-6 flex flex-col justify-between hover:shadow-lg transition-shadow duration-300";
  const valueText = "text-3xl font-bold text-gray-900";
  const titleText = "text-base text-gray-600";
  const iconWrapper = "p-3 rounded-full shadow-md";
  const changeText = "mt-3 inline-flex items-center font-semibold";


  

  


  return (
    <div className="w-full h-dvh bg-gray-100 overflow-auto p-4 box-border flex flex-col gap-4">

      {/* 🔹 1행: KPI 카드 3개 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className={cardBox}>
          <div className="flex items-center justify-between">
            <div>
              <p className={titleText}>금일 작업 참여 인원</p>
              <h5 className={valueText}>{kpiData.activeWorkers.toLocaleString()}명</h5>
            </div>
            <div className={`${iconWrapper} bg-blue-500`}><UserGroupIcon className="text-white w-6 h-6" /></div>
          </div>
          <span className={`${changeText} text-green-600`}>▲ 어제보다 85명 증가</span>
        </div>
        <div className={cardBox}>
          <div className="flex items-center justify-between">
            <div>
              <p className={titleText}>진행중인 작업지시</p>
              <h5 className={valueText}>{kpiData.wbsInProgress}건</h5>
            </div>
            <div className={`${iconWrapper} bg-purple-500`}><ClipboardDocumentListIcon className="text-white w-6 h-6" /></div>
          </div>
          <span className={`${changeText} text-green-600`}>▲ 목표대비 5건 미달</span>
        </div>
        <div className={cardBox}>
          <div className="flex items-center justify-between">
            <div>
              <p className={titleText}>안전 재고 경고</p>
              <h5 className={valueText}>{kpiData.stockAlerts}건</h5>
            </div>
            <div className={`${iconWrapper} bg-red-500`}><ExclamationTriangleIcon className="text-white w-6 h-6" /></div>
          </div>
          <span className={`${changeText} text-red-600`}>▼ 즉시 발주 필요</span>
        </div>
      </div>

      {/* 🔹 2행: 그래프 2개 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className={cardBox + " lg:col-span-3"}>
          <h5 className="font-semibold mb-2">주간 블록 생산 실적</h5>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyProductionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="생산량" stroke="#e11d48" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className={cardBox + " lg:col-span-2"}>
          <h5 className="font-semibold mb-2">프로젝트 진행 상태</h5>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={projectStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {projectStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 🔹 3행: 가로 막대그래프 */}
      <div className={cardBox}>
        <h5 className="font-semibold mb-2">공정별 자재 투입 비용 (단위: 백만원)</h5>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={materialCostByProcessData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={60} />
            <Tooltip />
            <Bar dataKey="투입 비용" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}