import { Link, Outlet } from "react-router-dom";
import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import HeaderAlarm from "../layouts/HeaderAlarm";
import logo from "../img/logo.png";
import mainPage from "../pages/MainPage";

const sideText = "hover:font-bold hover:text-yellow-500 hover:underline decoration-wavy p-2"; // 사이드바 텍스트


export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpen2, setIsOpen2] = useState(false);
  const [isOpen3, setIsOpen3] = useState(false);
  const [isOpenCustomer, setIsOpenCustomer] = useState(false);

  return (
    <div className="flex flex-col h-screen">
      {/* 상단 헤더 */}
      
      

      <div className="flex flex-1">
        {/* 사이드바 */}
        <aside className="w-64 bg-gradient-to-b from-sky-200 to-indigo-200 text-black p-6">
          <Link to = "/mainPage" className="text-2xl font-bold pb-10 block text-center h-20 mb-10">
            <img src={logo} alt="로고" className="mx-auto h-24" />
          </Link> 
          <div className="flex flex-col space-y-5">
            
            {/* 인사 관리 */}
            <nav>
              <div className="flex items-center justify-between">
                <span className="font-bold mb-3">인사</span>
                <button onClick={() => setIsOpen(!isOpen)} className="p-1 bg-transparent">
                  {isOpen ? (
                    <ChevronUpIcon className="w-5 h-5" />
                  ) : (
                    <ChevronDownIcon className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div
                className={`ml-2 flex flex-col transition-all duration-300 overflow-hidden ${
                  isOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <Link to="/team/employees" className={sideText}>직원 관리</Link>
                <Link to="/team/attendance" className={sideText}>근태 관리</Link>
                <Link to="/team/payroll" className={sideText}>급여 관리</Link>
              </div>
            </nav>

            {/* 고객 관리 */}
            <nav>
              <div className="flex items-center justify-between">
                <span className="font-bold mb-3">고객 관리</span>
                <button onClick={() => setIsOpenCustomer(!isOpen)} className="p-1 bg-transparent">
                  {isOpenCustomer ? (
                    <ChevronUpIcon className="w-5 h-5" />
                  ) : (
                    <ChevronDownIcon className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div
                className={`ml-2 flex flex-col transition-all duration-300 overflow-hidden ${
                  isOpenCustomer ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <Link to="/customerRegister" className={sideText}>고객 등록</Link>
              </div>
            </nav>

            {/* 자재 관리 */}
            <nav>
              <div className="flex items-center justify-between">
                <span className="font-bold mb-3">자재 관리</span>
                <button onClick={() => setIsOpen2(!isOpen2)} className="p-1 bg-transparent">
                  {isOpen2 ? (
                    <ChevronUpIcon className="w-5 h-5" />
                  ) : (
                    <ChevronDownIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              
                <div
                className={`ml-2 flex flex-col transition-all duration-300 overflow-hidden ${
                  isOpen2 ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                }`}
                >
                  <Link to="/materials" className={sideText}>자재 등록</Link>
                  <Link to="/materials/2" className={sideText}>자재 관리2</Link>
                  <Link to="/materials/3" className={sideText}>자재 관리3</Link>
                </div>
              
            </nav>

            {/* 프로젝트 관리 */}
            <nav>
              <div className="flex items-center justify-between">
                <span className="font-bold mb-3">프로젝트 관리</span>
                <button
                  onClick={() => setIsOpen3(!isOpen3)}
                  className="p-1 bg-transparent"
                >
                  {isOpen3 ? (
                    <ChevronUpIcon className="w-5 h-5" />
                  ) : (
                    <ChevronDownIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
                <div
                className={`ml-2 flex flex-col transition-all duration-300 overflow-hidden ${
                  isOpen3 ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                }`}
                >
                  <Link to="/projects/1" className={sideText}>프로젝트1</Link>
                  <Link to="/projects/2" className={sideText}>프로젝트2</Link>
                  <Link to="/projects/3" className={sideText}>프로젝트3</Link>
                </div>
              
            </nav>

            {/* 단일 메뉴 */}
            <Link to="/materials">
              공급업체 관리
            </Link>
            <Link to="/suppliers" >
              공급업체 관리
            </Link>
            <Link to="/projects" >
              프로젝트 관리
            </Link>
          </div>
        </aside>

        {/* 본문 영역
        <main className="flex-1 bg-gray-50 overflow-auto p-4">
          <Outlet />
        </main> */}
      </div>
    </div>
  );
}

