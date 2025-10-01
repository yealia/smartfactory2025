import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

// ===================================================================
// I. API 주소 설정
// ===================================================================
const PROJECTS_API_URL = "http://localhost:8081/api/projects";
const CUSTOMERS_API_URL = "http://localhost:8081/api/customers";
const EMPLOYEES_API_URL = "http://localhost:8081/api/employees";


// ===================================================================
// II. UI 컴포넌트
// ===================================================================

const STATUS_MAP = {
    0: '계획',
    1: '진행중',
    2: '생산 완료',
    3: '출하 완료',
};

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

const StyledButton = ({ onClick, disabled, children, colorClass }) => (
    <button onClick={onClick} disabled={disabled} className={`flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 transition-all duration-200 ${colorClass} disabled:bg-gray-400 disabled:cursor-not-allowed`}>
        {children}
    </button>
);

const BodyGrid = ({ columns, data, onRowClick, selectedId, sortConfig, onHeaderClick }) => (
    <div className="h-[calc(100vh-280px)] overflow-auto border rounded-lg shadow-md bg-white">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100 sticky top-0">
                <tr>
                    {columns.map((col) => (
                        <th 
                            key={col.accessor} 
                            onClick={() => onHeaderClick(col.accessor)}
                            className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer"
                        >
                            {col.header}
                            {sortConfig.key === col.accessor ? (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼') : ''}
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
                        <tr
                            key={row.projectId}
                            onClick={() => onRowClick(row)}
                            className={`cursor-pointer ${selectedId && row.projectId === selectedId ? 'bg-sky-100' : 'hover:bg-gray-50'}`}
                        >
                            {columns.map((col) => (
                                <td key={col.accessor} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
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
// III. 메인 컴포넌트
// ===================================================================

export default function ProjectRegister() {
    const [projects, setProjects] = useState([]);
    const [customers, setCustomers] = useState([]); // ★ 고객 목록 state 추가
    const [employees, setEmployees] = useState([]); // ★ 직원 목록 state 추가
    const [searchParams, setSearchParams] = useState({
        projectId: "", projectNm: "",
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeProject, setActiveProject] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedGridProject, setSelectedGridProject] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'priority', direction: 'ascending' });


    const gridColumns = [
        { header: "프로젝트 ID", accessor: "projectId" },
        { header: "프로젝트명", accessor: "projectNm" },
        { header: "고객 ID", accessor: "customerId" },
        { header: "상태", accessor: "status", render: (row) => STATUS_MAP[row.status] || '알 수 없음' },
        { 
            header: "최종확정여부", 
            accessor: "isFinal",
            // ★ isFinal 값에 따라 다른 UI를 보여주도록 수정
            render: (row) => {
                return row.isFinal ? (
                    // isFinal이 true이면 '확정' 텍스트만 표시
                    <span className="font-semibold text-green-600">확정</span>
                ) : (
                    // isFinal이 false이면 클릭 가능한 '미완' 버튼 표시
                    <button 
                        onClick={(e) => {
                            e.stopPropagation(); // 버튼 클릭 시 행 전체가 클릭되는 현상(이벤트 버블링) 방지
                            handleFinalizeProject(row);
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
        { header: "프로젝트 ID", accessor: "projectId", readOnlyOnEdit: true, placeholder: "예) 20250927-001" },
        { header: "프로젝트명", accessor: "projectNm", placeholder: "예) 2025년 9월 27일 첫번째 프로젝트" },
        { header: "고객 ID", accessor: "customerId", type: "select" },
        { header: "담당자 ID", accessor: "employeeId", type: "select" },
        { header: "시작일", accessor: "startDate", type: "date" },
        { header: "납기일", accessor: "deliveryDate", type: "date" },
        { header: "우선순위", accessor: "priority", type: "number" },
        { header: "상태", accessor: "status", type: "select" },
        { header: "총 예산", accessor: "totalBudget", type: "number" },
        { header: "통화", accessor: "currencyCode" },
        { header: "실제납기일", accessor: "actualDeliveryDate", type: "date" },
        { header: "비고", accessor: "remark", fullWidth: true },
        { header: "생성일", accessor: "createdAt", readOnly: true },
        { header: "수정일", accessor: "updatedAt", readOnly: true },
    ];

    // --- 데이터 조회 로직 ---
    const loadData = useCallback(async () => {
        try {
            // 여러 API를 동시에 호출하여 데이터를 가져옵니다.
            const [projectsRes, customersRes, employeesRes] = await Promise.all([
                axios.get(PROJECTS_API_URL, { 
                    params: {
                        projectId: searchParams.projectId || undefined,
                        projectNm: searchParams.projectNm || undefined,
                        sortBy: sortConfig.key,
                        sortDir: sortConfig.direction === 'ascending' ? 'asc' : 'desc',
                    }
                }),
                axios.get(CUSTOMERS_API_URL),
                axios.get(EMPLOYEES_API_URL)
            ]);
            
            setProjects(projectsRes.data);
            setCustomers(customersRes.data || []);
            setEmployees(employeesRes.data || []);
            setSelectedGridProject(null);

        } catch (err) {
            console.error("데이터 조회 실패:", err);
            alert("초기 데이터 로딩 중 오류가 발생했습니다.");
        }
    }, [searchParams, sortConfig]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRowClick = (project) => {
        setSelectedGridProject(project);
        const formattedProject = { ...project };
        ['startDate', 'deliveryDate', 'actualDeliveryDate', 'createdAt', 'updatedAt'].forEach(dateKey => {
            if (formattedProject[dateKey]) {
                formattedProject[dateKey] = formattedProject[dateKey].split("T")[0];
            }
        });
        setActiveProject({ ...formattedProject, isNew: false });
        setIsEditMode(false);
        setIsModalOpen(true);
    };

    const handleSearchReset = () => {
        setSearchParams({ projectId: "", projectNm: "" });
    };

    const handleDeleteActiveProject = async () => {
        if (!activeProject || activeProject.isNew) {
            alert("삭제할 수 없는 프로젝트입니다.");
            return;
        }
        if (window.confirm(`정말로 프로젝트 '${activeProject.projectNm}'을(를) 삭제하시겠습니까?`)) {
            try {
                await axios.delete(`${PROJECTS_API_URL}/${activeProject.projectId}`);
                alert("프로젝트가 삭제되었습니다.");
                closeModalAndRefresh();
            } catch (err) {
                console.error("삭제 실패:", err);
                alert("삭제 중 오류가 발생했습니다.");
            }
        }
    };

    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleSave = async () => {
        if (!activeProject) return;
        if (!activeProject.projectId || !activeProject.projectNm) {
            alert("프로젝트 ID와 이름은 필수 항목입니다.");
            return;
        }
        try {
            if (activeProject.isNew) {
                await axios.post(PROJECTS_API_URL, activeProject);
                alert("새로운 프로젝트가 등록되었습니다.");
            } else {
                await axios.put(`${PROJECTS_API_URL}/${activeProject.projectId}`, activeProject);
                alert("프로젝트가 수정되었습니다.");
            }
            closeModalAndRefresh();
        } catch (err) {
            console.error("저장 실패:", err);
            alert("저장 실패: " + (err.response?.data?.message || err.message));
        }
    };

    const openCreateModal = () => {
        const today = new Date().toISOString().split("T")[0];
        setActiveProject({
            isNew: true, projectId: "", projectNm: "", customerId: "", employeeId: "",
            startDate: today, deliveryDate: today, priority: 0, status: 0,
            totalBudget: 0, currencyCode: "KRW", actualDeliveryDate: "", remark: ""
        });
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const closeModalAndRefresh = () => {
        setIsModalOpen(false);
        setActiveProject(null);
        setIsEditMode(false);
        loadData();
    };

    const handleModalInputChange = (e) => {
        const { name, value } = e.target;
        setActiveProject(prev => ({ ...prev, [name]: value }));
    };

    const handleFinalizeProject = async (projectToFinalize) => {
        // 실수로 클릭하는 것을 방지하기 위해 확인창을 띄웁니다.
        if (!window.confirm(`[${projectToFinalize.projectNm}] 프로젝트를 최종 확정하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
            return;
        }

        try {
            // 기존 프로젝트 데이터에 isFinal만 true로 변경한 새 객체를 만듭니다.
            const updatedProject = { ...projectToFinalize, isFinal: true };

            // ERP 서버에 PUT 요청을 보내 데이터를 수정합니다.
            await axios.put(`${PROJECTS_API_URL}/${projectToFinalize.projectId}`, updatedProject);

            alert("프로젝트가 최종 확정되었습니다.");
            
            // 목록을 새로고침하여 변경사항을 화면에 반영합니다.
            await loadData();

        } catch (err) {
            console.error("최종 확정 처리 실패:", err);
            alert("확정 처리 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            <h2 className="font-bold text-2xl mb-6 text-gray-800">프로젝트 등록</h2>

            <SearchLayout>
                <SearchTextBox label="프로젝트 ID" value={searchParams.projectId} onChange={(e) => setSearchParams({ ...searchParams, projectId: e.target.value })} />
                <SearchTextBox label="프로젝트명" value={searchParams.projectNm} onChange={(e) => setSearchParams({ ...searchParams, projectNm: e.target.value })} />
                <div className="flex items-end space-x-2 pt-6 ml-auto">
                    <StyledButton onClick={loadData} colorClass="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                        <span>조회</span>
                    </StyledButton>
                    <StyledButton onClick={handleSearchReset} colorClass="bg-gray-600 hover:bg-gray-700 focus:ring-gray-500">
                        <span>초기화</span>
                    </StyledButton>
                    <StyledButton onClick={openCreateModal} colorClass="bg-green-600 hover:bg-green-700 focus:ring-green-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                        <span>추가</span>
                    </StyledButton>
                </div>
            </SearchLayout>

            <BodyGrid
                columns={gridColumns}
                data={projects}
                onRowClick={handleRowClick}
                selectedId={selectedGridProject?.projectId}
                sortConfig={sortConfig}
                onHeaderClick={handleSort}
            />

            {isModalOpen && activeProject && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col border">
                        <h3 className="text-xl font-semibold text-gray-800 mb-5">
                            {activeProject.isNew ? "신규 프로젝트 등록" : "프로젝트 상세 정보"}
                        </h3>
                        <div className="overflow-y-auto pr-2 flex-grow">
                            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                
                                {allColumns.map(col => {
                                    const isReadOnly = col.readOnly || (!activeProject.isNew && col.readOnlyOnEdit);
                                    const editable = isEditMode && !isReadOnly;
                                    const inputClass = "w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500";

                                    return (
                                        <div key={col.accessor} className={col.fullWidth ? 'col-span-2' : ''}>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{col.header}</label>
                                            
                                            {/* --- 수정 모드일 때 --- */}
                                            {isEditMode ? (
                                                <>
                                                    {/* 1. col.type이 'select'일 경우 */}
                                                    {col.type === 'select' ? (
                                                        col.accessor === 'customerId' ? (
                                                            <select name="customerId" value={activeProject.customerId || ''} onChange={handleModalInputChange} disabled={!editable} className={inputClass}>
                                                                <option value="">고객 선택</option>
                                                                {customers.map(c => <option key={c.customerId} value={c.customerId}>{c.customerNm} ({c.customerId})</option>)}
                                                            </select>
                                                        ) : col.accessor === 'employeeId' ? (
                                                            <select name="employeeId" value={activeProject.employeeId || ''} onChange={handleModalInputChange} disabled={!editable} className={inputClass}>
                                                                <option value="">담당자 선택</option>
                                                                {employees.map(e => <option key={e.employeeId} value={e.employeeId}>{e.employeeNm} ({e.employeeId})</option>)}
                                                            </select>
                                                        ) : (
                                                            // ★★★ 바로 여기에 status 콤보박스 로직이 들어갑니다! ★★★
                                                            <select name="status" value={activeProject.status ?? 0} onChange={handleModalInputChange} disabled={!editable} className={inputClass}>
                                                                {Object.entries(STATUS_MAP).map(([key, value]) => (
                                                                    <option key={key} value={key}>{value}</option>
                                                                ))}
                                                            </select>
                                                        )
                                                    ) : (
                                                    /* 2. 'select'가 아닐 경우 (기존 input) */
                                                        <input
                                                            type={col.type || "text"}
                                                            name={col.accessor}
                                                            value={activeProject[col.accessor] || ''}
                                                            onChange={handleModalInputChange}
                                                            className={inputClass}
                                                            disabled={!editable}
                                                            placeholder={col.placeholder || ''}
                                                        />
                                                    )}
                                                </>
                                            ) : (
                                                <p className="mt-1 p-2 min-h-[40px] text-gray-800 bg-gray-100 rounded-md w-full">
                                                    {activeProject[col.accessor] || "-"}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="mt-6 flex justify-between w-full items-center pt-4 border-t">
                            {/* Left-aligned button */}
                            <div>
                                {!isEditMode && activeProject && !activeProject.isNew && (
                                    <StyledButton onClick={handleDeleteActiveProject} colorClass="bg-red-600 hover:bg-red-700 focus:ring-red-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        <span>삭제</span>
                                    </StyledButton>
                                )}
                            </div>

                            {/* Right-aligned buttons */}
                            <div className="flex gap-x-2">
                                {isEditMode ? (
                                    <>
                                        <StyledButton onClick={handleSave} colorClass="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500">
                                          <span>저장</span>
                                        </StyledButton>
                                        <StyledButton onClick={closeModalAndRefresh} colorClass="bg-gray-600 hover:bg-gray-700 focus:ring-gray-500">
                                          <span>취소</span>
                                        </StyledButton>
                                    </>
                                ) : (
                                    <>
                                        <StyledButton onClick={() => setIsEditMode(true)} colorClass="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500">
                                          <span>수정</span>
                                        </StyledButton>
                                        <StyledButton onClick={closeModalAndRefresh} colorClass="bg-gray-600 hover:bg-gray-700 focus:ring-gray-500">
                                          <span>닫기</span>
                                        </StyledButton>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

