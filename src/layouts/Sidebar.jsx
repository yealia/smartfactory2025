import { Link, Outlet } from "react-router-dom";
import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import { NavLink } from "react-router-dom";
import logo from "../img/logo.png";

const sideText =
  "hover:font-bold hover:text-yellow-500 hover:underline decoration-wavy p-2"; // 사이드바 텍스트

/*style*/
const openToggle = "text-yellow-500 underline decoration-wavy p-2";
const openToggleStyle = ({ isActive }) =>
  `${sideText} ${isActive ? "text-yellow-500 underline font-bold" : ""}`;

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpen2, setIsOpen2] = useState(false);
  const [isOpen3, setIsOpen3] = useState(false); // 인사관리 state
  const [isOpen4, setIsOpen4] = useState(false);
  const [isOpenCustomer, setIsOpenCustomer] = useState(false);

  return (
    <div className="flex flex-col h-screen">
      {/* 상단 헤더 */}
      <div className="flex flex-1">
        {/* 사이드바 */}
        <aside className="w-64 bg-gradient-to-b from-sky-200 to-indigo-200 text-black p-6">
          <Link
            to="/mainPage"
            className="text-2xl font-bold pb-10 block text-center h-20 mb-10"
          >
            <img src={logo} alt="로고" className="mx-auto h-24" />
          </Link>

          <div className="flex flex-col space-y-5">
            {/* 기준 관리 */}
            <nav>
              <div className="flex items-center justify-between">
                <span className="font-bold mb-3">기준관리</span>
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="p-1 bg-transparent"
                >
                  {isOpen ? (
                    <ChevronUpIcon className="w-5 h-5" />
                  ) : (
                    <ChevronDownIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              <div
                className={`ml-2 flex flex-col transition-all duration-300 overflow-hidden ${
                  isOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0" // max-h 값 수정
                }`}
              >
                <NavLink to="/customerRegister" className={openToggleStyle}>
                  고객 관리
                </NavLink>
                <NavLink to="/suppliersRegister" className={openToggleStyle}>
                  공급업체 관리
                </NavLink>
                <NavLink to="/materials" className={openToggleStyle}>
                  자재 관리
                </NavLink>
                <NavLink to="/boms" className={openToggleStyle}>
                  BOM 관리
                </NavLink>
                <NavLink to="/vessel" className={openToggleStyle}>
                  선박 관리
                </NavLink>
              </div>
            </nav>

            {/* 수주 관리 */}
            <nav>
              <div className="flex items-center justify-between">
                <span className="font-bold mb-3">수주 관리</span>
                <button
                  onClick={() => setIsOpenCustomer(!isOpenCustomer)}
                  className="p-1 bg-transparent"
                >
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
                <NavLink to="/projectRegister" className={openToggleStyle}>
                  프로젝트 관리
                </NavLink>
                <NavLink to="/projectPlan" className={openToggleStyle}>
                  생산계획 관리
                </NavLink>
              </div>
            </nav>

            {/* 구매/재고관리 */}
            <nav>
              <div className="flex items-center justify-between">
                <span className="font-bold mb-3">구매/재고 관리</span>
                <button
                  onClick={() => setIsOpen2(!isOpen2)}
                  className="p-1 bg-transparent"
                >
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
                <NavLink to="/purchaseOrder" className={openToggleStyle}>
                  구매주문관리
                </NavLink>
                <NavLink to="/inventory" className={openToggleStyle}>
                  재고관리
                </NavLink>
                <NavLink to="/inventoryMovement" className={openToggleStyle}>
                  재고원장관리
                </NavLink>
              </div>
            </nav>

            
            {/* 전표관리 */}
            <nav>
              <div className="flex items-center justify-between">
                <span className="font-bold mb-3">판매관리</span>
                <button
                  onClick={() => setIsOpen4(!isOpen4)}
                  className="p-1 bg-transparent"
                >
                  {isOpen4 ? (
                    <ChevronUpIcon className="w-5 h-5" />
                  ) : (
                    <ChevronDownIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              <div
                className={`ml-2 flex flex-col transition-all duration-300 overflow-hidden ${
                  isOpen4 ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <NavLink to="/SalesOrder" className={openToggleStyle}>
                  판매 등록
                </NavLink>
              </div>
            </nav>

            {/* 인사관리 */}
            <nav>
              <div className="flex items-center justify-between">
                <span className="font-bold mb-3">인사관리</span>
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
                {/* ✅ [수정] 부서관리 메뉴 링크 경로 수정 */}
                <NavLink to="/department" className={openToggleStyle}>
                  부서 관리
                </NavLink>
                {/* ✅ [수정] 사원관리 메뉴 링크 경로 수정 */}
                <NavLink to="/employee" className={openToggleStyle}>
                  사원 관리
                </NavLink>
              </div>
            </nav>

          </div>
        </aside>
      </div>
    </div>
  );
}