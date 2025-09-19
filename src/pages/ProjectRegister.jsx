import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

// 공용 컴포넌트 import
import SearchLayout from "../layouts/SearchLayout";
import SearchTextBox from "../components/search/SearchTextBox";
import SearchDatePicker from "../components/search/SearchDatePicker";
import SearchButton from "../components/search/SearchButton";
import InsertButton from "../components/search/InsertButton";
import BodyGrid from "../layouts/BodyGrid";

const API_BASE = "http://localhost:8081/api/projects";

export default function ProjectRegister() {
  // =================================================================================
  // I. 상태 관리 (State Management)
  // 컴포넌트의 모든 동적인 데이터를 관리하는 state 변수들을 선언합니다.
  // =================================================================================
  
  // 그리드에 표시될 프로젝트 데이터 목록
  const [projects, setProjects] = useState([]);

  // 검색창의 입력값을 관리하는 객체
  const [searchParams, setSearchParams] = useState({
    projectId: "",
    projectNm: "",
    customerId: "",
    startDate: "",
    deliveryDate: "",
  });

  // 모달 관련 상태를 하나로 통합
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeProject, setActiveProject] = useState(null); // 모달에서 사용할 데이터
  const [isEditMode, setIsEditMode] = useState(false); // 모달의 '보기/수정' 모드 제어

  // 그리드에서 선택된 행(외부 삭제 버튼용)
  const [selectedProject, setSelectedProject] = useState(null);
  const [isAdvancedSearch, setIsAdvancedSearch] = useState(false);

  // =================================================================================
  // II. 컬럼 정의 (Column Definitions)
  // 그리드와 모달에서 사용할 컬럼의 속성을 미리 정의합니다.
  // =================================================================================

  // 메인 화면 그리드에 표시할 핵심 컬럼 목록
  const gridColumns = [
    { header: "프로젝트 ID", accessor: "projectId" },
    { header: "프로젝트명", accessor: "projectNm" },
    { header: "고객 ID", accessor: "customerId" },
    { header: "우선순위", accessor: "priority" },
  ];

  // 상세 정보 및 수정 모달에 표시할 전체 컬럼 목록
  const allColumns = [
    { header: "프로젝트 ID", accessor: "projectId", readOnly: true },
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

  // =================================================================================
  // III. 데이터 통신 및 핵심 로직 (Data Fetching & Core Logic)
  // =================================================================================

  // 서버로부터 프로젝트 목록을 조회하는 함수
  const loadProjects = useCallback(async () => {
    try {
      const params = {
        projectId: searchParams.projectId || undefined,
        projectNm: searchParams.projectNm || undefined,
        customerId: searchParams.customerId || undefined,
        startDate: searchParams.startDate || undefined,
        deliveryDate: searchParams.deliveryDate || undefined,
      };
      const response = await axios.get(API_BASE, { params });
      setProjects(response.data); // state 업데이트
      setSelectedProject(null);   // 새로운 목록을 불러왔으므로 행 선택 상태는 초기화
    } catch (err) {
      console.error("프로젝트 목록 조회 실패:", err);
      alert(`데이터 조회 중 오류 발생: ${err.message}`);
    }
  }, [searchParams]); // searchParams가 변경될 때마다 함수를 새로 생성

  // 컴포넌트가 처음 마운트될 때 프로젝트 목록을 한번만 조회
  useEffect(() => {
    loadProjects();
  }, []);

  // =================================================================================
  // IV. 이벤트 핸들러 (Event Handlers)
  // 사용자의 액션(클릭, 입력 등)에 반응하는 함수들
  // =================================================================================

  // 그리드의 행을 '클릭'했을 때 실행되는 함수
  const handleRowClick = (project) => {
    // 날짜 형식을 'yyyy-MM-dd'로 맞춤
    const formattedProject = {
      ...project,
      startDate: project.startDate ? project.startDate.split("T")[0] : "",
      deliveryDate: project.deliveryDate ? project.deliveryDate.split("T")[0] : "",
      actualDeliveryDate: project.actualDeliveryDate ? project.actualDeliveryDate.split("T")[0] : "",
    };
    setActiveProject({ ...formattedProject, isNew: false });
    setIsEditMode(false); // 보기 모드로 시작
    setIsModalOpen(true);
    setSelectedProject(project); // 외부 삭제 버튼을 위해 선택 상태도 업데이트
  };

  // '초기화' 버튼 클릭 시 검색창의 내용을 모두 비우는 함수
  const handleSearchReset = () => {
    setSearchParams({
      projectId: "", projectNm: "", customerId: "",
      startDate: "", deliveryDate: "",
    });
  };

  // 상단의 '삭제' 버튼 클릭 시 선택된 행을 삭제하는 함수
  const handleDeleteSelected = async () => {
    if (!selectedProject) {
      alert("삭제할 프로젝트를 목록에서 선택해주세요.");
      return;
    }
    if (window.confirm(`정말로 프로젝트 '${selectedProject.projectNm}'을(를) 삭제하시겠습니까?`)) {
      try {
        await axios.delete(`${API_BASE}/${selectedProject.projectId}`);
        alert("프로젝트가 삭제되었습니다.");
        loadProjects();
      } catch (err) {
        console.error("삭제 실패:", err);
      }
    }
  };

  // =================================================================================
  // V. 모달 관련 함수 (Modal Functions)
  // 모달의 생성, 수정, 삭제, 상태 변경 등 모달과 관련된 모든 함수
  // =================================================================================

  const handleSave = async () => {
    if (!activeProject) return;
    try {
      if (activeProject.isNew) {
        await axios.post(API_BASE, activeProject);
        alert("새로운 프로젝트가 등록되었습니다.");
      } else {
        await axios.put(`${API_BASE}/${activeProject.projectId}`, activeProject);
        alert("프로젝트가 수정되었습니다.");
      }
      closeModalAndRefresh();
    } catch (err) {
      console.error("저장 실패:", err);
    }
  };

  const openCreateModal = () => {
    const today = new Date().toISOString().split("T")[0];
    setActiveProject({
      isNew: true, projectId: "", projectNm: "", customerId: "", employeeId: "",
      startDate: today, deliveryDate: today, priority: 0, progressRate: 0,
      totalBudget: 0, currencyCode: "KRW", actualDeliveryDate: "", remark: ""
    });
    setIsEditMode(true); // 생성 시에는 바로 수정 모드
    setIsModalOpen(true);
  };

  const closeModalAndRefresh = () => {
    setIsModalOpen(false);
    setActiveProject(null);
    setIsEditMode(false);
    loadProjects();
  };

  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setActiveProject(prev => ({ ...prev, [name]: value }));
  };

  // --- 렌더링 ---
  return (
    <div>
      <h2 className="font-bold text-2xl mb-4">프로젝트 관리</h2>

      <SearchLayout>
        {/* 검색 필드 */}
        <SearchTextBox label="프로젝트 ID" value={searchParams.projectId} onChange={(e) => setSearchParams({ ...searchParams, projectId: e.target.value })} />
        <SearchTextBox label="프로젝트명" value={searchParams.projectNm} onChange={(e) => setSearchParams({ ...searchParams, projectNm: e.target.value })} />
        {isAdvancedSearch && (
          <>
            <SearchTextBox label="고객 ID" value={searchParams.customerId} onChange={(e) => setSearchParams({ ...searchParams, customerId: e.target.value })} />
            <SearchDatePicker label="시작일" value={searchParams.startDate} onChange={(e) => setSearchParams({ ...searchParams, startDate: e.target.value })} />
            <SearchDatePicker label="납기일" value={searchParams.deliveryDate} onChange={(e) => setSearchParams({ ...searchParams, deliveryDate: e.target.value })} />
          </>
        )}
        
        {/* 버튼들을 감싸던 div를 제거하고, 각각을 SearchLayout의 자식으로 배치합니다. */}
        <SearchButton onClick={loadProjects} />
        <button onClick={handleDeleteSelected} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-400" disabled={!selectedProject}>
            삭제
        </button>
        <button onClick={handleSearchReset} className="px-4 py-2 text-sm font-medium text-white bg-gray-500 rounded-lg hover:bg-gray-600">
            초기화
        </button>
        <button onClick={() => setIsAdvancedSearch(!isAdvancedSearch)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
            {isAdvancedSearch ? '간편 검색' : '상세 검색'}
        </button>
        <InsertButton onClick={openCreateModal} />

      </SearchLayout>

      <div className="mt-6">
        <BodyGrid
          columns={gridColumns}
          data={projects}
          onRowClick={handleRowClick}
          selectedId={selectedProject?.projectId}
        />
      </div>

      {/* ✨ 3. 하나로 통합된 모달 (요청사항 4번) */}
      {isModalOpen && activeProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-1/2 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {activeProject.isNew ? "신규 프로젝트 등록" : "프로젝트 상세 정보"}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {allColumns.map(col => (
                <div key={col.accessor}>
                  <label className="block text-sm font-medium text-gray-700">{col.header}</label>
                  {isEditMode ? (
                    // 수정 모드일 때: Input 필드
                    <input
                      type={col.type || "text"}
                      name={col.accessor}
                      value={activeProject[col.accessor] || ''}
                      onChange={handleModalInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      readOnly={!activeProject.isNew && col.accessor === 'projectId'}
                    />
                  ) : (
                    // 보기 모드일 때: 텍스트
                    <p className="mt-1 p-2 min-h-[42px] text-gray-800 bg-gray-100 rounded-md">
                      {activeProject[col.accessor] || "-"}
                    </p>
                  )}
                </div>
              ))}
            </div>
            
            {/* ✨ 모달 내부 버튼 (isEditMode에 따라 다르게 보임) */}
            <div className="mt-6 flex justify-end gap-x-2">
              {isEditMode ? (
                // 수정 모드 버튼
                <>
                  <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    저장
                  </button>
                  <button onClick={() => setIsEditMode(false)} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
                    수정 취소
                  </button>
                </>
              ) : (
                // 보기 모드 버튼
                <>
                  <button onClick={() => setIsEditMode(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                    수정
                  </button>
                  <button onClick={closeModalAndRefresh} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
                    닫기
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}