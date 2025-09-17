import { useEffect, useState } from "react";
import axios from "axios";

import SearchLayout from "../layouts/SearchLayout";
import SearchTextBox from "../components/search/SearchTextBox";
import SearchButton from "../components/search/SearchButton";
import BodyGrid from "../layouts/BodyGrid";

const API_BASE = "http://localhost:8081/api/sales_orders";

export default function SalesOrder() {
  // --- 상태(State) 관리 ---
  const [salesOrders, setSalesOrders] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [vesselId, setVesselId] = useState("");

  // --- 데이터 로딩 ---
  const loadSalesOrders = async () => {
    try {
      const response = await axios.get(`${API_BASE}`, {
        params: {
          customerId: customerId || undefined,
          vesselId: vesselId || undefined,
        },
      });
      setSalesOrders(response.data);
    } catch (error) {
      console.error("판매 등록 조회 실패:", error);
    }
  };

  useEffect(() => {
    loadSalesOrders();
  }, []);

  // --- 그리드 컬럼 정의 ---
  const columns = [
    { header: "수주번호", accessor: "salesOrderId" },
    { header: "수주일자", accessor: "orderDate" },
    { header: "고객ID", accessor: "customerId" },
    { header: "선박ID", accessor: "vesselId" },
    { header: "고객발주번호", accessor: "customerPoNo" },
    { header: "통화", accessor: "currencyCode" },
    { header: "상태", accessor: "status" },
    { header: "총금액", accessor: "totalAmount" },
    { header: "등록자", accessor: "createdBy" },
    { header: "승인일시", accessor: "approvedDate" },
    { header: "승인자", accessor: "approvedBy" },
    { header: "비고", accessor: "remark" },
  ];

  // --- 렌더링 ---
  return (
    <div className="p-6">
      <h2 className="font-bold text-xl mb-4">판매 등록 조회</h2>

      <SearchLayout>
        <SearchTextBox
          label="고객ID"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
        />
        <SearchTextBox
          label="선박ID"
          value={vesselId}
          onChange={(e) => setVesselId(e.target.value)}
        />
        <SearchButton onClick={loadSalesOrders}>조회</SearchButton>
      </SearchLayout>

      <div className="mt-6">
        <BodyGrid
          columns={columns}
          data={salesOrders.map((order) => ({
            ...order,
            _key: order.salesOrderId,
            totalAmount: order.totalAmount?.toLocaleString(), // 숫자 포맷 적용
            approvedDate: order.approvedDate || "-",
            approvedBy: order.approvedBy || "-",
          }))}
        />
      </div>
    </div>
  );
}
