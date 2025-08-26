import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { UserIcon, CreditCardIcon, CurrencyDollarIcon } from "@heroicons/react/24/solid";
import { useAuth } from "../auth/AuthContext";

const dataLine = [
  { name: "Mon", value: 400 },
  { name: "Tue", value: 300 },
  { name: "Wed", value: 500 },
  { name: "Thu", value: 200 },
  { name: "Fri", value: 700 },
];

const dataBar = [
  { name: "A", uv: 4000 },
  { name: "B", uv: 3000 },
  { name: "C", uv: 2000 },
  { name: "D", uv: 2780 },
];

const dataPie = [
  { name: "완료", value: 400 },
  { name: "진행중", value: 300 },
  { name: "지연", value: 200 },
];

const COLORS = ["#4ade80", "#60a5fa", "#f87171"];


export default function MainPage() {
  
  const { user } = useAuth();
  
  const cardBox ="bg-white rounded-2xl shadow-md p-6 flex flex-col justify-between hover:shadow-lg transition-shadow duration-300";
  const valueText = "text-3xl font-bold text-gray-900";
  const titleText = "text-base text-gray-600";
  const iconWrapper = "p-3 rounded-full shadow-md";
  const changeText = "mt-3 inline-flex items-center font-semibold";

  return (
    <div className="w-full h-dvh bg-gray-100 overflow-hidden p-4 box-border flex flex-col gap-4">

      {/* 🔹 1행: KPI 카드 3개 */}
        <div className="border grid grid-cols-3 gap-6 h-1/9">
        {/* Users */}
        <div className={cardBox}>
            <div className="flex items-center justify-between">
            <div>
                <p className={titleText}>{user.email.split("@")[0]}님</p>
                <h5 className={valueText}>32.4k</h5>
            </div>
            <div className={`${iconWrapper} bg-blue-500`}>
                <UserIcon className="text-white w-6 h-6" />
            </div>
            </div>
            <span className={`${changeText} text-green-600`}>▲ 12%</span>
        </div>

        {/* Transactions */}
        <div className={cardBox}>
            <div className="flex items-center justify-between">
            <div>
                <p className={titleText}>스팩중공업(329180) | KOSPI</p>
                <h5 className={valueText}>12.7M</h5>
            </div>
            <div className={`${iconWrapper} bg-purple-500`}>
                <CreditCardIcon className="text-white w-6 h-6" />
            </div>
            </div>
            <span className={`${changeText} text-red-600`}>▼ 3%</span>
        </div>

        {/* Revenue */}
        <div className={cardBox}>
            <div className="flex items-center justify-between">
            <div>
                <p className={titleText}>스팩중공업(329180) | KOSPI</p>
                <h5 className={valueText}>485,5000</h5>
                {/* <p className={titleText}>Revenue</p> */}
            </div>
            <div className={`${iconWrapper} bg-green-500`}>
                <CurrencyDollarIcon className="text-white w-6 h-6" />
            </div>
            </div>
            <span className={`${changeText} text-green-600`}>▲ 2500</span>
        </div>
        </div>

      {/* 🔹 2행: 그래프 2개 */}
      <div className="grid grid-cols-2 gap-6 h-2/5">
        {/* 라인 차트 */}
        <div className={cardBox}>
          <h5 className="font-semibold mb-2">일별 사용자</h5>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={dataLine}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#ff0051"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 파이 차트 */}
        <div className={cardBox}>
          <h5 className="font-semibold mb-2">작업 현황</h5>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={dataPie}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {dataPie.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>  

      {/* 🔹 3행: 가로 막대그래프 (넓게 1개) */}
      <div className="h-2/5">
        <div className={cardBox + " h-full"}>
          <h5 className="font-semibold mb-2">부서별 실적</h5>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={dataBar} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" />
              <Tooltip />
              <Bar dataKey="uv" fill="#0389ff" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
{/*0389ff*/}
    </div>
  );
}
