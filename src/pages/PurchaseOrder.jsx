import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:8081/api/purchaseOrders";

export default function PurchaseOrders() {
    const [orders, setOrders] = useState([]);               // 발주 마스터 목록
    const [selectedOrderId, setSelectedOrderId] = useState(null); // 선택된 발주번호
    const [details, setDetails] = useState([]);             // 발주 상세 목록

    const [search, setSearch] = useState({
        purchaseOrderId: "",
        supplierId: "",
        status: "",
        startDate: "",
        endDate: "",
    });

    // 검색조건 입력 핸들러
    const handleSearchChange = (e) => {
        const { name, value } = e.target;
        setSearch((prev) => ({ ...prev, [name]: value }));
    };

    // 발주 마스터 조회
    const loadOrders = async () => {
        try {
            // ✅ [수정] search 객체에서 값이 있는(빈 문자열이 아닌) 항목만 필터링하여 params로 전달합니다.
            // 이렇게 하면 백엔드 컨트롤러가 각 조건에 맞게 올바르게 분기할 수 있습니다.
            const activeParams = Object.fromEntries(
                Object.entries(search).filter(([_, value]) => value)
            );

            const { data } = await axios.get(API_BASE, { params: activeParams });
            setOrders(data);

            if (data.length > 0) {
                // 첫 번째 행을 기본 선택
                const firstId = data[0].purchaseOrderId;
                setSelectedOrderId(firstId);
                loadDetails(firstId);
            } else {
                setSelectedOrderId(null);
                setDetails([]);
            }
        } catch (err) {
            console.error("발주 조회 실패", err);
        }
    };

    // 발주 상세 조회
    const loadDetails = async (orderId) => {
        try {
            const { data } = await axios.get(`${API_BASE}/${orderId}/details`);
            setSelectedOrderId(orderId);
            setDetails(data);
        } catch (err) {
            console.error("상세 조회 실패", err);
        }
    };

    // 발주 추가 버튼
    const handleAdd = () => {
        alert("신규 발주 추가 화면을 열거나, 빈 행을 추가하도록 구현하세요.");
        // 👉 여기서는 단순히 안내, 실제로는 모달/폼 연결
    };

    // 발주 저장 버튼
    const handleSave = () => {
        alert("선택된 발주 저장 API 호출 로직 구현 예정");
        // 👉 선택된 발주 + 상세 데이터를 모아서 API로 저장하도록 구현
    };

    const handleInspectionRequest = async (order, e) => {
        try {
            e?.stopPropagation?.();

            // 1) 선택한 마스터의 상세 목록 조회
            const { data: fetchedDetails } = await axios.get(
                `${API_BASE}/${order.purchaseOrderId}/details`
            );

            //상세 목록 행 수 만큼 map돌려서 마스터 내용 넣기
            const payloadList = (Array.isArray(fetchedDetails) ? fetchedDetails : []).map(
                (d, idx) => ({
                    // ✅ 마스터 공통 정보
                    purchaseOrderId: order.purchaseOrderId,
                    supplierId: order.supplierId,
                    inspectorId: "yelia",

                    // ✅ 상세 행 정보 (키 이름 케이스 방어)
                    orderDetailId: d.orderDetailId ?? d.order_detail_id ?? d.ORDER_DETAIL_ID,
                    materialId: d.materialId ?? d.material_id ?? d.MATERIAL_ID,
                    orderQuantity: d.orderQuantity
                })
            );
            //payloadList 리스트에 담기
            console.log("payloadList = ", payloadList);



            // 3) 배열 그대로 백엔드로 전송 (복수형 엔드포인트)
            await axios.post(
                `${API_BASE}/${order.purchaseOrderId}/inspectionRequests`,
                payloadList
            );

            alert(`발주번호 ${order.purchaseOrderId} 검사요청이 완료되었습니다.`);
        } catch (err) {
            console.error("검사 요청 실패", err);
            alert(
                `검사 요청 실패: ${err?.response?.status ?? ""} ${err?.response?.data?.message ?? err.message
                }`
            );
        }
    };




    useEffect(() => {
        loadOrders();
    }, []);

    return (
        <div className="p-6 space-y-6">
            {/* 제목 */}
            <h2 className="text-2xl font-bold">발주 관리</h2>

            {/* 조회 조건 + 버튼 */}
            <div className="bg-white rounded-xl shadow p-4 flex flex-wrap gap-4 items-end">
                <input
                    type="text"
                    name="purchaseOrderId"
                    placeholder="발주번호"
                    value={search.purchaseOrderId}
                    onChange={handleSearchChange}
                    className="border px-3 py-2 rounded-md w-40"
                />
                <input
                    type="text"
                    name="supplierId"
                    placeholder="공급업체ID"
                    value={search.supplierId}
                    onChange={handleSearchChange}
                    className="border px-3 py-2 rounded-md w-40"
                />
                <select
                    name="status"
                    value={search.status}
                    onChange={handleSearchChange}
                    className="border px-3 py-2 rounded-md"
                >
                    <option value="">상태 선택</option>
                    <option value="0">작성</option>
                    <option value="1">승인</option>
                    <option value="2">입고완료</option>
                </select>
                <label className="flex items-center gap-2">
                        주문일 기준 시작:
                        <input
                            type="date"
                            name="startDate"
                            value={search.startDate}
                            onChange={handleSearchChange}
                            className="border px-3 py-2 rounded-md"
                        />
                    </label>

                    <label className="flex items-center gap-2">
                        종료:
                        <input
                            type="date"
                            name="endDate"
                            value={search.endDate}
                            onChange={handleSearchChange}
                            className="border px-3 py-2 rounded-md"
                        />
                    </label>


                <div className="ml-auto flex gap-2">
                    <button
                        onClick={loadOrders}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                        조회
                    </button>
                    <button
                        onClick={handleAdd}
                        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                    >
                        추가
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
                    >
                        저장
                    </button>
                </div>
            </div>

            {/* 상단: 발주 마스터 그리드 */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <h3 className="px-4 py-2 font-bold bg-gray-100">발주 목록</h3>
                <table className="w-full border-collapse">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 border">발주번호</th>
                            <th className="px-4 py-2 border">주문일</th><th className="px-4 py-2 border">납기일</th>   
                            <th className="px-4 py-2 border">공급업체</th>
                            <th className="px-4 py-2 border">상태</th>
                            <th className="px-4 py-2 border">총금액</th>
                            <th className="px-4 py-2 border">검사요청</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center py-4 text-gray-500">
                                    데이터가 없습니다.
                                </td>
                            </tr>
                        ) : (
                            orders.map((o) => (
                                <tr
                                    key={o.purchaseOrderId}
                                    onClick={() => loadDetails(o.purchaseOrderId)}
                                    className={`cursor-pointer hover:bg-blue-50 ${selectedOrderId === o.purchaseOrderId ? "bg-blue-100" : ""
                                        }`}
                                >
                                    <td className="px-4 py-2 border">{o.purchaseOrderId}</td>
                                    <td className="px-4 py-2 border">{o.orderDate}</td><td className="px-4 py-2 border">{o.deliveryDate}</td>
                                    <td className="px-4 py-2 border">{o.supplierId}</td>
                                    <td className="px-4 py-2 border">{o.status}</td>
                                    <td className="px-4 py-2 border">{o.totalAmount}</td>
                                    <td className="bg-red-100 px-4 py-2 border text-center">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation(); // 행 클릭 이벤트 막기
                                                handleInspectionRequest(o, e);

                                                console.log(o);
                                            }}
                                            className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                                        >
                                            검사요청
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* 하단: 발주 상세 그리드 (무조건 영역 노출) */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <h3 className="px-4 py-2 font-bold bg-gray-100">
                    발주 상세 {selectedOrderId && `(발주번호: ${selectedOrderId})`}
                </h3>
                <table className="w-full border-collapse">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 border">발주상세번호</th>
                            <th className="px-4 py-2 border">자재ID</th>
                            <th className="px-4 py-2 border">주문수량</th>
                            <th className="px-4 py-2 border">단가</th>
                            <th className="px-4 py-2 border">금액</th>
                            <th className="px-4 py-2 border">입고수량</th>
                            <th className="px-4 py-2 border">상태</th>

                        </tr>
                    </thead>
                    <tbody>
                        {details.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="text-center py-4 text-gray-500">
                                     상세 내역이 없습니다.
                                </td>
                            </tr>
                        ) : (
                            details.map((d) => (
                                <tr key={d.orderDetailId}>
                                    <td className="px-4 py-2 border">{d.orderDetailId}</td>
                                    <td className="px-4 py-2 border">{d.materialId}</td>
                                    <td className="px-4 py-2 border">{d.orderQuantity}</td>
                                    <td className="px-4 py-2 border">{d.unitPrice}</td>
                                    <td className="px-4 py-2 border">{d.amount}</td>
                                    <td className="px-4 py-2 border">{d.receivedQuantity}</td>
                                    <td className="px-4 py-2 border">{d.status}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}