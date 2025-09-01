import SearchLayout from "../layouts/SearchLayout"
import SearchTextBox from "../components/search/SearchTextBox"
import SearchButton from "../components/search/SearchButton"
import BodyGrid from "../layouts/BodyGrid"
import axios from "axios"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import InsertButton from "../components/search/InsertButton"
import SaveButton from "../components/search/SaveButton"
import ButtonLayout from "../components/search/ButtonLayout"

const API_BASE = "http://localhost:8081/api/vessels";


export default function Vessels() {
    const [vessels, setVessels] = useState([]);
    const navigate = useNavigate();

    // 테이블 컬럼 정의
    const columns = [
        //{ header: "BOM ID", accessor: "bomId" },
        { header: "선박 ID", accessor: "vesselId" },
        { header: "선박명", accessor: "vesselNm" },
        { header: "선박유형", accessor: "vesselType" },
        { header: "길이", accessor: "vesselLength" },
        { header: "폭", accessor: "vesselBeam" },
        { header: "적재능력", accessor: "cargoCapacity" },
        { header: "엔진스펙", accessor: "engineSpec" },
        { header: "총중량", accessor: "totalWeight" },
    ];
    //전체 조회
    useEffect(() => {
        loadVessel();
    }, [])
    // 전체 BOM 목록 불러오기
    const loadVessel = async () => {
        try {
            const { data } = await axios.get(API_BASE, {
                params: {
                }
            });
            setVessels(data); //상태에 저장
            console.log(data);
            console.log(data[0].vesselId);
        } catch (err) {
            console.log("공급업체 목록 조회 실패", err);
        }
    };
    //행 클릭시 
    const handleRowClick = (row) => {
        console.log(row.vesselId);
        console.log(`/boms/${row.vesselId}`);
        //navigate(`/boms/${row.vesselId}`);
        navigate(`/boms/${row.vesselId}`);

    }
    return (
        <div>
            <h2 className="font-bold mb-4">선박 관리</h2>
            <SearchLayout>
                {/*<SearchTextBox label="조회" />*/}
                <ButtonLayout />
                <SaveButton />

            </SearchLayout>
            <BodyGrid
                columns={columns}
                data={vessels.map((vessels) => ({
                    ...vessels,
                    _key: vessels.vesselId   // PK를 key 대용으로 추가
                }))}
                readOnly={false}
                onRowClick={handleRowClick}
            />

        </div>
    )
}