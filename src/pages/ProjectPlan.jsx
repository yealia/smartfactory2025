import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
// import { getToken } from "../utils/api"; // getToken 유틸리티 import

import SearchLayout from "../layouts/SearchLayout";
import SearchTextBox from "../components/search/SearchTextBox";
import SearchDatePicker from "../components/search/SearchDatePicker";
import SearchButton from "../components/search/SearchButton";
import BodyGrid from "../layouts/BodyGrid";
import InsertButton from "../components/search/InsertButton";

// Spring Boot 컨트롤러에 설정된 API 주소
const API_BASE = "http://localhost:8081/api/project_plans";

export default function ProjectPlan() {
  // --- 상태 관리 ---
  const [plans, setPlans] = useState([]);
  const [searchParams, setSearchParams] = useState({
    projectId: "",
    vesselId: "",
    startDate: "",
    endDate: "",
    status: "",
  });

  // ✨ 모달 및 데이터 관리용 상태 추가
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null); // null이면 생성, 객체가 있으면 수정

  // BodyGrid에 표시될 컬럼 정의 (생성일/수정일 추가)
  const columns = [
    { header: "계획 ID", accessor: "planId", readOnly: true },
    { header: "프로젝트 ID", accessor: "projectId" },
    { header: "선박 ID", accessor: "vesselId" },
    { header: "계획 범위", accessor: "planScope" },
    { header: "시작일", accessor: "startDate", type: "date" },
    { header: "종료일", accessor: "endDate", type: "date" },
    { header: "진행률(%)", accessor: "progressRate" },
    { header: "상태", accessor: "status", type: "select", options: [
      { value: 0, label: "계획" }, { value: 1, label: "진행" }, { value: 2, label: "완료" }
    ]},
    { header: "비고", accessor: "remark" },
    { header: "생성일", accessor: "createdAt" }, 
    { header: "수정일", accessor: "updatedAt" }, 
  ];

  const getStatusText = (status) => {
    switch (status) {
      case 0: return "계획";
      case 1: return "진행";
      case 2: return "완료";
      default: return "알 수 없음";
    }
  };

  const toDateString = (value) => {
    if (!value) return "";
    if (value?.target && typeof value.target.value === "string") {
      return toDateString(value.target.value);
    }
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }
    if (typeof value === "string") {
      if (value.includes("T")) return value.slice(0, 10);
      return value;
    }
    return "";
  };

  const handleStartDateChange = (value) => setSearchStartDate(toDateString(value));
  const handleEndDateChange = (value) => setSearchEndDate(toDateString(value));

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const params = {
        projectId: searchProjectId || undefined,
        vesselId: searchVesselId || undefined,
        startDate: searchStartDate || undefined,
        endDate: searchEndDate || undefined,
        status: searchStatus || undefined,
      };
      
      console.log("Sending search params:", params);
      const { data } = await axios.get(API_BASE, { params });
      setPlans(data);
    } catch (err) {
      console.error("생산계획 목록 조회 실패:", err);
      alert(`데이터 조회 중 오류 발생: ${err.message}`);
    }
  }, [searchParams]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  // --- CRUD 핸들러 함수 (보안 로직 제거) ---
  const handleSave = async () => {
    if (!editingPlan) return;

    try {
      if (editingPlan.isNew) { // 생성
        const { planId, ...createData } = editingPlan;
        await axios.post(API_BASE, createData); // ✨ headers 제거
        alert("새로운 계획이 등록되었습니다.");
      } else { // 수정
        await axios.put(`${API_BASE}/${editingPlan.planId}`, editingPlan); // ✨ headers 제거
        alert("계획이 수정되었습니다.");
      }
      closeModalAndRefresh();
    } catch (err) {
      console.error("저장 실패:", err);
      alert(`저장 중 오류 발생: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    if (!editingPlan || editingPlan.isNew) return;

    if (window.confirm(`정말로 계획 ID '${editingPlan.planId}'를 삭제하시겠습니까?`)) {
      try {
        await axios.delete(`${API_BASE}/${editingPlan.planId}`); // ✨ headers 제거
        alert("계획이 삭제되었습니다.");
        closeModalAndRefresh();
      } catch (err) {
        console.error("삭제 실패:", err);
        alert(`삭제 중 오류 발생: ${err.message}`);
      }
    }
  };

  // --- 모달 관리 함수 ---
  const openCreateModal = () => {
    setEditingPlan({ isNew: true, planId: "", projectId: "", vesselId: "", planScope: "", startDate: "", endDate: "", progressRate: 0, status: 0, remark: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (plan) => {
    setEditingPlan({ ...plan, isNew: false });
    setIsModalOpen(true);
  };

  

  const closeModalAndRefresh = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
    loadPlans();
  };

  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setEditingPlan(prev => ({ ...prev, [name]: value }));
  };

  // --- 렌더링 ---
  return (
    <div>
      <h2 className="font-bold text-2xl mb-4">생산 계획 관리</h2>
      <SearchLayout>
        <SearchTextBox label="프로젝트 ID" value={searchParams.projectId} onChange={(e) => setSearchParams({...searchParams, projectId: e.target.value})} />
        <SearchTextBox label="선박 ID" value={searchParams.vesselId} onChange={(e) => setSearchParams({...searchParams, vesselId: e.target.value})} />
        <SearchDatePicker label="시작일" value={searchParams.startDate} onChange={(e) => setSearchParams({...searchParams, startDate: e.target.value})} />
        <SearchDatePicker label="종료일" value={searchParams.endDate} onChange={(e) => setSearchParams({...searchParams, endDate: e.target.value})} />
        <SearchTextBox label="상태 (0~2)" value={searchParams.status} onChange={(e) => setSearchParams({...searchParams, status: e.target.value})} />
        <SearchButton onClick={loadPlans} />
        <InsertButton onClick={openCreateModal} />
      </SearchLayout>
      
      <div className="mt-6">
        <BodyGrid
          columns={columns}
          data={plans.map((plan) => ({
            ...plan,
            status: getStatusText(plan.status),
            _key: plan.planId,
            // DB에서 가져오는 필드 이름이 snake_case일 경우 매핑
            createdAt: plan.createdAt || plan.created_at,
            updatedAt: plan.updatedAt || plan.updated_at
          }))}
          onRowClick={handleRowClick}
        />
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-xl w-1/2">
            <h3 className="text-xl font-bold mb-4">{editingPlan.isNew ? "신규 계획 등록" : "계획 수정"}</h3>
            <div className="grid grid-cols-2 gap-4">
              {columns.map(col => (
                !col.readOnly && (
                  <div key={col.accessor}>
                    <label className="block text-sm font-medium text-gray-700">{col.header}</label>
                    {col.type === 'select' ? (
                      <select name={col.accessor} value={editingPlan[col.accessor] || ''} onChange={handleModalInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                        {col.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    ) : (
                      <input
                        type={col.type || "text"}
                        name={col.accessor}
                        value={editingPlan[col.accessor] || ''}
                        onChange={handleModalInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      />
                    )}
                  </div>
                )
              ))}
            </div>
            <div className="mt-6 flex justify-between">
              <div>
                {!editingPlan.isNew && (
                  <button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                    삭제
                  </button>
                )}
              </div>
              <div>
                <button onClick={closeModalAndRefresh} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded mr-2">
                  취소
                </button>
                <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}