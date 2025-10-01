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
const BodyGrid = ({ columns, data, selectedId, sortConfig, onHeaderClick }) => (
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
                            className={`${selectedId && row.planId === selectedId ? 'bg-sky-100' : 'hover:bg-gray-50'}`}
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
    const handleEditClick = (plan) => {
        setSelectedGridPlan(plan);
        const formattedPlan = { 
            ...plan,
            startDate: plan.startDate ? plan.startDate.split("T")[0] : "",
            endDate: plan.endDate ? plan.endDate.split("T")[0] : "",
        };
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
        // ✅ [추가] 수정 버튼을 포함할 '작업' 컬럼 추가
        {
            header: "작업",
            accessor: "actions",
            render: (row) => (
                <button
                    onClick={() => handleEditClick(row)}
                    className="px-3 py-1 bg-sky-500 text-white text-xs font-semibold rounded-md shadow-sm hover:bg-sky-600"
                >
                    수정
                </button>
            )
        }
    ];

    const allColumns = [
        { header: "계획 ID", accessor: "planId", readOnly: true },
        { header: "프로젝트 ID", accessor: "projectId", type:"select" },
        { header: "선박 ID", accessor: "vesselId", type: "select" },
        { header: "계획 범위", accessor: "planScope" },
        { header: "시작일", accessor: "startDate", type: "date" },
        { header: "종료일", accessor: "endDate", type: "date" },
        { header: "진행률", accessor: "progressRate", type: "number" },
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
    
    const handleSave = async () => {
        if (!editingPlan) return;
        try {
            if (editingPlan.isNew) {
                // 'isNew'와 같은 임시 속성은 서버로 보내지 않음
                const { isNew, ...createData } = editingPlan;
                await axios.post(API_BASE, createData);
                alert("새로운 계획이 등록되었습니다.");
            } else {
                await axios.put(`${API_BASE}/${editingPlan.planId}`, editingPlan);
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
                await axios.delete(`${API_BASE}/${editingPlan.planId}`);
                alert("계획이 삭제되었습니다.");
                closeModalAndRefresh();
            } catch (err) {
                console.error("삭제 실패:", err);
                alert(`삭제 중 오류 발생: ${err.message}`);
            }
        }
    };
    
    const openCreateModal = () => {
        const today = new Date().toISOString().split("T")[0];
        setEditingPlan({ isNew: true, planId: "", projectId: "", vesselId: "", planScope: "", startDate: today, endDate: today, progressRate: 0, status: 0, remark: "" });
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