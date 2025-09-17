import { useState, useEffect } from "react";
import BodyGrid from "../layouts/BodyGrid";
import SearchLayout from "../layouts/SearchLayout";
import SearchButton from "../components/search/SearchButton";
import axios from "axios";
import SearchTextBox from "../components/search/SearchTextBox"; // ✅ SearchTextBox import 추가

export default function InventoryMovement() {
    const [movements, setMovements] = useState([]);
    
    // ✅ [추가] 검색 조건 state
    const [searchMovementId, setSearchMovementId] = useState("");
    const [searchMaterialId, setSearchMaterialId] = useState("");

    // ✅ [수정] API 경로를 movements로 변경
    const API_BASE = "http://localhost:8081/api/movements"; 

    // 테이블 컬럼 정의 (기존과 동일)
    const columns = [
        { header: "이력ID", accessor: "movementId" },
        { header: "발생일시", accessor: "occurredAt" },
        { header: "이력유형", accessor: "movementType" },
        { header: "자재ID", accessor: "materialId" },
        { header: "수량", accessor: "qty" },
        { header: "출고창고", accessor: "warehouseFrom" },
        { header: "입고창고", accessor: "warehouseTo" },
        { header: "출고위치", accessor: "locationFrom" },
        { header: "입고위치", accessor: "locationTo" },
        { header: "출처유형", accessor: "sourceType" },
        { header: "발주ID", accessor: "purchaseOrderId" },
        { header: "상세ID", accessor: "orderDetailId" },
        { header: "검사ID", accessor: "qcId" },
        { header: "처리자", accessor: "userId" },
        { header: "비고", accessor: "remark" },
        { header: "멱등키", accessor: "idempotencyKey" },
    ];

    // 첫 로딩 시 전체 조회
    useEffect(() => {
        loadMovement();
    }, []);

    // ✅ [수정] 조회 함수 - 검색 조건 파라미터 추가
    const loadMovement = async () => {
        try {
            const { data } = await axios.get(API_BASE, {
                params: {
                    movementId: searchMovementId || undefined,
                    materialId: searchMaterialId || undefined,
                }
            });
            setMovements(data); // 상태에 저장
        } catch (err) {
            console.error("재고 원장 조회 실패:", err);
        }
    };

    const onRowClick = () => {};
    const onCellChange = () => {};

    return (
        <div className="p-6">
            <h2 className="font-bold text-xl mb-4">재고 원장 관리</h2>
            
            {/* ✅ [수정] 검색 UI */}
            <SearchLayout>
                <SearchTextBox
                    label="이력 ID"
                    value={searchMovementId}
                    onChange={(e) => setSearchMovementId(e.target.value)}
                    type="number"
                />
                <SearchTextBox
                    label="자재 ID"
                    value={searchMaterialId}
                    onChange={(e) => setSearchMaterialId(e.target.value)}
                    type="number"
                />
                <SearchButton onClick={loadMovement}>조회</SearchButton>
            </SearchLayout>

            {/* 그리드 */}
            <div className="mt-6">
                <BodyGrid
                    columns={columns}
                    data={movements.map((movement) => ({
                        ...movement,
                        _key: movement.movementId 
                    }))}
                    readOnly={true}
                    onRowClick={onRowClick}
                    onCellChange={onCellChange}
                />
            </div>
        </div>
    );
}