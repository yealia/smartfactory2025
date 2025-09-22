import { useEffect, useState } from "react";
import axios from "axios";

import SearchLayout from "../layouts/SearchLayout";
import SearchTextBox from "../components/search/SearchTextBox";
import SearchButton from "../components/search/SearchButton";
import TreeGrid from "../layouts/TreeGrid";
import { useParams } from "react-router-dom";

const API_BASE = "http://localhost:8081/api/boms";

export default function Bom() {
    const [boms, setBoms] = useState([]);
    const { vesselId: vesselIdParam } = useParams();
    const [searchVesselId, setSearchVesselId] = useState("");
    // ✅ [추가] 사용자 피드백을 위한 메시지 상태
    const [message, setMessage] = useState("");

    const columns = [
        { header: "선박 ID", accessor: "vesselId" },
        { header: "자재 ID", accessor: "materialId" },
        { header: "공정 ID", accessor: "processId" },
        { header: "블록 ID", accessor: "blockId" },
        { header: "소요수량", accessor: "requiredQuantity" },
        { header: "단위", accessor: "unit" },
        { header: "비고", accessor: "remark" },
    ];

    // ✅ [추가] 메시지를 3초간 보여주는 함수
    const showMessage = (msg) => {
        setMessage(msg);
        setTimeout(() => setMessage(""), 3000);
    };

    useEffect(() => {
        if (vesselIdParam) {
            setSearchVesselId(vesselIdParam);
            loadBoms(vesselIdParam);
        } else {
            loadBoms();
        }
    }, [vesselIdParam]);

    const loadBoms = async (vesselId) => {
        try {
            const { data } = await axios.get(API_BASE, {
                params: {
                    vesselId: vesselId || undefined
                }
            });
            setBoms(data);
        } catch (err) {
            console.error("BOM 목록 조회 실패:", err);
            showMessage("BOM 목록 조회 중 오류가 발생했습니다.");
        }
    };

   

    const groupByVessel = (flatData) => {
        const grouped = {};
        flatData.forEach((row) => {
            if (!grouped[row.vesselId]) {
                grouped[row.vesselId] = {
                    _key: `vessel-${row.vesselId}`,
                    vesselId: `${row.vesselId} 선박`,
                    children: []
                };
            }
            grouped[row.vesselId].children.push({
                ...row,
                _key: `bom-${row.bomId}`
            });
        });
        return Object.values(grouped);
    };

    return (
        <div>
            <h2 className="font-bold mb-4">BOM 관리</h2>

            {/* ✅ [추가] 사용자 피드백 메시지 표시 UI */}
            {message && (
                <div className="mb-4 p-3 bg-sky-100 text-sky-800 rounded-lg text-sm text-center shadow">
                    {message}
                </div>
            )}

            <SearchLayout>
                <SearchTextBox
                    label="선박ID"
                    value={searchVesselId || ""}
                    onChange={(e) => setSearchVesselId(e.target.value)}
                />
                <SearchButton onClick={() => loadBoms(searchVesselId)} />
            </SearchLayout>

            <TreeGrid
                columns={columns}
                data={groupByVessel(boms)}
                tree={true}
                onRowClick={(row) => console.log("클릭한 행:", row)}
            />
        </div>
    );
}