import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

// 공용 컴포넌트 (실제로는 별도 파일에서 import)
const SearchLayout = ({ children }) => <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-gray-50 p-4 rounded-lg border">{children}</div>;
const SearchTextBox = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input {...props} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
    </div>
);
const InsertButton = ({ onClick }) => <button onClick={onClick} className="flex-1 bg-green-500 text-white font-bold py-2 px-4 rounded-md hover:bg-green-600 transition duration-150 ease-in-out shadow">신규 등록</button>;

// ✅ [수정] onRowDoubleClick prop 제거
const BodyGrid = ({ columns, data, onRowClick, selectedId }) => (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    {columns.map((col) => (
                        <th key={col.accessor} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            {col.header}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {data.map((row) => (
                    <tr 
                        key={row.salesOrderId} 
                        onClick={() => onRowClick(row)} // ✅ onClick만 남김
                        className={`cursor-pointer hover:bg-gray-50 ${selectedId === row.salesOrderId ? 'bg-blue-100' : ''}`}
                    >
                        {columns.map((col) => (
                            <td key={col.accessor} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {row[col.accessor]}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);


const API_BASE = "http://localhost:8081/api/sales_orders";

export default function SalesOrder() {
    // --- 상태 관리 ---
    const [salesOrders, setSalesOrders] = useState([]);
    const [searchParams, setSearchParams] = useState({ customerId: "", vesselId: "" });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeOrder, setActiveOrder] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // --- 컬럼 정의 ---
    const gridColumns = [
        { header: "수주번호", accessor: "salesOrderId" },
        { header: "수주일자", accessor: "orderDate" },
        { header: "고객ID", accessor: "customerId" },
        { header: "선박ID", accessor: "vesselId" },
        { header: "총금액", accessor: "totalAmount" },
        { header: "상태", accessor: "status" },
    ];

    const allColumns = [
        { header: "수주번호", accessor: "salesOrderId", readOnly: true },
        { header: "수주일자", accessor: "orderDate", type: "date" },
        { header: "고객ID", accessor: "customerId" },
        { header: "선박ID", accessor: "vesselId" },
        { header: "고객발주번호", accessor: "customerPoNo" },
        { header: "통화", accessor: "currencyCode" },
        { header: "상태", accessor: "status", type: "number" },
        { header: "총금액", accessor: "totalAmount", type: "number" },
        { header: "등록자", accessor: "createdBy", readOnly: true },
        { header: "승인일시", accessor: "approvedDate", readOnly: true },
        { header: "승인자", accessor: "approvedBy", readOnly: true },
        { header: "비고", accessor: "remark", type: "textarea" },
    ];
    
    // --- 데이터 통신 ---
    const loadSalesOrders = useCallback(async () => {
        try {
            const params = {
                customerId: searchParams.customerId || undefined,
                vesselId: searchParams.vesselId || undefined,
            };
            const response = await axios.get(API_BASE, { params });
            setSalesOrders(response.data);
            setSelectedOrder(null);
        } catch (err) {
            console.error("판매 주문 목록 조회 실패:", err);
        }
    }, [searchParams]);

    useEffect(() => {
        loadSalesOrders();
    }, [loadSalesOrders]);
    
    // --- 이벤트 핸들러 ---

    // ✅ [수정] 클릭 시 모달 열기까지 모두 처리
    const handleRowClick = (order) => {
        const formattedOrder = {
            ...order,
            orderDate: order.orderDate ? new Date(order.orderDate).toISOString().slice(0, 10) : "",
        };
        setActiveOrder({ ...formattedOrder, isNew: false }); // 모달 데이터 설정
        setIsEditMode(false); // 보기 모드로 설정
        setIsModalOpen(true); // 모달 열기
        setSelectedOrder(order); // 선택된 행 하이라이트를 위해 상태 업데이트
    };

    const handleSearchReset = () => {
        setSearchParams({ customerId: "", vesselId: "" });
    };
    
    // --- 모달 관련 함수 ---
    const handleSave = async () => {
        if (!activeOrder) return;
        try {
            const payload = { ...activeOrder, totalAmount: parseFloat(activeOrder.totalAmount) || 0 };
            if (activeOrder.isNew) {
                await axios.post(API_BASE, payload);
                alert("새로운 주문이 등록되었습니다.");
            } else {
                await axios.put(`${API_BASE}/${activeOrder.salesOrderId}`, payload);
                alert("주문이 수정되었습니다.");
            }
            closeModalAndRefresh();
        } catch (err) {
            console.error("저장 실패:", err);
            alert("저장 중 오류가 발생했습니다.");
        }
    };

    const handleModalDelete = async () => {
        if (!activeOrder) return;
        if (window.confirm(`정말로 수주번호 '${activeOrder.salesOrderId}'를 삭제하시겠습니까?`)) {
            try {
                await axios.delete(`${API_BASE}/${activeOrder.salesOrderId}`);
                alert("주문이 삭제되었습니다.");
                closeModalAndRefresh();
            } catch (err) {
                console.error("삭제 실패:", err);
                alert("삭제 중 오류가 발생했습니다.");
            }
        }
    };

    const openCreateModal = () => {
        setActiveOrder({
            isNew: true, salesOrderId: "", orderDate: new Date().toISOString().slice(0, 10),
            customerId: "", vesselId: "", customerPoNo: "", currencyCode: "KRW",
            status: 0, totalAmount: 0, createdBy: "react_user", remark: ""
        });
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const closeModalAndRefresh = () => {
        setIsModalOpen(false);
        setActiveOrder(null);
        setIsEditMode(false);
        loadSalesOrders();
    };

    const handleModalInputChange = (e) => {
        const { name, value } = e.target;
        setActiveOrder(prev => ({ ...prev, [name]: value }));
    };

    // --- 렌더링 ---
    return (
        <div>
            <h2 className="font-bold text-2xl mb-4">판매 주문 관리</h2>

            <SearchLayout>
                <SearchTextBox label="고객ID" value={searchParams.customerId} onChange={(e) => setSearchParams({ ...searchParams, customerId: e.target.value })} />
                <SearchTextBox label="선박ID" value={searchParams.vesselId} onChange={(e) => setSearchParams({ ...searchParams, vesselId: e.target.value })} />
                
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-transparent select-none mb-1">작업 버튼</label>
                    <div className="flex space-x-2">
                        <button onClick={handleSearchReset} className="flex-1 bg-gray-500 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-600">초기화</button>
                        <InsertButton onClick={openCreateModal} />
                    </div>
                </div>
            </SearchLayout>

            <div className="mt-6">
                <BodyGrid
                    columns={gridColumns}
                    data={salesOrders.map((order) => ({
                        ...order,
                        totalAmount: order.totalAmount?.toLocaleString(),
                    }))}
                    onRowClick={handleRowClick}
                    selectedId={selectedOrder?.salesOrderId}
                />
            </div>

            {isModalOpen && activeOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-1/2 max-h-[80vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">
                            {activeOrder.isNew ? "신규 판매 주문 등록" : "판매 주문 상세 정보"}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            {allColumns.map(col => (
                                <div key={col.accessor} className={col.type === 'textarea' ? 'col-span-2' : ''}>
                                    <label className="block text-sm font-medium text-gray-700">{col.header}</label>
                                    {isEditMode ? (
                                        col.type === 'textarea' ? (
                                            <textarea name={col.accessor} value={activeOrder[col.accessor] || ''} onChange={handleModalInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" rows="3" />
                                        ) : (
                                            <input
                                                type={col.type || "text"}
                                                name={col.accessor}
                                                value={activeOrder[col.accessor] || ''}
                                                onChange={handleModalInputChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                                readOnly={!activeOrder.isNew && col.readOnly}
                                            />
                                        )
                                    ) : (
                                        <p className="mt-1 p-2 min-h-[42px] text-gray-800 bg-gray-100 rounded-md">
                                            {activeOrder[col.accessor] || "-"}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 flex justify-end gap-x-2">
                            {isEditMode ? (
                                <>
                                    <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">저장</button>
                                    <button onClick={closeModalAndRefresh} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">취소</button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => setIsEditMode(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">수정</button>
                                    <button onClick={handleModalDelete} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">삭제</button>
                                    <button onClick={closeModalAndRefresh} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">닫기</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}