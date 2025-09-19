import React, { useState, useEffect, useCallback } from "react"; // ✨ useCallback 추가
import axios from "axios";

import SearchLayout from "../layouts/SearchLayout";
import SearchTextBox from "../components/search/SearchTextBox";
import SearchDatePicker from "../components/search/SearchDatePicker";
import SearchButton from "../components/search/SearchButton";
import InsertButton from "../components/search/InsertButton";
import BodyGrid from "../layouts/BodyGrid"; // ✨ EditableGrid 대신 BodyGrid 사용

const API_BASE = "http://localhost:8081/api/projects";

export default function ProjectRegister() {
  // --- 상태 관리 ---
  const [projects, setProjects] = useState([]);
  // ✨ 검색 파라미터를 하나의 객체로 관리
  const [searchParams, setSearchParams] = useState({
    projectId: "",
    projectNm: "",
    customerId: "",
    startDate: "",
    deliveryDate: "",
  });
  // ✨ 모달 상태 관리를 위한 state 추가
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  // --- 컬럼 정의 ---
  const columns = [
    { header: "프로젝트 ID", accessor: "projectId", readOnly: true }, // ✨ 수정 모달에서 ID는 읽기 전용으로 설정
    { header: "프로젝트명", accessor: "projectNm" },
    { header: "고객 ID", accessor: "customerId" },
    { header: "담당자 ID", accessor: "employeeId" },
    { header: "시작일", accessor: "startDate", type: "date" },
    { header: "납기일", accessor: "deliveryDate", type: "date" },
    { header: "우선순위", accessor: "priority", type: "number" },
    { header: "진행률(%)", accessor: "progressRate", type: "number" },
    { header: "총 예산", accessor: "totalBudget", type: "number" },
    { header: "통화", accessor: "currencyCode" },
    { header: "실제납기일", accessor: "actualDeliveryDate", type: "date" },
    { header: "비고", accessor: "remark" },
    { header: "생성일", accessor: "createdAt", readOnly: true },
    { header: "수정일", accessor: "updatedAt", readOnly: true },
  ];

  // --- 데이터 조회 ---
  const loadProjects = useCallback(async () => {
    try {
      // ✨ searchParams 객체를 사용하여 파라미터 구성
      const params = {
        projectId: searchParams.projectId || undefined,
        projectNm: searchParams.projectNm || undefined,
        customerId: searchParams.customerId || undefined,
        startDate: searchParams.startDate || undefined,
        deliveryDate: searchParams.deliveryDate || undefined,
      };
      const response = await axios.get(API_BASE, { params });
      // ✨ 서버에서 받은 데이터를 그대로 상태에 저장
      setProjects(response.data);
    } catch (err) {
      console.error("프로젝트 목록 조회 실패:", err);
      alert(`데이터 조회 중 오류 발생: ${err.message}`);
    }
  }, [searchParams]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]); // ✨ 의존성 배열에 loadProjects 추가

  // --- ✨ CRUD 핸들러 함수 (모달 기반) ---
  const handleSave = async () => {
    if (!editingProject) return;

    // 날짜 필드가 빈 문자열일 경우 null로 변환
    const payload = {
      ...editingProject,
      startDate: editingProject.startDate || null,
      deliveryDate: editingProject.deliveryDate || null,
      actualDeliveryDate: editingProject.actualDeliveryDate || null,
    };

    try {
      if (editingProject.isNew) { // 생성
        // isNew와 projectId는 서버로 보내지 않음
        const { projectId, isNew, ...createData } = payload; 
        await axios.post(API_BASE, createData);
        alert("새로운 프로젝트가 등록되었습니다.");
      } else { // 수정
        await axios.put(`${API_BASE}/${editingProject.projectId}`, payload);
        alert("프로젝트가 수정되었습니다.");
      }
      closeModalAndRefresh();
    } catch (err) {
      console.error("저장 실패:", err);
      alert(`저장 중 오류 발생: ${err.message}`);
    }
  };

  const handleDelete = async () => {
    if (!editingProject || editingProject.isNew) return;

    if (window.confirm(`정말로 프로젝트 ID '${editingProject.projectId}'를 삭제하시겠습니까?`)) {
      try {
        await axios.delete(`${API_BASE}/${editingProject.projectId}`);
        alert("프로젝트가 삭제되었습니다.");
        closeModalAndRefresh();
      } catch (err) {
        console.error("삭제 실패:", err);
        alert(`삭제 중 오류 발생: ${err.message}`);
      }
    }
  };

  // --- ✨ 모달 관리 함수 ---
  const openCreateModal = () => {
    // 새 프로젝트를 위한 기본값 설정
    const today = new Date().toISOString().split("T")[0];
    setEditingProject({
      isNew: true, projectId: "", projectNm: "", customerId: "", employeeId: "",
      startDate: today, deliveryDate: today, priority: 0, progressRate: 0,
      totalBudget: 0, currencyCode: "KRW", actualDeliveryDate: "", remark: ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (project) => {
    // 날짜 값이 null일 경우 빈 문자열로 변환하여 input에 표시
    const projectData = {
        ...project,
        startDate: project.startDate ? project.startDate.split("T")[0] : "",
        deliveryDate: project.deliveryDate ? project.deliveryDate.split("T")[0] : "",
        actualDeliveryDate: project.actualDeliveryDate ? project.actualDeliveryDate.split("T")[0] : "",
    };
    setEditingProject({ ...projectData, isNew: false });
    setIsModalOpen(true);
  };

  const closeModalAndRefresh = () => {
    setIsModalOpen(false);
    setEditingProject(null);
    loadProjects();
  };

  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setEditingProject(prev => ({ ...prev, [name]: value }));
  };

  // --- 렌더링 ---
  return (
    <div>
      <h2 className="font-bold text-2xl mb-4">프로젝트 관리</h2>
      <SearchLayout>
        {/* ✨ 검색 필드 value, onChange를 searchParams 객체와 연결 */}
        <SearchTextBox label="프로젝트 ID" value={searchParams.projectId} onChange={(e) => setSearchParams({ ...searchParams, projectId: e.target.value })} />
        <SearchTextBox label="프로젝트명" value={searchParams.projectNm} onChange={(e) => setSearchParams({ ...searchParams, projectNm: e.target.value })} />
        <SearchTextBox label="고객 ID" value={searchParams.customerId} onChange={(e) => setSearchParams({ ...searchParams, customerId: e.target.value })} />
        <SearchDatePicker label="시작일" value={searchParams.startDate} onChange={(e) => setSearchParams({ ...searchParams, startDate: e.target.value })} />
        <SearchDatePicker label="납기일" value={searchParams.deliveryDate} onChange={(e) => setSearchParams({ ...searchParams, deliveryDate: e.target.value })} />
        <SearchButton onClick={loadProjects} />
        <InsertButton onClick={openCreateModal} />
      </SearchLayout>

      <div className="mt-6">
        {/* ✨ EditableGrid를 BodyGrid로 변경하고 onRowClick 이벤트 핸들러 연결 */}
        <BodyGrid
          columns={columns}
          data={projects}
          onRowClick={openEditModal}
        />
      </div>

      {/* ✨ 모달 UI 추가 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-xl w-1/2 max-h-screen overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{editingProject.isNew ? "신규 프로젝트 등록" : "프로젝트 수정"}</h3>
            <div className="grid grid-cols-2 gap-4">
              {columns.map(col => (
                !col.readOnly && (
                  <div key={col.accessor}>
                    <label className="block text-sm font-medium text-gray-700">{col.header}</label>
                    <input
                      type={col.type || "text"}
                      name={col.accessor}
                      value={editingProject[col.accessor] || ''}
                      onChange={handleModalInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>
                )
              ))}
            </div>
            <div className="mt-6 flex justify-between">
              <div>
                {!editingProject.isNew && (
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