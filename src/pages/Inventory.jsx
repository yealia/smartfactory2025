import { useEffect, useState } from "react";
import axios from "axios";
import BodyGrid from "../layouts/BodyGrid";
import SearchLayout from "../layouts/SearchLayout";
import SearchButton from "../components/search/SearchButton";
import SearchTextBox from "../components/search/SearchTextBox"; // ✅ SearchTextBox import 추가

export default function InventoryPage() {
    const [inventories, setInventories] = useState([]);
    const [err, setErr] = useState("");

    // ✅ [수정] 검색 조건 state 변경 (inventoryId 추가, location 삭제)
    const [inventoryId, setInventoryId] = useState("");
    const [materialId, setMaterialId] = useState("");

    // ERP 백엔드 재고 API
    const API_BASE = "http://localhost:8081/api/inventory";

    // 테이블 컬럼 정의 (기존과 동일)
    const columns = [
        { header: "재고ID", accessor: "inventoryId" },
        { header: "자재ID", accessor: "materialId" },
        { header: "창고", accessor: "warehouse" }, // warehouse로 수정
        { header: "위치", accessor: "location" },
        { header: "현재고", accessor: "onHand" },
        { header: "예약수량", accessor: "reservedQty" },
        { header: "안전재고", accessor: "safetyStock" },
        { header: "재주문점", accessor: "reorderPoint" },
        { header: "수정일", accessor: "updatedAt" },
        { header: "생성일", accessor: "createdAt" },
        { header: "버전", accessor: "version" },
    ];

    // 컴포넌트 첫 로딩 시 전체 조회
    useEffect(() => {
        loadInventory();
    }, []);

    // ✅ [수정] 전체/검색 조회 함수
    const loadInventory = async () => {
        setErr("");
        try {
            // Spring Boot 컨트롤러에 맞게 파라미터 구성
            const params = {
                inventoryId: inventoryId || undefined,
                materialId: materialId || undefined,
            };

            const { data } = await axios.get(API_BASE, { params });

            const list = (data || []).map((row, idx) => ({
                _key: row.inventoryId || idx,
                ...row,
            }));

            setInventories(list);
        } catch (e) {
            console.error("재고 조회 실패", e);
            setErr("재고 목록 조회에 실패했습니다.");
        }
    };
    
    // 행 클릭 이벤트 핸들러 (기능은 비워둠)
    const onRowClick = (row) => {
        console.log("row clicked:", row);
    };

    return (
        <div className="p-6">
            <h2 className="font-bold text-xl mb-4">재고 관리</h2>
            
            {/* ✅ [수정] 검색 UI 변경 */}
            <SearchLayout>
                <SearchTextBox
                    label="재고 ID"
                    value={inventoryId}
                    onChange={(e) => setInventoryId(e.target.value)}
                />
                <SearchTextBox
                    label="자재 ID"
                    value={materialId}
                    onChange={(e) => setMaterialId(e.target.value)}
                    type="number" // 자재 ID는 숫자이므로 타입 지정
                />
                <SearchButton onClick={loadInventory}>조회</SearchButton>
            </SearchLayout>

            {err && (
                <div className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-red-700">
                    {err}
                </div>
            )}
            
            {/* 그리드 */}
            <div className="mt-6">
                 <BodyGrid
                    columns={columns}
                    data={inventories}
                    readOnly={true}
                    onRowClick={onRowClick}
                />
            </div>
        </div>
    );
}