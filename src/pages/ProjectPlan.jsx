import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

// ===================================================================
// I. UI Components (프로젝트 메뉴 스타일과 동일하게 재사용)
// ===================================================================

const SearchLayout = ({ children }) => (
    <div className="p-4 mb-4 bg-white rounded-lg shadow-md flex flex-wrap items-end gap-4 border border-gray-200">
        {children}
    </div>
);

const SearchTextBox = ({ label, ...props }) => (
    <div className="flex-grow min-w-[200px]">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input type="text" {...props} className="w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500" />
    </div>
);

const SearchDatePicker = ({ label, ...props }) => (
    <div className="flex-grow min-w-[200px]">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input type="date" {...props} className="w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500" />
    </div>
);

const StyledButton = ({ onClick, disabled, children, colorClass }) => (
    <button onClick={onClick} disabled={disabled} className={`flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 transition-all duration-200 ${colorClass} disabled:bg-gray-400 disabled:cursor-not-allowed`}>
        {children}
    </button>
);

// ✅ [수정] BodyGrid가 컬럼 정의에 render 함수를 지원하도록 수정
const BodyGrid = ({ columns, data, selectedId, sortConfig, onHeaderClick, onRowDoubleClick }) => (
    <div className="h-[calc(100vh-280px)] overflow-auto border rounded-lg shadow-md bg-white">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100 sticky top-0">
                <tr>
                    {columns.map((col) => (
                        <th 
                            key={col.accessor} 
                            onClick={() => onHeaderClick && onHeaderClick(col.accessor)}
                            className={`px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider ${onHeaderClick ? 'cursor-pointer' : ''}`}
                        >
                            {col.header}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {data.length === 0 ? (
                    <tr>
                        <td colSpan={columns.length} className="text-center py-4 text-gray-500">
                            데이터가 없습니다.
                        </td>
                    </tr>
                ) : (
                    data.map((row) => (
                        // ✅ [수정] 행 전체 클릭(onRowClick) 기능 제거
                        <tr
                            key={row.planId}
                            // ✨ onDoubleClick 핸들러를 추가합니다.
                            onDoubleClick={() => onRowDoubleClick(row)} 
                            className={`cursor-pointer ${selectedId && row.planId === selectedId ? 'bg-sky-100' : 'hover:bg-gray-50'}`}
                        >
                            {columns.map((col) => (
                                <td key={col.accessor} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {/* ✅ [추가] col.render가 있으면 함수 실행, 없으면 기존 방식대로 텍스트 표시 */}
                                    {col.render ? col.render(row) : row[col.accessor]}
                                </td>
                            ))}
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
);


// ===================================================================
// II. 메인 컴포넌트
// ===================================================================
const API_BASE = "http://localhost:8081/api/project_plans";
const PROJECTS_API_URL = "http://localhost:8081/api/projects";
const VESSELS_API_URL = "http://localhost:8081/api/vessels";
// API 서버(8083)와 통신할 axios 인스턴스
const apiGatewayClient = axios.create({
    baseURL: 'http://localhost:8083/api/proxy',
});

export default function ProjectPlan() {
    const [plans, setPlans] = useState([]);
    const [projects, setProjects] = useState([]);
    const [vessels, setVessels] = useState([]);
    const [searchParams, setSearchParams] = useState({
        projectId: "", vesselId: "", startDate: "", endDate: "", status: "",
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [selectedGridPlan, setSelectedGridPlan] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'planId', direction: 'ascending' });

    const statusOptions = [
        { value: 0, label: "계획" }, { value: 1, label: "진행" }, { value: 2, label: "완료" }
    ];

    const getStatusText = (statusValue) => {
        const option = statusOptions.find(o => o.value === statusValue);
        return option ? option.label : "알 수 없음";
    };
    
    // ✅ [수정] handleRowClick 함수를 '수정' 버튼의 onClick 핸들러로 사용
    const handleEditClick = (gridRow) => {
    // plans 배열에서 원본 데이터를 찾습니다.
    const originalPlan = plans.find(p => p.planId === gridRow.planId);
    if (!originalPlan) return;

    setSelectedGridPlan(originalPlan);
    const formattedPlan = { 
        ...originalPlan, // 가공되지 않은 원본 데이터를 사용
        startDate: originalPlan.startDate ? originalPlan.startDate.split("T")[0] : "",
        endDate: originalPlan.endDate ? originalPlan.endDate.split("T")[0] : "",
    };
    // isNew 플래그만 추가하여 editingPlan state 설정
    setEditingPlan({ ...formattedPlan, isNew: false });
    setIsModalOpen(true);
};

    const gridColumns = [
        { header: "계획 ID", accessor: "planId" },
        { header: "프로젝트 ID", accessor: "projectId" },
        { header: "선박 ID", accessor: "vesselId" },
        { header: "시작일", accessor: "startDate" },
        { header: "종료일", accessor: "endDate" },
        { header: "상태", accessor: "status" },
           
    { 
        header: "최종확정여부", 
        accessor: "isFinal",
        render: (row) => {
            // '미완' 버튼 클릭 시, 가공되지 않은 원본 plan 데이터를 넘겨주기 위해
            // plans 배열에서 현재 row와 일치하는 원본 데이터를 찾습니다.
            const originalPlan = plans.find(p => p.planId === row.planId);

            return originalPlan?.isFinal ? (
                <span className="font-semibold text-green-600">확정</span>
            ) : (
                <button 
                    onClick={(e) => {
                        e.stopPropagation(); // 행 더블클릭 방지
                        handleFinalizePlan(originalPlan);
                    }}
                    className="text-gray-500 hover:text-blue-600 hover:font-semibold"
                >
                    미완
                </button>
            );
        }
    },
];
        
        


    const allColumns = [
        { header: "계획 ID", accessor: "planId", readOnly: true },
        { header: "프로젝트 ID", accessor: "projectId", type:"select" },
        { header: "선박 ID", accessor: "vesselId", type: "select" },
        { header: "계획 범위", accessor: "planScope" },
        { header: "시작일", accessor: "startDate", type: "date" },
        { header: "종료일", accessor: "endDate", type: "date" },
        { header: "상태", accessor: "status", type: "select", options: statusOptions },
        { header: "비고", accessor: "remark", fullWidth: true },
        { header: "생성일", accessor: "createdAt", readOnly: true },
        { header: "수정일", accessor: "updatedAt", readOnly: true },
    ];
    
    const loadPlans = useCallback(async () => {
    try {
      // 1. ★ 생산 계획을 검색/정렬하기 위한 파라미터 객체를 먼저 정의합니다. (이 부분이 누락되었습니다)
      const planParams = {
        projectId: searchParams.projectId || undefined,
        vesselId: searchParams.vesselId || undefined,
        startDate: searchParams.startDate || undefined,
        endDate: searchParams.endDate || undefined,
        status: searchParams.status || undefined,
        sortBy: sortConfig.key,
        sortDir: sortConfig.direction === 'ascending' ? 'asc' : 'desc',
      };

      // 2. Promise.all을 사용해 3개의 API를 동시에 호출합니다.
      const [plansRes, projectsRes, vesselsRes] = await Promise.all([
        axios.get(API_BASE, { params: planParams }), // 정의된 planParams 사용
        axios.get(PROJECTS_API_URL),
        axios.get(VESSELS_API_URL),
      ]);
      
      // 3. 각 API 호출 결과를 state에 저장합니다.
      setPlans(plansRes.data || []);
      setProjects(projectsRes.data || []);
      setVessels(vesselsRes.data || []);
      setSelectedGridPlan(null);

    } catch (err) {
      console.error("데이터 조회 실패:", err);
      alert(`데이터 조회 중 오류가 발생했습니다: ${err.message}`);
    }
  }, [searchParams, sortConfig]);

    useEffect(() => {
        loadPlans();
    }, [loadPlans]);

    const syncWithMes = async () => {
        try {
            console.log("MES와 Plan ID 동기화를 시작합니다...");
            // API 게이트웨이(8083)의 동기화 엔드포인트를 호출합니다.
            await apiGatewayClient.post('/project_plans/sync-to-mes');
            console.log("Plan ID 동기화가 성공적으로 완료되었습니다.");
        } catch (error) {
            console.error("MES 동기화 실패:", error);
            // 사용자에게는 알리지 않거나, 선택적으로 부드럽게 알릴 수 있습니다.
            // alert('MES 시스템과 동기화하는 중 오류가 발생했습니다.');
        }
    };
    
   const handleSave = async () => {
    if (!editingPlan) return;

    // --- 🔽 수정/추가될 코드 시작 🔽 ---
    const saveData = {
        ...editingPlan,
        // status와 progressRate를 숫자로 변환하여 전송
        status: parseInt(editingPlan.status, 10),
        progressRate: parseFloat(editingPlan.progressRate) || 0,
    };
    // --- 🔼 수정/추가될 코드 끝 🔼 ---

    try {
        if (saveData.isNew) {
            const { isNew, ...createData } = saveData;
            await axios.post(API_BASE, createData);
            alert("새로운 계획이 등록되었습니다.");
        } else {
            await axios.put(`${API_BASE}/${saveData.planId}`, saveData); // 수정된 saveData를 전송
            alert("계획이 수정되었습니다.");
        }

        await syncWithMes();

        closeModalAndRefresh();
    } catch (err) {
        console.error("저장 실패:", err);
        // 서버 에러 메시지가 있다면 함께 표시
        const message = err.response?.data?.message || err.message;
        alert(`저장 중 오류 발생: ${message}`);
    }
};

    const handleDelete = async () => {
        if (!editingPlan || editingPlan.isNew) return;
        if (window.confirm(`정말로 계획 ID '${editingPlan.planId}'를 삭제하시겠습니까?`)) {
            try {
                await axios.delete(`${API_BASE}/${editingPlan.planId}`);
                alert("계획이 삭제되었습니다.");
                await syncWithMes();
                closeModalAndRefresh();
            } catch (err) {
                console.error("삭제 실패:", err);
                alert(`삭제 중 오류 발생: ${err.message}`);
            }
        }
    };

    const handleFinalizePlan = async (planToFinalize) => {
    // 혹시 모를 오류를 방지하기 위해 planToFinalize 객체가 있는지 확인합니다.
    if (!planToFinalize) return;

    if (!window.confirm(`[${planToFinalize.planId}] 계획을 최종 확정하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
        return;
    }

    try {
        // isFinal 값만 true로 변경한 새로운 객체를 생성합니다.
        const updatedPlan = { ...planToFinalize, isFinal: true };

        // 서버에 PUT 요청을 보내 데이터를 업데이트합니다.
        await axios.put(`${API_BASE}/${planToFinalize.planId}`, updatedPlan);

        alert("생산 계획이 최종 확정되었습니다.");
        
        await syncWithMes();
        
        // 목록을 새로고침하여 화면에 변경사항을 반영합니다.
        await loadPlans();

    } catch (err) {
        console.error("최종 확정 처리 실패:", err);
        alert("확정 처리 중 오류가 발생했습니다.");
    }
};

    const openCreateModal = () => {
        const today = new Date().toISOString().split("T")[0];
        setEditingPlan({ isNew: true, planId: "", projectId: "", vesselId: "", planScope: "선수, 중앙부 후미", startDate: today, endDate: today, progressRate: 0, status: 0, remark: "" });
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

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending',
        }));
    };

    const handleSearchReset = () => {
        setSearchParams({ projectId: "", vesselId: "", startDate: "", endDate: "", status: "" });
    };

    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            <h2 className="font-bold text-2xl mb-6 text-gray-800">프로젝트 생산 계획</h2>
            <SearchLayout>
                <SearchTextBox label="프로젝트 ID" value={searchParams.projectId} onChange={(e) => setSearchParams({...searchParams, projectId: e.target.value})} />
                <SearchTextBox label="선박 ID" value={searchParams.vesselId} onChange={(e) => setSearchParams({...searchParams, vesselId: e.target.value})} />
                <SearchDatePicker label="시작일" value={searchParams.startDate} onChange={(e) => setSearchParams({...searchParams, startDate: e.target.value})} />
                <SearchDatePicker label="종료일" value={searchParams.endDate} onChange={(e) => setSearchParams({...searchParams, endDate: e.target.value})} />
                <div className="flex-grow min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                    <select value={searchParams.status} onChange={(e) => setSearchParams({...searchParams, status: e.target.value})} className="w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500">
                        <option value="">전체</option>
                        {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
                <div className="flex items-end space-x-2 pt-6">
                    <StyledButton onClick={loadPlans} colorClass="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500">
                        <span>조회</span>
                    </StyledButton>
                    <StyledButton onClick={handleSearchReset} colorClass="bg-gray-600 hover:bg-gray-700 focus:ring-gray-500">
                        <span>초기화</span>
                    </StyledButton>
                    <StyledButton onClick={openCreateModal} colorClass="bg-green-600 hover:bg-green-700 focus:ring-green-500">
                        <span>추가</span>
                    </StyledButton>
                </div>
            </SearchLayout>

            <BodyGrid
                columns={gridColumns}
                data={plans.map(p => ({
                    ...p,
                    status: getStatusText(p.status),
                    startDate: p.startDate ? p.startDate.split("T")[0] : "",
                    endDate: p.endDate ? p.endDate.split("T")[0] : "",
                }))}
                selectedId={selectedGridPlan?.planId}
                sortConfig={sortConfig}
                onHeaderClick={handleSort}
                onRowDoubleClick={handleEditClick}
            />

            {isModalOpen && editingPlan && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col border">
                        <h3 className="text-xl font-semibold text-gray-800 mb-5">
                            {editingPlan.isNew ? "신규 계획 등록" : "계획 수정"}
                        </h3>
                        <div className="overflow-y-auto pr-2 flex-grow">
                            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                {allColumns.filter(c => !c.readOnly || !editingPlan.isNew).map(col => (
                                    <div key={col.accessor} className={col.fullWidth ? 'col-span-2' : ''}>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{col.header}</label>
                                        {col.type === 'select' ? (
                                            <select 
                                                name={col.accessor} 
                                                value={editingPlan[col.accessor] || ''} 
                                                onChange={handleModalInputChange}
                                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                                            >
                                                {col.accessor === 'projectId' && (
                                                    <>
                                                        <option value="">프로젝트 선택</option>
                                                        {projects.map(p => <option key={p.projectId} value={p.projectId}>{p.projectNm} ({p.projectId})</option>)}
                                                    </>
                                                )}
                                                {col.accessor === 'vesselId' && (
                                                    <>
                                                        <option value="">선박 선택</option>
                                                        {vessels.map(v => <option key={v.vesselId} value={v.vesselId}>{v.vesselNm} ({v.vesselId})</option>)}
                                                    </>
                                                )}
                                            </select>
                                        ) : (
                                            <input
                                                type={col.type || "text"}
                                                name={col.accessor}
                                                value={editingPlan[col.accessor] || ''}
                                                onChange={handleModalInputChange}
                                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                                                disabled={col.readOnly}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-6 flex justify-between w-full items-center pt-4 border-t">
                            <div>
                                {!editingPlan.isNew && (
                                    <StyledButton onClick={handleDelete} colorClass="bg-red-600 hover:bg-red-700 focus:ring-red-500">
                                        <span>삭제</span>
                                    </StyledButton>
                                )}
                            </div>
                            <div className="flex gap-x-2">
                                <StyledButton onClick={handleSave} colorClass="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500">
                                    <span>저장</span>
                                </StyledButton>
                                <StyledButton onClick={closeModalAndRefresh} colorClass="bg-gray-600 hover:bg-gray-700 focus:ring-gray-500">
                                    <span>취소</span>
                                </StyledButton>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}