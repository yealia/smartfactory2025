
import { useEffect, useState } from "react";
import axios from "axios";

import SearchLayout from "../layouts/SearchLayout";
import SearchTextBox from "../components/search/SearchTextBox";
import SearchDatePicker from "../components/search/SearchDatePicker";
import SearchButton from "../components/search/SearchButton";
import InsertButton from "../components/search/InsertButton";
import SaveButton from "../components/search/SaveButton";
import BodyGrid from "../layouts/BodyGrid";

const API_BASE = "http://localhost:8081/api/boms";

export default function Bom() {
    //전체 Bom데이터
    const [boms, setBoms] = useState([]);

    // 테이블 컬럼 정의
    const columns = [
        //{ header: "BOM ID", accessor: "bomId" },
        { header: "선박 ID", accessor: "vesselId" },
        { header: "자재 ID", accessor: "materialId" },
        { header: "소요수량", accessor: "requiredQuantity" },
        { header: "단위", accessor: "unit" },
        { header: "공정ID", accessor: "processId" },
        { header: "비고", accessor: "remark" },
    ];
    // 전체 조회 실행 
    useEffect(() => {
        loadBoms();
        console.log("전체 조회");
    }, []);
    // 전체 BOM 목록 불러오기
    const loadBoms = async () => {
        try {
            const { data } = await axios.get(API_BASE, {
                params: {
                }
            }); //조회->Get방식, api/boms
            setBoms(data); //상태에 저장
        } catch (err) {
            console.log("공급업체 목록 조회 실패", err);
        }
    };
    //같은 vessel_id 기준으로 Bom 데이터 묶어주는 함수  
    const groupByVessel = (flatData) => {
        //vesselId별로 데이터 모은는 객체 선언
        const grouped = {};
        //flatData에 있는 데이터 꺼내서 반복
        flatData.forEach((row) => {

            if (!grouped[row.vesselId]) {
                grouped[row.vesselId] = {
                    _key: `vessel-${row.vesselId}`, //vesselId를 고유 키로 사용
                    vesselId: `${row.vesselId} 선박`, //상위그룹
                    children: [] //선박에 속하는 BOM 담을 예정
                };
            }
            //vesselId 그룹의 children 배열에 row를 추가
            grouped[row.vesselId].children.push({
                ...row, //row 안의 모든 데이터 복사
                _key: `bom-${row.bomId}`
            });
        });
        return Object.values(grouped);
    };

    return (
        <div>
            <h2 className="font-bold mb-4">BOM 관리</h2>
            <SearchLayout>
                <SearchTextBox label="선박ID" />
                {/*<SearchDatePicker /> */}
                <SearchButton onClick={loadBoms} />
            </SearchLayout>
            <BodyGrid columns={columns}
                data={groupByVessel(boms)}
                tree={true}
                readOnly={true} />
        </div>

    );
}