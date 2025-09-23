import { useEffect, useState } from "react";
import axios from "axios";

// API 기본 주소
const API_BASE = "http://localhost:8081/api/purchaseOrders";

// 상태 코드를 텍스트로 변환하는 헬퍼 함수
const getStatusText = (status) => {
    switch (status) {
        case 0: return "작성";
        case 1: return "승인";
        case 2: return "입고완료";
        default: return "알 수 없음";
    }
};

// 신규 발주를 위한 기본 데이터 구조
const initialOrderState = {
    purchaseOrder: {
        purchaseOrderId: "", // 직접 입력하거나 서버에서 생성
        orderDate: new Date().toISOString().slice(0, 10), // 오늘 날짜
        supplierId: null,
        status: 0,
        totalAmount: 0,
        createBy: "react_user", // 예시 사용자
    },
    orderDetails: [],
};

export default function PurchaseOrders() {
    // 상태 관리
    const [orders, setOrders] = useState([]);      // 발주 마스터 목록
    const [details, setDetails] = useState([]);    // 선택된 발주의 상세 목록
    const [selectedOrderId, setSelectedOrderId] = useState(null); // 선택된 발주 ID
    const [loading, setLoading] = useState({ orders: false, details: false }); // 로딩 상태

    // 검색 조건 (백엔드와 동기화)
    const [search, setSearch] = useState({
        startDate: "",
        endDate: "",
        supplierName: "", // ✅ supplierId -> supplierName 으로 변경
        status: "",       // ✅ status 검색 조건 추가
    });

    // 모달 상태 및 편집 데이터 상태
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState(initialOrderState);

    // 검색조건 입력 핸들러
    const handleSearchChange = (e) => {
        const { name, value } = e.target;
        setSearch((prev) => ({ ...prev, [name]: value }));
    };

    // 발주 마스터 조회 함수 (로딩 상태 추가)
    const loadOrders = async () => {
        setLoading(prev => ({ ...prev, orders: true }));
        const params = { ...search };

        // 빈 파라미터는 API 요청 시 보내지 않도록 정리
        Object.keys(params).forEach(key => {
            if (params[key] === null || params[key] === '') {
                delete params[key];
            }
        });

        try {
            const { data } = await axios.get(API_BASE, { params });
            setOrders(data);

            if (data.length > 0) {
                // 첫 번째 행을 자동으로 선택
                setSelectedOrderId(data[0].purchaseOrderId);
            } else {
                // 조회 결과가 없으면 상세 정보도 초기화
                setSelectedOrderId(null);
                setDetails([]);
            }
        } catch (err) {
            console.error("발주 목록 조회 실패:", err);
            alert("데이터 조회 중 오류가 발생했습니다.");
        } finally {
            setLoading(prev => ({ ...prev, orders: false }));
        }
    };

    // 발주 상세 조회 함수 (로딩 상태 추가)
    const loadDetails = async (orderId) => {
        if (!orderId) {
            setDetails([]);
            return;
        }
        setLoading(prev => ({ ...prev, details: true }));
        try {
            const { data } = await axios.get(`${API_BASE}/${orderId}`);
            // 백엔드 DTO 구조에 맞게 data.orderDetails를 사용
            setDetails(data.orderDetails || []);
        } catch (err) {
            console.error(`상세 조회 실패 (ID: ${orderId}):`, err);
            setDetails([]); // 오류 발생 시 상세 내역 비우기
        } finally {
            setLoading(prev => ({ ...prev, details: false }));
        }
    };

    // 컴포넌트 첫 로드 시 발주 목록 조회
    useEffect(() => {
        loadOrders();
    }, []);

    // 선택된 발주 ID가 변경되면 상세 내역을 다시 조회
    useEffect(() => {
        loadDetails(selectedOrderId);
    }, [selectedOrderId]);

    // 모달 열기 (신규)
    const handleAddNew = () => {
        setEditingOrder(initialOrderState);
        setIsModalOpen(true);
    };

    // 모달 열기 (수정)
    const handleEdit = async (orderId) => {
        try {
            // 상세 정보를 포함한 전체 데이터를 다시 불러옵니다.
            const { data } = await axios.get(`${API_BASE}/${orderId}`);
            setEditingOrder(data);
            setIsModalOpen(true);
        } catch (err) {
            console.error("수정할 데이터 조회 실패:", err);
            alert("데이터를 불러오는 데 실패했습니다.");
        }
    };

    // 모달 닫기
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingOrder(initialOrderState);
    };

    // 저장 처리 (신규/수정 공통)
    const handleSave = async () => {
        if (!editingOrder.purchaseOrder.supplierId) {
            alert("공급업체 ID를 입력해주세요.");
            return;
        }
        
        try {
            // 백엔드의 savePurchaseOrderWithDetails가 신규/수정을 모두 처리
            await axios.post(API_BASE, editingOrder);
            alert("성공적으로 저장되었습니다.");
            handleCloseModal();
            await loadOrders(); // 목록 새로고침
        } catch (err) {
            console.error("저장 실패:", err);
            alert(`저장 중 오류가 발생했습니다: ${err.response?.data?.message || err.message}`);
        }
    };

    // 삭제 처리
    const handleDelete = async (orderId, e) => {
        e.stopPropagation(); // 행 클릭 이벤트 전파 방지
        if (window.confirm(`정말로 발주번호 [${orderId}]를 삭제하시겠습니까?`)) {
            try {
                await axios.delete(`${API_BASE}/${orderId}`);
                alert("삭제되었습니다.");
                await loadOrders(); // 목록 새로고침
            } catch (err) {
                console.error("삭제 실패:", err);
                alert("삭제 중 오류가 발생했습니다.");
            }
        }
    };

    const handleInspectionRequest = (order, e) => {
        e.stopPropagation();
        alert(`검사요청 기능 구현 예정: ${order.purchaseOrderId}`);
    };
    // ----------------------------------------------------

    return (
    <> {/* 최상위 Fragment */}
        <div className="p-6 space-y-6">
            {/* 조회 조건 UI */}
            <div className="bg-white rounded-xl shadow p-4 flex flex-wrap gap-4 items-end">
                <input type="date" name="startDate" value={search.startDate} onChange={handleSearchChange} className="border px-3 py-2 rounded-md"/>
                <input type="date" name="endDate" value={search.endDate} onChange={handleSearchChange} className="border px-3 py-2 rounded-md"/>
                <input type="text" name="supplierName" placeholder="공급업체명" value={search.supplierName} onChange={handleSearchChange} className="border px-3 py-2 rounded-md"/>
                <select name="status" value={search.status} onChange={handleSearchChange} className="border px-3 py-2 rounded-md">
                    <option value="">상태 (전체)</option>
                    <option value="0">작성</option>
                    <option value="1">승인</option>
                    <option value="2">입고완료</option>
                </select>
                
                <div className="ml-auto flex gap-2">
                    <button onClick={loadOrders} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600" disabled={loading.orders}>
                        {loading.orders ? "조회 중..." : "조회"}
                    </button>
                    <button onClick={handleAddNew} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">추가</button>
                    <button onClick={() => alert("저장 기능은 모달 안에서 처리됩니다.")} className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600">저장</button>
                </div>
            </div>

            {/* 상단: 발주 마스터 그리드 */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <h3 className="px-4 py-2 font-bold bg-gray-100">발주 목록</h3>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 border">발주번호</th>
                                <th className="px-4 py-2 border">주문일</th>
                                <th className="px-4 py-2 border">공급업체명</th>
                                <th className="px-4 py-2 border">상태</th>
                                <th className="px-4 py-2 border">총금액</th>
                                <th className="px-4 py-2 border">관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading.orders ? (
                                <tr><td colSpan="6" className="text-center py-4 text-gray-500">로딩 중...</td></tr>
                            ) : orders.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-4 text-gray-500">데이터가 없습니다.</td></tr>
                            ) : (
                                orders.map((o) => (
                                    <tr key={o.purchaseOrderId}
                                        onClick={() => setSelectedOrderId(o.purchaseOrderId)}
                                        className={`cursor-pointer hover:bg-blue-50 ${selectedOrderId === o.purchaseOrderId ? "bg-blue-100" : ""}`}>
                                        <td className="px-4 py-2 border">{o.purchaseOrderId}</td>
                                        <td className="px-4 py-2 border">{o.orderDate}</td>
                                        <td className="px-4 py-2 border">{o.supplierName}</td>
                                        <td className="px-4 py-2 border">{getStatusText(o.status)}</td>
                                        <td className="px-4 py-2 border text-right">{Number(o.totalAmount || 0).toLocaleString()}</td>
                                        <td className="px-4 py-2 border text-center space-x-2">
                                            <button onClick={(e) => {e.stopPropagation(); handleEdit(o.purchaseOrderId);}} className="px-2 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm">
                                                수정
                                            </button>
                                            <button onClick={(e) => handleDelete(o.purchaseOrderId, e)} className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm">
                                                삭제
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 하단: 발주 상세 그리드 */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <h3 className="px-4 py-2 font-bold bg-gray-100">
                    발주 상세 {selectedOrderId && `(발주번호: ${selectedOrderId})`}
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 border">품번</th>
                                <th className="px-4 py-2 border">품명</th>
                                <th className="px-4 py-2 border">주문수량</th>
                                <th className="px-4 py-2 border">단가</th>
                                <th className="px-4 py-2 border">금액</th>
                                <th className="px-4 py-2 border">상태</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading.details ? (
                                <tr><td colSpan="6" className="text-center py-4 text-gray-500">로딩 중...</td></tr>
                            ) : details.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-4 text-gray-500">
                                        {selectedOrderId ? "상세 내역이 없습니다." : "상단 목록에서 발주를 선택하세요."}
                                    </td>
                                </tr>
                            ) : (
                                details.map((d) => (
                                    <tr key={d.orderDetailId}>
                                        <td className="px-4 py-2 border">{d.materialId}</td>
                                        <td className="px-4 py-2 border">{d.materialName || 'N/A'}</td>
                                        <td className="px-4 py-2 border text-right">{Number(d.orderQuantity || 0).toLocaleString()}</td>
                                        <td className="px-4 py-2 border text-right">{Number(d.unitPrice || 0).toLocaleString()}</td>
                                        <td className="px-4 py-2 border text-right">{Number(d.amount || 0).toLocaleString()}</td>
                                        <td className="px-4 py-2 border">{getStatusText(d.status)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* 등록/수정 모달 */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6 space-y-4">
                    <h2 className="text-xl font-bold">발주 {editingOrder.purchaseOrder.purchaseOrderId ? '수정' : '등록'}</h2>
                    
                    {/* 마스터 정보 입력 폼 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border p-4 rounded-md">
                         <input 
                            placeholder="발주번호" 
                            value={editingOrder.purchaseOrder.purchaseOrderId || ''} 
                            disabled={!!editingOrder.purchaseOrder.purchaseOrderId} // 수정 시 비활성화
                            onChange={e => {
                                // 신규 등록일 때만 ID 변경 허용
                                if (!editingOrder.purchaseOrder.purchaseOrderId) {
                                    setEditingOrder(prev => ({...prev, purchaseOrder: {...prev.purchaseOrder, purchaseOrderId: e.target.value}}))
                                }
                            }} 
                            className="border px-3 py-2 rounded-md disabled:bg-gray-100" 
                         />
                         <input 
                            type="date" 
                            value={editingOrder.purchaseOrder.orderDate} 
                            onChange={e => setEditingOrder(prev => ({...prev, purchaseOrder: {...prev.purchaseOrder, orderDate: e.target.value}}))} 
                            className="border px-3 py-2 rounded-md" 
                         />
                         <input 
                            type="number"
                            placeholder="공급업체 ID" 
                            value={editingOrder.purchaseOrder.supplierId || ''} 
                            onChange={e => setEditingOrder(prev => ({...prev, purchaseOrder: {...prev.purchaseOrder, supplierId: e.target.value ? Number(e.target.value) : null }}))} 
                            className="border px-3 py-2 rounded-md" 
                         />
                         {/* 여기에 필요한 다른 마스터 필드를 추가할 수 있습니다. */}
                    </div>

                    {/* 상세 정보 테이블 (기능 추가 필요) */}
                    <div className="border p-4 rounded-md space-y-2">
                        <div className="flex justify-between items-center">
                            <p className="font-bold">발주 상세</p>
                            <button onClick={() => alert("상세 행 추가 기능 구현 필요")} className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md">상세 행 추가</button>
                        </div>
                        <table className="w-full border-collapse">
                            {/* 상세 테이블 UI... */}
                            <thead>
                                <tr>
                                    <th className="px-2 py-1 border">품번</th>
                                    <th className="px-2 py-1 border">수량</th>
                                    <th className="px-2 py-1 border">단가</th>
                                    <th className="px-2 py-1 border">작업</th>
                                </tr>
                            </thead>
                            <tbody>
                                {editingOrder.orderDetails.length > 0 ? (
                                    editingOrder.orderDetails.map((detail, index) => (
                                        <tr key={index}>
                                            <td className="border p-1">{detail.materialId}</td>
                                            <td className="border p-1">{detail.orderQuantity}</td>
                                            <td className="border p-1">{detail.unitPrice}</td>
                                            <td className="border p-1 text-center">
                                                <button className="text-red-500">삭제</button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="text-center py-4 text-gray-400">상세 항목을 추가해주세요.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* 모달 버튼 */}
                    <div className="flex justify-end gap-4 pt-4">
                        <button onClick={handleCloseModal} className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400">취소</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">저장</button>
                    </div>
                </div>
            </div>
        )}
    </>
);
}