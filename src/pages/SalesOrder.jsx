import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

// --- 상수 정의 --- //
/** API 요청을 위한 기본 URL */
const API_BASE = "http://localhost:8081/api/sales_orders";

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
// 실제 프로젝트에서는 이 컴포넌트들을 별도의 파일로 분리하여 관리하는 것이 좋습니다.

/** 검색 영역 레이아웃 컴포넌트 */
const SearchLayout = ({ children }) => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-gray-50 p-4 rounded-lg border">
        {children}
    </div>
);

/** 검색용 텍스트 입력 필드 컴포넌트 */
const SearchTextBox = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input {...props} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
    </div>
);

/** '신규 등록' 버튼 컴포넌트 */
const InsertButton = ({ onClick }) => (
    <button onClick={onClick} className="flex-1 bg-green-500 text-white font-bold py-2 px-4 rounded-md hover:bg-green-600 transition duration-150 ease-in-out shadow">
        신규 등록
    </button>
);

// 상태 코드를 텍스트로 변환하는 함수
const getStatusText = (status) => {
    switch (status) {
        case 0:
            return "등록";
        case 1:
            return "판매 요청";
        case 2:
            return "완료";
        default:
            return status; // 알 수 없는 코드는 그대로 반환
    }
};

/** 데이터 테이블(그리드) 본문 컴포넌트 */
// ✅ [수정] BodyGrid 컴포넌트 전체 코드
const BodyGrid = ({ columns, data, onRowClick, selectedId, onStatusClick }) => (
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
                        onClick={() => onRowClick(row)} // 행 클릭 시 모달 열기
                        className={`cursor-pointer hover:bg-gray-50 ${selectedId === row.salesOrderId ? 'bg-blue-100' : ''}`}
                    >
                        {columns.map((col) => {
                            // '상태' 컬럼인 경우 특별한 스타일과 클릭 이벤트를 적용합니다.
                            if (col.accessor === 'status') {
                                return (
                                    <td key={col.accessor}
                                        className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600 cursor-pointer hover:text-blue-800 hover:underline"
                                        onClick={(e) => {
                                            e.stopPropagation(); // 중요: 행의 onClick(모달 열기)이 실행되는 것을 막습니다.
                                            onStatusClick(row); // 상태 변경 함수만 호출합니다.
                                        }}>
                                        {row[col.accessor]}
                                    </td>
                                );
                            }
                            // 나머지 컬럼은 기존과 동일하게 렌더링합니다.
                            return (
                                <td key={col.accessor} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {row[col.accessor]}
                                </td>
                            );
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

/**
 * 판매 주문 상세 정보 모달 컴포넌트
 * @param {object} props
 * @param {boolean} props.isOpen - 모달이 열려있는지 여부
 * @param {Function} props.onClose - 모달 닫기 함수
 * @param {object} props.orderData - 모달에 표시될 주문 데이터
 * @param {boolean} props.isEditMode - 수정 모드 활성화 여부
 * @param {Function} props.setIsEditMode - 수정 모드 상태 변경 함수
 * @param {Function} props.onSave - 저장 콜백 함수
 * @param {Function} props.onDelete - 삭제 콜백 함수
 */
const SalesOrderModal = ({ isOpen, onClose, orderData, isEditMode, setIsEditMode, onSave, onDelete }) => {
    // 부모로부터 받은 orderData를 내부 상태로 관리하여 입력 필드 변경을 처리합니다.
    const [activeOrder, setActiveOrder] = useState(orderData);

    // orderData prop이 변경될 때마다 내부 상태를 동기화합니다.
    useEffect(() => {
        setActiveOrder(orderData);
    }, [orderData]);

    // 모달 내 입력 필드의 값이 변경될 때 호출되는 핸들러입니다.
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setActiveOrder(prev => ({ ...prev, [name]: value }));
    };

    // 저장 버튼 클릭 시, 내부 상태(activeOrder)를 부모의 onSave 함수로 전달합니다.
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
                {/* 상세 정보 폼 */}
                <div className="grid grid-cols-2 gap-4">
                    {allDetailColumns.map(col => (
                        <div key={col.accessor} className={col.type === 'textarea' ? 'col-span-2' : ''}>
                            <label className="block text-sm font-medium text-gray-700">{col.header}</label>
                            {isEditMode ? (
                                // 수정 모드일 때: 입력 가능한 필드 표시
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
                                // 보기 모드일 때: 텍스트로 정보 표시
                                <p className="mt-1 p-2 min-h-[42px] text-gray-800 bg-gray-100 rounded-md">
                                    {activeOrder[col.accessor] || "-"}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
                {/* 모달 하단 버튼 영역 */}
                <div className="mt-6 flex justify-end gap-x-2">
                    {isEditMode ? (
                        <>
                            <button onClick={handleSaveClick} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">저장</button>
                            <button onClick={onClose} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">취소</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setIsEditMode(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">수정</button>
                            <button onClick={onDelete} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">삭제</button>
                            <button onClick={onClose} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">닫기</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};


/**
 * 판매 주문 관리 메인 페이지 컴포넌트
 */
export default function SalesOrder() {
    // --- 상태 관리(State Management) ---
    const [salesOrders, setSalesOrders] = useState([]); // 조회된 판매 주문 목록
    const [searchParams, setSearchParams] = useState({ customerId: "", vesselId: "" }); // 검색 조건
    const [isModalOpen, setIsModalOpen] = useState(false); // 모달 표시 여부
    const [activeOrder, setActiveOrder] = useState(null); // 모달에 표시될 현재 활성화된 주문 데이터
    const [isEditMode, setIsEditMode] = useState(false); // 모달의 수정/보기 모드
    const [selectedOrderId, setSelectedOrderId] = useState(null); // 그리드에서 선택된 행의 ID (하이라이트용)

    
    // --- 데이터 통신 (API Calls) ---
    /** 서버에서 판매 주문 목록을 조회하는 함수 */
    const loadSalesOrders = useCallback(async () => {
        try {
            // 검색 파라미터가 비어있으면 undefined로 보내 서버에서 무시하도록 함
            const params = {
                customerId: searchParams.customerId || undefined,
                vesselId: searchParams.vesselId || undefined,
            };
            const response = await axios.get(API_BASE, { params });
            setSalesOrders(response.data); // 상태 업데이트
            setSelectedOrderId(null); // 목록 새로고침 시 선택 상태 초기화
        } catch (err) {
            console.error("판매 주문 목록 조회 실패:", err);
            alert("목록을 불러오는 데 실패했습니다.");
        }
    }, [searchParams]); // searchParams가 변경될 때만 함수를 재생성

    // 컴포넌트가 마운트되거나, loadSalesOrders 함수가 변경될 때 주문 목록을 불러옴
    useEffect(() => {
        loadSalesOrders();
    }, [loadSalesOrders]);
    
    // --- 이벤트 핸들러 (Event Handlers) ---
    /** 검색 입력 필드 변경 핸들러 */
    const handleSearchChange = (e) => {
        const { name, value } = e.target;
        setSearchParams(prev => ({ ...prev, [name]: value }));
    };

    /** 그리드의 행(row)을 클릭했을 때 호출되는 함수 */
    const handleRowClick = (order) => {
        // 날짜 형식을 'YYYY-MM-DD'로 맞춤
        const formattedOrder = {
            ...order,
            orderDate: order.orderDate ? new Date(order.orderDate).toISOString().slice(0, 10) : "",
        };
        setActiveOrder({ ...formattedOrder, isNew: false }); // 모달에 표시할 데이터 설정
        setIsEditMode(false); // 보기 모드로 시작
        setIsModalOpen(true); // 모달 열기
        setSelectedOrderId(order.salesOrderId); // 선택된 행 하이라이트
    };

    /** 검색 조건 초기화 핸들러 */
    const handleSearchReset = () => {
        setSearchParams({ customerId: "", vesselId: "" });
    };
    
    /** 모달 저장(신규/수정) 핸들러 */
    const handleSave = async (orderToSave) => {
        if (!orderToSave) return;
        try {
            const payload = { ...orderToSave, totalAmount: parseFloat(orderToSave.totalAmount) || 0 };
            
            if (orderToSave.isNew) { // 신규 등록
                await axios.post(API_BASE, payload);
                alert("새로운 주문이 등록되었습니다.");
            } else { // 수정
                await axios.put(`${API_BASE}/${orderToSave.salesOrderId}`, payload);
                alert("주문이 수정되었습니다.");
            }
            closeModalAndRefresh();
        } catch (err) {
            console.error("저장 실패:", err);
            alert("저장 중 오류가 발생했습니다.");
        }
    };

    /** 모달 내 삭제 버튼 핸들러 */
    const handleDelete = async () => {
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

    // 그리드에서 직접 상태를 업데이트하는 함수
    const handleStatusUpdate = async (orderToUpdate) => {
        // salesOrders 원본 배열에서 클릭한 주문의 전체 데이터를 찾습니다.
        const originalOrder = salesOrders.find(o => o.salesOrderId === orderToUpdate.salesOrderId);
        if (!originalOrder) return;

        // 다음 상태 값을 계산합니다. (0 -> 1 -> 2)
        const currentStatus = Number(originalOrder.status);

        // 현재 상태가 2(완료)이면, 더 이상 변경하지 않고 함수를 종료합니다.
        if (currentStatus === 2) {
            alert("'완료' 상태의 주문은 더 이상 상태를 변경할 수 없습니다.");
            return;
        }

        // 다음 상태 값을 계산합니다. (0 -> 1, 1 -> 2)
        const nextStatus = (currentStatus + 1) % 3;

        if (!window.confirm(`'${originalOrder.salesOrderId}' 주문의 상태를 '${getStatusText(nextStatus)}'(으)로 변경하시겠습니까?`)) {
            return;
        }
        
        try {
            // 서버에 전송할 페이로드를 준비합니다. (기존 데이터에 변경된 상태 값만 적용)
            const payload = { ...originalOrder, status: nextStatus };
            
            // PUT 요청으로 서버의 데이터를 업데이트합니다.
            await axios.put(`${API_BASE}/${originalOrder.salesOrderId}`, payload);

            // API 요청 성공 시, 화면(state)의 데이터도 즉시 업데이트하여 변경사항을 반영합니다.
            setSalesOrders(currentOrders =>
                currentOrders.map(order =>
                    order.salesOrderId === originalOrder.salesOrderId
                        ? { ...order, status: nextStatus } // 변경된 주문만 상태를 업데이트
                        : order
                )
            );
        } catch (err) {
            console.error("상태 업데이트 실패:", err);
            alert("상태 업데이트 중 오류가 발생했습니다.");
        }
    };

    // --- 모달 제어 함수 ---
    /** 신규 등록 모달을 여는 함수 */
    const openCreateModal = () => {
        // 신규 주문을 위한 기본 데이터 구조 설정
        setActiveOrder({
            isNew: true, salesOrderId: "", orderDate: new Date().toISOString().slice(0, 10),
            customerId: "", vesselId: "", customerPoNo: "", currencyCode: "KRW",
            status: 0, totalAmount: 0, createdBy: "react_user", remark: ""
        });
        setIsEditMode(true); // 처음부터 수정 모드로 시작
        setIsModalOpen(true);
    };

    /** 모달을 닫고 그리드를 새로고침하는 함수 */
    const closeModalAndRefresh = () => {
        setIsModalOpen(false);
        setActiveOrder(null);
        setIsEditMode(false);
        loadSalesOrders(); // 데이터 다시 로드
    };

    // --- 렌더링(Rendering) ---
    return (
        <div>
            <h2 className="font-bold text-2xl mb-4">판매 주문 관리</h2>

            {/* 검색 영역 */}
            <SearchLayout>
                <SearchTextBox label="고객ID" name="customerId" value={searchParams.customerId} onChange={handleSearchChange} />
                <SearchTextBox label="선박ID" name="vesselId" value={searchParams.vesselId} onChange={handleSearchChange} />
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-transparent select-none mb-1">작업 버튼</label>
                    <div className="flex space-x-2">
                        <button onClick={handleSearchReset} className="flex-1 bg-gray-500 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-600">초기화</button>
                        <InsertButton onClick={openCreateModal} />
                    </div>
                </div>
            </SearchLayout>

            {/* 데이터 그리드 영역 */}
            <div className="mt-6">
                <BodyGrid
                    columns={gridColumns}
                    data={salesOrders.map((order) => ({
                        ...order,
                        // 총금액을 통화 형식(쉼표 포함)으로 변환
                        totalAmount: order.totalAmount?.toLocaleString(),
                        status: getStatusText(order.status),
                    }))}
                    onRowClick={handleRowClick}
                    selectedId={selectedOrderId}
                    onStatusClick={handleStatusUpdate}
                />
            </div>

            {/* 모달 렌더링 */}
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