import { useEffect, useState } from "react";
import axios from "axios";
import BodyGrid from "../layouts/BodyGrid";
import SearchLayout from "../layouts/SearchLayout";
import SearchButton from "../components/search/SearchButton";

export default function InventoryPage() {
    const [inventories, setInventories] = useState([]);
    const [materialId, setMaterialId] = useState("");
    const [location, setLocation] = useState("");
    const [err, setErr] = useState("");

    // ERP 백엔드 재고 API
    const API_BASE = "http://localhost:8081/api/inventory";

    // 테이블 컬럼 정의 (Inventory 스키마 기준)
    const columns = [
        { header: "재고ID", accessor: "inventoryId" },
        { header: "자재ID", accessor: "materialId" },
        { header: "창고/위치", accessor: "location" },
        { header: "현재고", accessor: "onHand" },
        { header: "예약수량", accessor: "reservedQty" },
        { header: "안전재고", accessor: "safetyStock" },
        { header: "재주문점", accessor: "reorderPoint" },
        { header: "수정일", accessor: "updatedAt" },
        { header: "생성일", accessor: "createdAt" },
        { header: "버전", accessor: "version" },
    ];

    //전체 조회
    useEffect(() => {
        loadInventory();
    }, [])
    // 전체/검색 조회
    const loadInventory = async () => {
        setErr("");
        try {
            const params = {};
            if (materialId) params.materialId = materialId;
            if (location) params.location = location;

            const { data } = await axios.get(API_BASE, { params });

            // 날짜 포맷이 필요하면 여기서 가볍게 문자열 변환
            const list = (data || []).map((row, idx) => ({
                _key: row.inventoryId || idx, // BodyGrid key 안정화
                ...row,
            }));

            setInventories(list);
        } catch (e) {
            console.error("재고 조회 실패", e);
            setErr("재고 목록 조회에 실패했습니다.");
        }
    };

    const resetFilters = () => {
        setMaterialId("");
        setLocation("");
    };

    const onRowClick = (row) => {
        console.log("row clicked:", row);
    };

    const onCellChange = () => {
        // readOnly=true라면 비워두기
    };

    return (
        <div className="w-screen h-screen p-4 bg-gray-50 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">재고</h2>

                <SearchLayout>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="자재ID"
                            value={materialId}
                            onChange={(e) => setMaterialId(e.target.value)}
                            className="border rounded-md px-2 py-1"
                        />
                        <input
                            type="text"
                            placeholder="창고/위치"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="border rounded-md px-2 py-1"
                        />
                        <SearchButton onClick={loadInventory} />
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="border rounded-md px-3 py-1 bg-white hover:bg-gray-50"
                        >
                            초기화
                        </button>
                    </div>
                </SearchLayout>
            </div>

            {err && (
                <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-red-700">
                    {err}
                </div>
            )}

            <BodyGrid
                columns={columns}
                data={inventories}
                readOnly={true}
                tree={false}
                onRowClick={onRowClick}
                onCellChange={onCellChange}
            />
        </div>
    );
}
