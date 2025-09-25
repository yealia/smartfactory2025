import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

// --- 상수 정의 --- //
const API_BASE = "http://localhost:8081/api/sales_orders";
const MES_API_BASE = "http://localhost:8083/api/proxy/shipments";

/** 메인 그리드에 표시될 컬럼 정보 */
const gridColumns = [
    { header: "수주번호", accessor: "salesOrderId" },
    { header: "수주일자", accessor: "orderDate" },
    { header: "고객ID", accessor: "customerId" },
    { header: "선박ID", accessor: "vesselId" },
    { header: "총금액", accessor: "totalAmount" },
    { header: "상태", accessor: "status" },
];

/** 모달 내부에 표시될 모든 컬럼 정보 (상세 정보) */
const allDetailColumns = [
    { header: "수주번호", accessor: "salesOrderId", readOnly: true },
    { header: "수주일자", accessor: "orderDate", type: "date" },
    { header: "고객ID", accessor: "customerId" },
    { header: "선박ID", accessor: "vesselId" },
    { header: "고객발주번호", accessor: "customerPoNo" },
    { header: "통화", accessor: "currencyCode" },
    { header: "상태", accessor: "status", type: "number", placeholder: "0: 등록, 1: 판매 요청, 2: 완료" },
    { header: "총금액", accessor: "totalAmount", type: "number" },
    { header: "등록자", accessor: "createdBy", readOnly: true },
    { header: "승인일시", accessor: "approvedDate", readOnly: true },
    { header: "승인자", accessor: "approvedBy", readOnly: true },
    { header: "비고", accessor: "remark", type: "textarea" },
];


// --- 공용 UI 컴포넌트 --- //
const SearchLayout = ({ children }) => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-gray-50 p-4 rounded-lg border">
        {children}
    </div>
);

const SearchTextBox = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input {...props} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
    </div>
);

const InsertButton = ({ onClick }) => (
    <button onClick={onClick} className="flex-1 bg-green-500 text-white font-bold py-2 px-4 rounded-md hover:bg-green-600 transition duration-150 ease-in-out shadow">
        신규 등록
    </button>
);

const getStatusText = (status) => {
    switch (status) {
        case 0: return "등록";
        case 1: return "판매 요청";
        case 2: return "완료";
        default: return status;
    }
};

const getMesStatusText = (status) => {
    switch (status) {
        case 0: return "계획";
        case 1: return "출하";
        case 2: return "인도완료";
        case 3: return "취소";
        default: return "상태 알 수 없음";
    }
};

const BodyGrid = ({ columns, data, onRowClick, selectedId, shipmentData }) => (
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
                {data.map((row) => {
                    const shipment = shipmentData[row.salesOrderId];
                    return (
                        <tr
                            key={row.salesOrderId}
                            onClick={() => onRowClick(row)}
                            className={`cursor-pointer hover:bg-gray-50 ${selectedId === row.salesOrderId ? 'bg-blue-100' : ''}`}
                        >
                            {columns.map((col) => (
                                <td key={col.accessor} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {col.accessor === 'status' ? (
                                        <div>
                                            <span
                                                className="font-semibold text-blue-600 cursor-pointer hover:underline"
                                                onClick={(e) => {
                                                    e.stopPropagation(); // 행 전체 클릭(모달 열기) 방지
                                                    onStatusClick(row);
                                                }}
                                            >
                                                {getStatusText(row.status)}
                                            </span>
                                            <p className={`text-xs mt-1 ${shipment ? 'text-gray-500' : 'text-gray-400'}`}>
                                                 MES: {shipment ? getMesStatusText(shipment.status) : '정보 없음'}
                                            </p>
                                        </div>
                                    ) : (
                                        row[col.accessor]
                                    )}
                                </td>
                            ))}
                        </tr>
                    );
                })}
            </tbody>
        </table>
    </div>
);

const SalesOrderModal = ({ isOpen, onClose, orderData, isEditMode, setIsEditMode, onSave, onDelete }) => {
    const [activeOrder, setActiveOrder] = useState(orderData);

    useEffect(() => {
        setActiveOrder(orderData);
    }, [orderData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setActiveOrder(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveClick = () => {
        onSave(activeOrder);
    };


    if (!isOpen || !activeOrder) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-1/2 max-h-[80vh] overflow-y-auto">
                <h3 className="text-xl font-bold mb-4">
                    {activeOrder.isNew ? "신규 판매 주문 등록" : "판매 주문 상세 정보"}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    {allDetailColumns.map(col => (
                        <div key={col.accessor} className={col.type === 'textarea' ? 'col-span-2' : ''}>
                            <label className="block text-sm font-medium text-gray-700">{col.header}</label>
                            {isEditMode ? (
                                col.type === 'textarea' ? (
                                    <textarea name={col.accessor} value={activeOrder[col.accessor] || ''} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" rows="3" />
                                ) : (
                                    <input
                                        type={col.type || "text"}
                                        name={col.accessor}
                                        value={activeOrder[col.accessor] || ''}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                        readOnly={!activeOrder.isNew && col.readOnly}
                                        placeholder={col.placeholder || ''}
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
                            <button onClick={handleSaveClick} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">저장</button>
                            <button onClick={onClose} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">취소</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setIsEditMode(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">수정</button>
                            <button onClick={() => onDelete(activeOrder)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">삭제</button>
                            <button onClick={onClose} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">닫기</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function SalesOrder() {
    const [salesOrders, setSalesOrders] = useState([]);
    const [shipmentData, setShipmentData] = useState({});
    const [searchParams, setSearchParams] = useState({ customerId: "", vesselId: "" });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeOrder, setActiveOrder] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState(null);

    // MES 데이터는 처음에 한 번만 전체를 불러옵니다.
    useEffect(() => {
        const fetchAllShipments = async () => {
            try {
                const response = await axios.get(MES_API_BASE);
                const shipmentMap = response.data.reduce((acc, shipment) => {
                    if (shipment && shipment.salesOrderId) {
                        acc[shipment.salesOrderId] = shipment;
                    }
                    return acc;
                }, {});
                setShipmentData(shipmentMap);
            } catch (err) {
                console.error("MES 출하 정보 전체 조회 실패:", err);
            }
        };
        fetchAllShipments();
    }, []); // 의존성 배열이 비어있으므로 최초 1회만 실행됩니다.

    const loadSalesOrders = useCallback(async () => {
        try {
            const params = {
                customerId: searchParams.customerId || undefined,
                vesselId: searchParams.vesselId || undefined,
            };
            const response = await axios.get(API_BASE, { params });
            setSalesOrders(response.data);
            setSelectedOrderId(null);
        } catch (err) {
            console.error("판매 주문 목록 조회 실패:", err);
            alert("목록을 불러오는 데 실패했습니다.");
        }
    }, [searchParams]);

    useEffect(() => {
        loadSalesOrders();
    }, [loadSalesOrders]);

    const handleSearchChange = (e) => {
        const { name, value } = e.target;
        setSearchParams(prev => ({ ...prev, [name]: value }));
    };

    const handleRowClick = (order) => {
        const formattedOrder = {
            ...order,
            orderDate: order.orderDate ? new Date(order.orderDate).toISOString().slice(0, 10) : "",
        };
        setActiveOrder({ ...formattedOrder, isNew: false });
        setIsEditMode(false);
        setIsModalOpen(true);
        setSelectedOrderId(order.salesOrderId);
    };

    const handleSearchReset = () => {
        setSearchParams({ customerId: "", vesselId: "" });
    };

    const handleSave = async (orderToSave) => {
        if (!orderToSave) return;
        try {
            const payload = { ...orderToSave, totalAmount: parseFloat(orderToSave.totalAmount) || 0 };
            if (orderToSave.isNew) {
                await axios.post(API_BASE, payload);
                alert("새로운 주문이 등록되었습니다.");
            } else {
                await axios.put(`${API_BASE}/${orderToSave.salesOrderId}`, payload);
                alert("주문이 수정되었습니다.");
            }
            closeModalAndRefresh();
        } catch (err) {
            console.error("저장 실패:", err);
            alert("저장 중 오류가 발생했습니다.");
        }
    };
    
    const handleDelete = async (orderToDelete) => {
        if (!orderToDelete) return;
        if (window.confirm(`정말로 수주번호 '${orderToDelete.salesOrderId}'를 삭제하시겠습니까?`)) {
            try {
                await axios.delete(`${API_BASE}/${orderToDelete.salesOrderId}`);
                alert("주문이 삭제되었습니다.");
                closeModalAndRefresh();
            } catch (err) {
                console.error("삭제 실패:", err);
                alert("삭제 중 오류가 발생했습니다.");
            }
        }
    };

    const handleStatusUpdate = async (orderToUpdate) => {
        const originalOrder = salesOrders.find(o => o.salesOrderId === orderToUpdate.salesOrderId);
        if (!originalOrder) return;
        const currentStatus = Number(originalOrder.status);
        if (currentStatus === 2) {
            alert("'완료' 상태의 주문은 더 이상 상태를 변경할 수 없습니다.");
            return;
        }
        const nextStatus = (currentStatus + 1) % 3;
        if (!window.confirm(`'${originalOrder.salesOrderId}' 주문의 상태를 '${getStatusText(nextStatus)}'(으)로 변경하시겠습니까?`)) {
            return;
        }
        try {
            const payload = { ...originalOrder, status: nextStatus };
            await axios.put(`${API_BASE}/${originalOrder.salesOrderId}`, payload);
            setSalesOrders(currentOrders =>
                currentOrders.map(order =>
                    order.salesOrderId === originalOrder.salesOrderId
                        ? { ...order, status: nextStatus }
                        : order
                )
            );
        } catch (err) {
            console.error("상태 업데이트 실패:", err);
            alert("상태 업데이트 중 오류가 발생했습니다.");
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

    return (
        <div>
            <h2 className="font-bold text-2xl mb-4">판매 주문 관리</h2>
            <SearchLayout>
                <SearchTextBox label="고객ID" name="customerId" value={searchParams.customerId} onChange={handleSearchChange} />
                <SearchTextBox label="선박ID" name="vesselId" value={searchParams.vesselId} onChange={handleSearchChange} />
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-transparent select-none mb-1">작업 버튼</label>
                    <div className="flex space-x-2">
                        <button onClick={loadSalesOrders} className="flex-1 bg-blue-500 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600">조회</button>
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
                    selectedId={selectedOrderId}
                    onStatusClick={handleStatusUpdate}
                    shipmentData={shipmentData}
                />
            </div>
            <SalesOrderModal
                isOpen={isModalOpen}
                onClose={closeModalAndRefresh}
                orderData={activeOrder}
                isEditMode={isEditMode}
                setIsEditMode={setIsEditMode}
                onSave={handleSave}
                onDelete={handleDelete}
            />
        </div>
    );
}