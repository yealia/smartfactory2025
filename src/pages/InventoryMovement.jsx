import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

// =================================================================================
// ✨ 공용 컴포넌트 (실제로는 별도 파일에서 import 해서 사용하세요)
// =================================================================================

const SearchLayout = ({ children }) => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-gray-50 p-4 rounded-lg border shadow-sm">
        {children}
    </div>
);

const SearchTextBox = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input 
            {...props} 
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out" 
        />
    </div>
);

// 동기화 버튼 UI 컴포넌트 추가 (재사용 가능)
const SyncButton = ({ onClick }) => (
    <button onClick={onClick} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M15.312 11.227c.452.452.452 1.186 0 1.638l-2.083 2.083a1.156 1.156 0 01-1.637 0l-2.083-2.083a1.156 1.156 0 010-1.638l2.083-2.083a1.156 1.156 0 011.637 0l2.083 2.083zM4.688 3.121a1.156 1.156 0 011.637 0l2.083 2.083a1.156 1.156 0 010 1.638L6.325 8.925a1.156 1.156 0 01-1.637 0L2.605 6.842a1.156 1.156 0 010-1.638l2.083-2.083z" clipRule="evenodd" /><path d="M11.227 4.688a1.156 1.156 0 010 1.637L9.144 8.408a1.156 1.156 0 01-1.638 0L3.12 3.944a1.156 1.156 0 011.638-1.637l.002.002 4.384 4.384.002-.002a1.156 1.156 0 011.089.197zM8.773 15.312a1.156 1.156 0 010-1.637l2.083-2.083a1.156 1.156 0 011.638 0l4.384 4.384a1.156 1.156 0 01-1.638 1.637l-.002-.002-4.384-4.384-.002.002a1.156 1.156 0 01-1.089-.197z" /></svg>
        MES 동기화
    </button>
);

const BodyGrid = ({ columns, data, onRowClick, selectedId }) => (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    {columns.map((col) => (
                        <th key={col.header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            {col.header}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {data.length > 0 ? data.map((row) => (
                    <tr 
                        key={row.movementId} 
                        onClick={() => onRowClick(row)} 
                        className={`cursor-pointer hover:bg-indigo-50 transition-colors duration-150 ${selectedId === row.movementId ? 'bg-indigo-100' : ''}`}
                    >
                        {columns.map((col) => (
                            <td key={col.header} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {col.render ? col.render(row) : row[col.accessor]}
                            </td>
                        ))}
                    </tr>
                )) : (
                    <tr>
                        <td colSpan={columns.length} className="text-center py-10 text-gray-500">
                            표시할 데이터가 없습니다.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
);


// =================================================================================
// 🚀 재고 원장 관리 페이지 컴포넌트
// =================================================================================
const API_BASE = "http://localhost:8081/api/movements";

export default function InventoryMovement() {
    // =================================================================================
    // I. 상태 관리 (State Management)
    // =================================================================================
    const [movements, setMovements] = useState([]);
    const [searchParams, setSearchParams] = useState({ movementId: "", materialId: "" });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeMovement, setActiveMovement] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedMovement, setSelectedMovement] = useState(null);

    // =================================================================================
    // II. 컬럼 정의 (Column Definitions)
    // =================================================================================
    
    const getMovementStatus = (type) => {
        const typeStr = String(type).toUpperCase();
        if (typeStr.includes("INBOUND") || typeStr.includes("RECEIPT") || type === "입고" || type === 1) {
            return "합격";
        }
        if (typeStr.includes("OUTBOUND") || typeStr.includes("ISSUE") || type === "출고" || type === 2) {
            return "불합격";
        }
        if (typeStr.includes("PARTIAL")) return "부분합격";
        return type;
    };

    const getMovementTypeColor = (type) => {
        const typeStr = String(type).toUpperCase();
        if (typeStr.includes("INBOUND") || typeStr.includes("RECEIPT") || type === "입고" || type === 1) {
            return "bg-blue-100 text-blue-800";
        }
        if (typeStr.includes("OUTBOUND") || typeStr.includes("ISSUE") || type === "출고" || type === 2) {
            return "bg-red-100 text-red-800";
        }
        if (typeStr.includes("PARTIAL")) return "bg-yellow-100 text-yellow-800";
        if (typeStr.includes("ADJUST")) return "bg-green-100 text-green-800";
        if (typeStr.includes("TRANSFER")) return "bg-purple-100 text-purple-800";
        return "bg-gray-100 text-gray-800";
    };

    const gridColumns = [
        { 
            header: "이력 ID", 
            accessor: "movementId",
            render: (row) => (<span className="font-bold text-indigo-600 font-mono">{row.movementId}</span>)
        },
        { header: "자재 ID", accessor: "materialId" },
        { 
            header: "판정", 
            render: (row) => (
                <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getMovementTypeColor(row.movementType)}`}>
                        {getMovementStatus(row.movementType)}
                    </span>
                    <span className="font-mono font-bold text-lg text-gray-800">{row.qty}</span>
                </div>
            )
        },
        { 
            header: "출발지", 
            render: (row) => (
                <div>
                    <p>{row.warehouseFrom || '-'}</p>
                    <p className="text-xs text-gray-500">{row.locationFrom || '-'}</p>
                </div>
            )
        },
        { 
            header: "도착지", 
            render: (row) => (
                <div>
                    <p>{row.warehouseTo || '-'}</p>
                    <p className="text-xs text-gray-500">{row.locationTo || '-'}</p>
                </div>
            )
        },
        { 
            header: "출처 정보", 
            render: (row) => {
                if (row.purchaseOrderId) {
                    return (
                        <div>
                            <p className="font-medium">상세ID: {row.orderDetailId || '-'}</p>
                            <p className="text-xs text-gray-500">발주: {row.purchaseOrderId}</p>
                        </div>
                    );
                }
                if (row.qcId) {
                    return (
                        <div>
                            <p className="font-medium">검사ID: {row.qcId}</p>
                        </div>
                    );
                }
                return <div>-</div>;
            }
        },
        // ✅ [수정] '발생시각'을 '품질검사 ID'로, 헤더를 '검사 정보 / 처리자'로 변경
        { 
            header: "검사 정보 / 처리자", 
            render: (row) => (
                <div>
                    <p className="font-medium">검사ID: {row.qcId || '-'}</p>
                    <p className="text-xs text-gray-500">담당: {row.userId || '-'}</p>
                </div>
            )
        },
    ];

    // MES 동기화를 처리하는 함수 추가
    const handleSyncFromMes = async () => {
        if (!window.confirm("MES 품질검사 완료 내역을 가져와 재고 이동 이력을 생성하시겠습니까?")) {
            return;
        }
        try {
            const response = await axios.post("http://localhost:8081/api/sync/from-mes");
            alert(response.data);
            await fetchMovements({}); // 동기화 후 이동 이력 목록을 새로고침
        } catch (error) {
            console.error("MES 동기화 실패:", error);
            alert(`동기화 중 오류가 발생했습니다: ${error.response?.data?.message || error.message}`);
        }
    };
    
    const allColumns = [
        { header: "이력 ID", accessor: "movementId", readOnly: true },
        { header: "자재 ID", accessor: "materialId", type: "number", required: true },
        { header: "발생 시각", accessor: "occurredAt", type: "datetime-local", required: true },
        { header: "수량", accessor: "qty", type: "number", required: true },
        { header: "이동 유형", accessor: "movementType", required: true },
        { header: "출처 유형", accessor: "sourceType", required: true },
        { header: "출발 창고", accessor: "warehouseFrom" },
        { header: "도착 창고", accessor: "warehouseTo" },
        { header: "출발 위치", accessor: "locationFrom" },
        { header: "도착 위치", accessor: "locationTo" },
        { header: "발주 번호", accessor: "purchaseOrderId" },
        { header: "발주 상세 ID", accessor: "orderDetailId", type: "number" },
        { header: "품질검사 ID", accessor: "qcId", type: "number" },
        { header: "작업지시 ID", accessor: "workOrderId", type: "number" },
        { header: "사용자 ID", accessor: "userId" },
        { header: "멱등성 키", accessor: "idempotencyKey", readOnly: true },
        { header: "생성 시각", accessor: "createdAt", readOnly: true },
        { header: "비고", accessor: "remark", type: "textarea" },
    ];
    
    // =================================================================================
    // III. 데이터 통신 및 핵심 로직 (Data Fetching & Core Logic)
    // =================================================================================
    
    const fetchMovements = useCallback(async (paramsToFetch) => {
        try {
            const apiParams = {
                movementId: paramsToFetch.movementId || undefined,
                materialId: paramsToFetch.materialId || undefined,
            };
            const response = await axios.get(API_BASE, { params: apiParams });
            setMovements(response.data);
            setSelectedMovement(null);
        } catch (err) {
            console.error("재고 이력 조회 실패:", err);
            alert("데이터 조회 중 오류가 발생했습니다.");
        }
    }, []);

    useEffect(() => {
        fetchMovements({});
    }, [fetchMovements]);
    
    // =================================================================================
    // IV. 이벤트 핸들러 (Event Handlers)
    // =================================================================================
    const handleSearchChange = (e) => {
        const { name, value } = e.target;
        setSearchParams(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSearch = () => {
        fetchMovements(searchParams);
    };

    const handleRowClick = (movement) => {
        setSelectedMovement(movement);
        const formattedMovement = {
            ...movement,
            occurredAt: movement.occurredAt ? new Date(new Date(movement.occurredAt).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : "",
        };
        setActiveMovement({ ...formattedMovement, isNew: false });
        setIsEditMode(false);
        setIsModalOpen(true);
    };
    
    const handleSearchReset = () => {
        const clearedParams = { movementId: "", materialId: "" };
        setSearchParams(clearedParams);
        fetchMovements(clearedParams);
    };
    
    // =================================================================================
    // V. 모달 관련 함수 (Modal Functions)
    // =================================================================================
    const handleSave = async () => {
        if (!activeMovement) return;
        
        const requiredFields = allColumns.filter(c => c.required).map(c => c.accessor);
        for (const field of requiredFields) {
            if (!activeMovement[field]) {
                const fieldName = allColumns.find(c => c.accessor === field).header;
                alert(`'${fieldName}'은(는) 필수 항목입니다.`);
                return;
            }
        }

        try {
            const payload = { ...activeMovement };
            if (activeMovement.isNew) {
                await axios.post(API_BASE, payload);
                alert("새로운 이력이 등록되었습니다.");
            } else {
                await axios.put(`${API_BASE}/${activeMovement.movementId}`, payload);
                alert("이력이 수정되었습니다.");
            }
            closeModalAndRefresh();
        } catch (err) {
            console.error("저장 실패:", err);
            alert(`저장 중 오류가 발생했습니다: ${err.response?.data?.message || err.message}`);
        }
    };

    const handleDelete = async () => {
        if (!activeMovement?.movementId) return;

        if (window.confirm(`정말로 이력 ID '${activeMovement.movementId}'를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
            try {
                await axios.delete(`${API_BASE}/${activeMovement.movementId}`);
                alert("이력이 삭제되었습니다.");
                closeModalAndRefresh();
            } catch (err) {
                console.error("삭제 실패:", err);
                alert("삭제 중 오류가 발생했습니다.");
            }
        }
    };
    
    const openCreateModal = () => {
        setActiveMovement({
            isNew: true,
            movementId: null,
            occurredAt: new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16),
            materialId: "",
            qty: 0,
            movementType: "", 
            sourceType: "", 
            purchaseOrderId: "",
            orderDetailId: "",
            qcId: "",
            userId: "erp_user",
            remark: "",
            idempotencyKey: `react-${Date.now()}`,
            workOrderId: ""
        });
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const closeModalAndRefresh = () => {
        setIsModalOpen(false);
        setActiveMovement(null);
        setIsEditMode(false);
        fetchMovements(searchParams);
    };

    const handleModalInputChange = (e) => {
        const { name, value, type } = e.target;
        setActiveMovement(prev => ({ ...prev, [name]: type === 'number' ? (value ? Number(value) : '') : value }));
    };

    // =================================================================================
    // VI. 렌더링 (Rendering)
    // =================================================================================
    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h2 className="font-bold text-2xl mb-4 text-gray-800">재고 원장 관리</h2>

            <SearchLayout>
                <SearchTextBox label="이력 ID" name="movementId" type="number" value={searchParams.movementId} onChange={handleSearchChange} />
                <SearchTextBox label="자재 ID" name="materialId" type="number" value={searchParams.materialId} onChange={handleSearchChange} />
                
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-transparent select-none mb-1">작업 버튼</label>
                    <div className="flex space-x-2">
                        <button onClick={handleSearch} className="flex-1 bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 transition shadow">조회</button>
                        <button onClick={handleSearchReset} className="flex-1 bg-gray-500 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-600 transition shadow">초기화</button>
                        <button onClick={openCreateModal} className="flex-1 bg-green-500 text-white font-bold py-2 px-4 rounded-md hover:bg-green-600 transition shadow">신규 등록</button>
                        <SyncButton onClick={handleSyncFromMes} />
                    </div>
                </div>
            </SearchLayout>

            <div className="mt-6">
                <BodyGrid
                    columns={gridColumns}
                    data={movements}
                    onRowClick={handleRowClick}
                    selectedId={selectedMovement?.movementId}
                />
            </div>

            {/* 모달 */}
            {isModalOpen && activeMovement && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                        <h3 className="text-xl font-bold mb-6 text-gray-900 border-b pb-2">
                            {activeMovement.isNew ? "신규 재고 이력 등록" : `재고 이력 상세 (ID: ${activeMovement.movementId})`}
                        </h3>
                        
                        <div className="overflow-y-auto pr-2 flex-grow">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                {allColumns.map(col => (
                                    <div key={col.accessor} className={col.type === 'textarea' ? 'md:col-span-2' : ''}>
                                        <label className="block text-sm font-medium text-gray-700">
                                            {col.header}
                                            {isEditMode && col.required && <span className="text-red-500 ml-1">*</span>}
                                        </label>
                                        {isEditMode ? (
                                            (col.readOnly ? (
                                                <p className="mt-1 p-2 min-h-[42px] text-gray-500 bg-gray-200 rounded-md font-mono text-sm">
                                                    {activeMovement[col.accessor] || (activeMovement.isNew ? "(자동 생성)" : "-")}
                                                </p>
                                            ) : col.type === 'textarea' ? (
                                                <textarea name={col.accessor} value={activeMovement[col.accessor] || ''} onChange={handleModalInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" rows="3" />
                                            ) : (
                                                <input
                                                    type={col.type || "text"}
                                                    name={col.accessor}
                                                    value={activeMovement[col.accessor] || ''}
                                                    onChange={handleModalInputChange}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                />
                                            ))
                                        ) : (
                                            <p className="mt-1 p-2 min-h-[42px] text-gray-800 bg-gray-100 rounded-md font-mono text-sm">
                                                { (col.accessor === 'occurredAt' || col.accessor === 'createdAt')
                                                    ? (activeMovement[col.accessor] ? new Date(activeMovement[col.accessor]).toLocaleString('ko-KR') : '-')
                                                    : (activeMovement[col.accessor] || "-")
                                                }
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="mt-8 flex justify-between items-center w-full pt-4 border-t">
                            {/* Left-aligned delete button */}
                            <div>
                                {!isEditMode && activeMovement && !activeMovement.isNew && (
                                    <button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md shadow transition">
                                        삭제
                                    </button>
                                )}
                            </div>
                            
                            {/* Right-aligned action buttons */}
                            <div className="flex gap-x-3">
                                {isEditMode ? (
                                    <>
                                        <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md shadow transition">저장</button>
                                        <button onClick={closeModalAndRefresh} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-md shadow transition">취소</button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => setIsEditMode(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md shadow transition">수정</button>
                                        <button onClick={closeModalAndRefresh} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md shadow transition">닫기</button>
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