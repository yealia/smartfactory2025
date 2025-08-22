import { Outlet } from "react-router-dom";
import HeaderAlarm from "./HeaderAlarm";
import Sidebar from "./Sidebar";

export default function Layout() {
  return (
    <div className="flex h-screen">
      {/* 사이드바 */}
      <Sidebar />

      {/* 메인 영역 */}
      <div className="flex flex-col flex-1">
        {/* 상단 헤더 */}
        <HeaderAlarm />
        {/* 타이틀 */}
        <div className="bg-gradient-to-l from-indigo-200 to-sky-200 text-3xl font-bold bg-sky-200 p-4">
          <span className="">스마트팩토리 ERP</span>
        </div>

        {/* 본문 */}
        <main className="flex-1 p-4 bg-gray-50 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
