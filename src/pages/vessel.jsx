import SearchLayout from "../layouts/SearchLayout";
import SearchTextBox from "../components/search/SearchTextBox";
import SearchButton from "../components/search/SearchButton";
import BodyGrid from "../layouts/BodyGrid";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:8081/api/vessels";

export default function Vessels() {
    const [vessels, setVessels] = useState([]);
    const navigate = useNavigate();

    // ✅ [추가] 검색 조건 상태 변수
    const [searchVesselId, setSearchVesselId] = useState("");
    const [searchVesselNm, setSearchVesselNm] = useState("");

    // ✅ [수정] 테이블 컬럼 정의 (Entity에 맞게 전체 컬럼 추가)
    const columns = [
        { header: "선박 ID", accessor: "vesselId" },
        { header: "선박명", accessor: "vesselNm" },
        { header: "선박유형", accessor: "vesselType" },
        { header: "상태", accessor: "status" },
        { header: "길이(m)", accessor: "vesselLength" },
        { header: "폭(m)", accessor: "vesselBeam" },
        { header: "깊이(m)", accessor: "vesselDepth" },
        { header: "적재능력", accessor: "cargoCapacity" },
        { header: "엔진스펙", accessor: "engineSpec" },
        { header: "총중량", accessor: "totalWeight" },
        { header: "실제납기일", accessor: "actualDeliveryDate" },
        { header: "프로젝트 ID", accessor: "projectId" },
        { header: "비고", accessor: "remark" },
    ];
    
    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        loadVessels();
    }, []);

    // ✅ [수정] 조회 함수 - 검색 조건 파라미터 추가
    const loadVessels = async () => {
        try {
            const { data } = await axios.get(API_BASE, {
                params: {
                    vesselId: searchVesselId || undefined,
                    vesselNm: searchVesselNm || undefined,
                }
            });
            setVessels(data); // 상태에 저장
        } catch (err) {
            console.error("선박 목록 조회 실패:", err);
        }
    };

    // 행 클릭 시 BOM 상세 페이지로 이동
    const handleRowClick = (row) => {
        if (row && row.vesselId) {
            navigate(`/boms/${row.vesselId}`);
        }
    };

    return (
        <div className="p-6">
            <h2 className="font-bold text-xl mb-4">선박 관리</h2>
            
            {/* ✅ [수정] 검색 UI */}
            <SearchLayout>
                <SearchTextBox
                    label="선박 ID"
                    value={searchVesselId}
                    onChange={(e) => setSearchVesselId(e.target.value)}
                />
                <SearchTextBox
                    label="선박명"
                    value={searchVesselNm}
                    onChange={(e) => setSearchVesselNm(e.target.value)}
                />
                <SearchButton onClick={loadVessels}>조회</SearchButton>
            </SearchLayout>

            {/* 그리드 */}
            <div className="mt-6">
                 <BodyGrid
                    columns={columns}
                    data={vessels.map((vessel) => ({
                        ...vessel,
                        _key: vessel.vesselId // PK를 key 대용으로 추가
                    }))}
                    onRowClick={handleRowClick}
                />
            </div>
        </div>
    );
}