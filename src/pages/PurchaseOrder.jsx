import { useEffect, useState } from "react";
import axios from "axios";

// API 기본 주소 설정
const API_BASE = "http://localhost:8081/api";

const getStatusText = (status) => {
    switch (status) {
        case 0: return "대기";
        case 1: return "승인";
        case 2: return "취소";
        default: return "대기";
    }
};

// 신규 발주를 위한 기본 데이터 구조
const initialOrderState = {
    purchaseOrder: {
        purchaseOrderId: "",
        orderDate: new Date().toISOString().slice(0, 10),
        supplierId: null,
        status: 0,
        totalAmount: 0,
        createBy: "react_user",
    },
    orderDetails: [],
};

export default function PurchaseOrders() {
    // --- State Management ---
    const [orders, setOrders] = useState([]);
    const [details, setDetails] = useState([]);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [loading, setLoading] = useState({ orders: false, details: false });
    
    const [search, setSearch] = useState({
        purchaseOrderId: "",
        startDate: "",
        endDate: "",
        supplierName: "",
        status: "",
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState(initialOrderState);

    // --- Data Fetching Functions ---
    const loadOrders = async () => {
        setLoading(prev => ({ ...prev, orders: true }));
        const params = { ...search };
        Object.keys(params).forEach(key => { if (!params[key]) delete params[key]; });
        try {
            const { data } = await axios.get(`${API_BASE}/purchaseOrders`, { params });
            setOrders(data);
            if (data.length > 0) {
                setSelectedOrderId(data[0].purchaseOrderId);
            } else {
                setSelectedOrderId(null);
                setDetails([]);
            }
        } catch (err) {
            console.error("발주 목록 조회 실패:", err);
            alert("데이터를 조회하는 중 오류가 발생했습니다.");
        } finally {
            setLoading(prev => ({ ...prev, orders: false }));
        }
    };

    const loadDetails = async (orderId) => {
        if (!orderId) {
            setDetails([]);
            return;
        }
        setLoading(prev => ({ ...prev, details: true }));
        try {
            const { data } = await axios.get(`${API_BASE}/purchaseOrders/${orderId}`);
            setDetails(data.orderDetails || []);
        } catch (err) {
            console.error(`상세 정보 조회 실패 (ID: ${orderId}):`, err);
            setDetails([]);
        } finally {
            setLoading(prev => ({ ...prev, details: false }));
        }
    };

    // --- useEffect Hooks ---
    useEffect(() => { loadOrders(); }, []);
    useEffect(() => { loadDetails(selectedOrderId); }, [selectedOrderId]);

    // --- CRUD & Modal Handlers ---
    const handleSearchChange = (e) => {
        const { name, value } = e.target;
        setSearch((prev) => ({ ...prev, [name]: value }));
    };

    const handleAddNew = () => {
        setEditingOrder(initialOrderState);
        setIsModalOpen(true);
    };

    const handleEdit = async (orderId) => {
        try {
            const { data } = await axios.get(`${API_BASE}/purchaseOrders/${orderId}`);
            setEditingOrder(data);
            setIsModalOpen(true);
        } catch (err) {
            console.error("수정 데이터 조회 실패:", err);
            alert("데이터를 불러오지 못했습니다.");
        }
    };

    const handleCloseModal = () => setIsModalOpen(false);

    const handleSave = async () => {
        if (!editingOrder.purchaseOrder.supplierId) {
            alert("거래처 ID를 입력해주세요.");
            return;
        }

        const calculatedTotal = editingOrder.orderDetails.reduce(
            (sum, detail) => sum + (Number(detail.amount) || 0),
            0
        );

        const orderToSave = {
            ...editingOrder,
            purchaseOrder: {
                ...editingOrder.purchaseOrder,
                totalAmount: calculatedTotal,
            },
        };

        try {
            await axios.post(`${API_BASE}/purchaseOrders`, orderToSave);
            alert("성공적으로 저장되었습니다.");
            handleCloseModal();
            await loadOrders();
        } catch (err) {
            console.error("저장 실패:", err);
            alert(`저장 중 오류가 발생했습니다: ${err.response?.data?.message || err.message}`);
        }
    };

    const handleDelete = async (orderId, e) => {
        e.stopPropagation();
        if (window.confirm(`발주서 [${orderId}]을(를) 정말 삭제하시겠습니까?`)) {
            try {
                await axios.delete(`${API_BASE}/purchaseOrders/${orderId}`);
                alert("성공적으로 삭제되었습니다.");
                await loadOrders();
            } catch (err) {
                console.error("삭제 실패:", err);
                alert("삭제 중 오류가 발생했습니다.");
            }
        }
    };
    
    // --- MES Integration ---
    const handleInspectionRequest = async (order, e) => {
        e.stopPropagation(); 
        
        if (!window.confirm(`발주서 [${order.purchaseOrderId}]의 모든 품목에 대한 검사를 요청하시겠습니까?`)) {
            return;
        }

        try {
            const { data: fullOrderData } = await axios.get(`${API_BASE}/purchaseOrders/${order.purchaseOrderId}`);
            const detailsToInspect = fullOrderData.orderDetails || [];

            if (detailsToInspect.length === 0) {
                alert("검사를 요청할 상세 품목이 없습니다.");
                return;
            }

            const payloadList = detailsToInspect.map(d => ({
                purchaseOrderId: order.purchaseOrderId,
                supplierId: fullOrderData.purchaseOrder.supplierId,
                inspectorId: "react_user",
                orderDetailId: d.orderDetailId,
                materialId: d.materialId,
                orderQuantity: d.orderQuantity,
            }));

            console.log("MES 검사 요청 데이터:", payloadList);

            await axios.post(
                `${API_BASE}/purchaseOrders/${order.purchaseOrderId}/inspectionRequests`,
                payloadList
            );

            alert(`발주서 [${order.purchaseOrderId}]에 대한 검사 요청이 성공적으로 전송되었습니다.`);

        } catch (err) {
            console.error("검사 요청 실패:", err);
            alert(`검사 요청 중 오류가 발생했습니다: ${err.response?.data?.message || err.message}`);
        }
    };


    // --- Detail Row Handlers ---
    const handleAddDetailRow = () => {
        const newDetail = {
            materialId: "", materialNm: "", orderQuantity: 1,
            unitPrice: 0, amount: 0, status: 0,
        };
        setEditingOrder(prev => ({
            ...prev,
            orderDetails: [...prev.orderDetails, newDetail],
        }));
    };

    const handleRemoveDetailRow = (index) => {
        setEditingOrder(prev => ({
            ...prev,
            orderDetails: prev.orderDetails.filter((_, i) => i !== index),
        }));
    };

    const handleDetailInputChange = (e, index) => {
        const { name, value } = e.target;
        const newOrderDetails = [...editingOrder.orderDetails];
        const detailToUpdate = { ...newOrderDetails[index] };

        const numericFields = ['materialId', 'orderQuantity', 'unitPrice', 'status'];
        detailToUpdate[name] = numericFields.includes(name) ? Number(value) : value;

        if (name === 'orderQuantity' || name === 'unitPrice') {
            const qty = Number(detailToUpdate.orderQuantity) || 0;
            const price = Number(detailToUpdate.unitPrice) || 0;
            detailToUpdate.amount = qty * price;
        }
        
        newOrderDetails[index] = detailToUpdate;
        setEditingOrder(prev => ({ ...prev, orderDetails: newOrderDetails }));
    };
    
    const handleMaterialIdBlur = async (e, index) => {
        const materialId = e.target.value;
        if (!materialId) return;

        try {
            const { data } = await axios.get(`${API_BASE}/materials/${materialId}`);
            
            const newOrderDetails = [...editingOrder.orderDetails];
            const detailToUpdate = { ...newOrderDetails[index] };

            detailToUpdate.materialNm = data.materialNm;
            detailToUpdate.unitPrice = data.unitPrice;
            const qty = Number(detailToUpdate.orderQuantity) || 0;
            const price = Number(detailToUpdate.unitPrice) || 0;
            detailToUpdate.amount = qty * price;
            
            newOrderDetails[index] = detailToUpdate;
            setEditingOrder(prev => ({ ...prev, orderDetails: newOrderDetails }));

        } catch (error) {
            console.error("자재 정보 조회 실패:", error);
            alert(`[${materialId}]에 대한 자재 정보를 찾을 수 없습니다.`);
            const newOrderDetails = [...editingOrder.orderDetails];
            const detailToUpdate = { ...newOrderDetails[index] };
            detailToUpdate.materialNm = "";
            detailToUpdate.unitPrice = 0;
            detailToUpdate.amount = 0;
            newOrderDetails[index] = detailToUpdate;
            setEditingOrder(prev => ({ ...prev, orderDetails: newOrderDetails }));
        }
    };

    // --- Render ---
    return (
    <>
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">발주 등록</h2>
            {/* 검색 필터 */}
            <div className="bg-white rounded-xl shadow p-4 flex flex-wrap gap-4 items-end">
                <input 
                    type="text"
                    name="purchaseOrderId"
                    placeholder="발주 번호"
                    value={search.purchaseOrderId}
                    onChange={handleSearchChange}
                    className="border px-3 py-2 rounded-md"
                />
                <input type="date" name="startDate" value={search.startDate} onChange={handleSearchChange} className="border px-3 py-2 rounded-md"/>
                <input type="date" name="endDate" value={search.endDate} onChange={handleSearchChange} className="border px-3 py-2 rounded-md"/>
                <input type="text" name="supplierName" placeholder="거래처명" value={search.supplierName} onChange={handleSearchChange} className="border px-3 py-2 rounded-md"/>
                <select name="status" value={search.status} onChange={handleSearchChange} className="border px-3 py-2 rounded-md">
                    <option value="">상태 (전체)</option>
                    <option value="0">대기</option>
                    <option value="1">승인</option>
                    <option value="2">취소</option>
                </select>
                <div className="ml-auto flex gap-2">
                    <button onClick={loadOrders} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600" disabled={loading.orders}>
                        {loading.orders ? "조회 중..." : "조회"}
                    </button>
                    <button onClick={handleAddNew} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">신규 등록</button>
                </div>
            </div>

            {/* 발주 마스터 그리드 */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <h3 className="px-4 py-2 font-bold bg-gray-100 border-b">발주 목록</h3>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 border text-left text-sm font-semibold text-gray-600">발주 번호</th>
                                <th className="px-4 py-2 border text-left text-sm font-semibold text-gray-600">발주 일자</th>
                                <th className="px-4 py-2 border text-left text-sm font-semibold text-gray-600">거래처명</th>
                                <th className="px-4 py-2 border text-left text-sm font-semibold text-gray-600">상태</th>
                                <th className="px-4 py-2 border text-left text-sm font-semibold text-gray-600">총 금액</th>
                                <th className="px-4 py-2 border text-center text-sm font-semibold text-gray-600">작업</th>
                                <th className="px-4 py-2 border text-center text-sm font-semibold text-gray-600">MES 연동</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading.orders ? (
                                <tr><td colSpan="7" className="text-center py-4 text-gray-500">로딩 중...</td></tr>
                            ) : !orders.length ? (
                                <tr><td colSpan="7" className="text-center py-4 text-gray-500">데이터가 없습니다.</td></tr>
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
                                            <button onClick={(e) => {e.stopPropagation(); handleEdit(o.purchaseOrderId);}} className="px-2 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm">수정</button>
                                            <button onClick={(e) => handleDelete(o.purchaseOrderId, e)} className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm">삭제</button>
                                        </td>
                                        <td className="px-4 py-2 border text-center">
                                            <button 
                                                onClick={(e) => handleInspectionRequest(o, e)} 
                                                className="px-2 py-1 bg-teal-500 text-white rounded-md hover:bg-teal-600 text-sm"
                                            >
                                                검사 요청
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 발주 상세 그리드 */}
            <div className="bg-white rounded-xl shadow overflow-hidden mt-6">
                <h3 className="px-4 py-2 font-bold bg-gray-100 border-b">발주 상세 정보 {selectedOrderId && `(발주 번호: ${selectedOrderId})`}</h3>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead className="bg-gray-50">
                                <tr>
                                <th className="px-4 py-2 border text-left text-sm font-semibold text-gray-600">자재 ID</th>
                                <th className="px-4 py-2 border text-left text-sm font-semibold text-gray-600">자재명</th>
                                <th className="px-4 py-2 border text-left text-sm font-semibold text-gray-600">발주 수량</th>
                                <th className="px-4 py-2 border text-left text-sm font-semibold text-gray-600">단가</th>
                                <th className="px-4 py-2 border text-left text-sm font-semibold text-gray-600">금액</th>
                                <th className="px-4 py-2 border text-left text-sm font-semibold text-gray-600">상태</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading.details ? (
                                <tr><td colSpan="6" className="text-center py-4 text-gray-500">로딩 중...</td></tr>
                            ) : !details.length ? (
                                <tr><td colSpan="6" className="text-center py-4 text-gray-500">{selectedOrderId ? "상세 품목이 없습니다." : "상단 목록에서 발주 건을 선택해주세요."}</td></tr>
                            ) : (
                                details.map((d, index) => (
                                    <tr key={d.orderDetailId || index}>
                                        <td className="px-4 py-2 border">{d.materialId}</td>
                                        <td className="px-4 py-2 border">{d.materialNm || 'N/A'}</td>
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

        {/* 신규/수정 모달 */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl p-6 space-y-4 overflow-y-auto max-h-[95vh]">
                    <h2 className="text-xl font-bold">발주 {editingOrder.purchaseOrder.purchaseOrderId ? '수정' : '등록'}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border p-4 rounded-md">
                        <input placeholder="발주 번호" value={editingOrder.purchaseOrder.purchaseOrderId || ''} disabled={!!editingOrder.purchaseOrder.purchaseOrderId}
                            onChange={e => !editingOrder.purchaseOrder.purchaseOrderId && setEditingOrder(prev => ({...prev, purchaseOrder: {...prev.purchaseOrder, purchaseOrderId: e.target.value}}))} 
                            className="border px-3 py-2 rounded-md disabled:bg-gray-100" />
                        <input type="date" value={editingOrder.purchaseOrder.orderDate} 
                            onChange={e => setEditingOrder(prev => ({...prev, purchaseOrder: {...prev.purchaseOrder, orderDate: e.target.value}}))} 
                            className="border px-3 py-2 rounded-md" />
                        <input type="number" placeholder="거래처 ID" value={editingOrder.purchaseOrder.supplierId || ''} 
                            onChange={e => setEditingOrder(prev => ({...prev, purchaseOrder: {...prev.purchaseOrder, supplierId: e.target.value ? Number(e.target.value) : null }}))} 
                            className="border px-3 py-2 rounded-md" />
                        <select
                            value={editingOrder.purchaseOrder.status || 0}
                            onChange={e => setEditingOrder(prev => ({
                                ...prev,
                                purchaseOrder: { ...prev.purchaseOrder, status: Number(e.target.value) }
                            }))}
                            className="border px-3 py-2 rounded-md"
                        >
                            <option value="0">대기</option>
                            <option value="1">승인</option>
                            <option value="2">취소</option>
                        </select>
                    </div>

                    <div className="border p-4 rounded-md space-y-2">
                        <div className="flex justify-between items-center"><p className="font-bold">발주 상세</p>
                            <button onClick={handleAddDetailRow} className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600">상세 행 추가</button>
                        </div>
                        <table className="w-full border-collapse text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-2 py-1 border">자재 ID</th>
                                    <th className="px-2 py-1 border">자재명</th>
                                    <th className="px-2 py-1 border w-24">수량</th>
                                    <th className="px-2 py-1 border w-28">단가</th>
                                    <th className="px-2 py-1 border w-32">금액</th>
                                    <th className="px-2 py-1 border w-24">상태</th>
                                    <th className="px-2 py-1 border w-20">작업</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!editingOrder.orderDetails.length ? (
                                    <tr><td colSpan="7" className="text-center py-4 text-gray-400">상세 품목을 추가해주세요.</td></tr>
                                ) : (
                                    editingOrder.orderDetails.map((detail, index) => (
                                        <tr key={index}>
                                            <td className="border p-1">
                                                <input type="number" name="materialId" value={detail.materialId || ''} 
                                                    onChange={(e) => handleDetailInputChange(e, index)}
                                                    onBlur={(e) => handleMaterialIdBlur(e, index)}
                                                    className="w-full px-2 py-1 border rounded-md" />
                                            </td>
                                            <td className="border p-1 bg-gray-50 text-gray-600">{detail.materialNm || ''}</td>
                                            <td className="border p-1">
                                                <input type="number" name="orderQuantity" value={detail.orderQuantity || ''} onChange={(e) => handleDetailInputChange(e, index)} className="w-full px-2 py-1 border rounded-md text-right" />
                                            </td>
                                            <td className="border p-1">
                                                <input type="number" name="unitPrice" value={detail.unitPrice || ''} onChange={(e) => handleDetailInputChange(e, index)} className="w-full px-2 py-1 border rounded-md text-right" />
                                            </td>
                                            <td className="border p-1 text-right bg-gray-100 px-2">{Number(detail.amount || 0).toLocaleString()}</td>
                                            <td className="border p-1">
                                                <select
                                                    name="status"
                                                    value={detail.status || 0}
                                                    onChange={(e) => handleDetailInputChange(e, index)}
                                                    className="w-full border px-2 py-1 rounded-md"
                                                >
                                                    <option value="0">대기</option>
                                                    <option value="1">승인</option>
                                                    <option value="2">취소</option>
                                                </select>
                                            </td>
                                            <td className="border p-1 text-center">
                                                <button onClick={() => handleRemoveDetailRow(index)} className="px-2 py-1 bg-red-500 text-white text-xs rounded-md hover:bg-red-600">삭제</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    
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