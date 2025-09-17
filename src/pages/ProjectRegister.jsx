import { useEffect, useState } from "react";
import axios from "axios";
import SearchLayout from "../layouts/SearchLayout";
import SearchTextBox from "../components/search/SearchTextBox";
import SearchDatePicker from "../components/search/SearchDatePicker";
import SearchButton from "../components/search/SearchButton";
import BodyGrid from "../layouts/BodyGrid";
import InsertButton from "../components/search/InsertButton";
import SaveButton from "../components/search/SaveButton";

// Spring Boot 컨트롤러에 설정된 API 주소
const API_BASE = "http://localhost:8081/api/projects";

export default function ProjectRegister() {
    // 그리드에 표시될 데이터 State
    const [projects, setProjects] = useState([]);
    
    // 검색 조건 State
    const [searchProjectId, setSearchProjectId] = useState("");
    const [searchProjectNm, setSearchProjectNm] = useState("");
    const [searchCustomerId, setSearchCustomerId] = useState("");
    const [searchStartDate, setSearchStartDate] = useState("");
    const [searchDeliveryDate, setSearchDeliveryDate] = useState("");

    // 컴포넌트가 처음 로드될 때 전체 데이터를 불러옵니다.
    useEffect(() => {
        handleSearch();
    }, []);

    // 검색 버튼 클릭 또는 첫 로드 시 실행될 함수
    const handleSearch = async () => {
        try {
            const res = await axios.get(API_BASE, {
                params: {
                    projectId: searchProjectId || undefined,
                    projectNm: searchProjectNm || undefined,
                    customerId: searchCustomerId || undefined,
                    startDate: searchStartDate || undefined,
                    deliveryDate: searchDeliveryDate || undefined,
                }
            });
            
            const sortedData = res.data.sort((a, b) => a.priority - b.priority);
            setProjects(sortedData);

        } catch (error) {
            console.error("프로젝트 데이터를 불러오는 중 오류:", error);
        }
    };

    // BodyGrid에 표시될 컬럼 정의 (생성일/수정일 추가)
    const columns = [
        { header: "프로젝트 ID", accessor: "projectId" },
        { header: "프로젝트명", accessor: "projectNm" },
        { header: "고객 ID", accessor: "customerId" },
        { header: "담당자 ID", accessor: "employeeId" },
        { header: "시작일", accessor: "startDate" },
        { header: "납기일", accessor: "deliveryDate" },
        { header: "우선순위", accessor: "priority" },
        { header: "진행률(%)", accessor: "progressRate" },
        { header: "총 예산", accessor: "totalBudget" },
        { header: "통화", accessor: "currencyCode" },
        { header: "실제납기일", accessor: "actualDeliveryDate" },
        { header: "비고", accessor: "remark" },
        { header: "생성일", accessor: "createdAt" },
        { header: "수정일", accessor: "updatedAt" },
    ];

    return (
        <div className="w-screen p-6 space-y-4">
            <h2 className="font-bold text-xl">프로젝트 관리</h2>

            {/* 검색 영역 */}
            <SearchLayout>
                <SearchTextBox label="프로젝트 ID" value={searchProjectId} onChange={(e) => setSearchProjectId(e.target.value)} />
                <SearchTextBox label="프로젝트명" value={searchProjectNm} onChange={(e) => setSearchProjectNm(e.target.value)} />
                <SearchTextBox label="고객 ID" value={searchCustomerId} onChange={(e) => setSearchCustomerId(e.target.value)} />
                <SearchDatePicker label="시작일" value={searchStartDate} onChange={(e) => setSearchStartDate(e.target.value)} />
                <SearchDatePicker label="납기일" value={searchDeliveryDate} onChange={(e) => setSearchDeliveryDate(e.target.value)} />
                <SearchButton onClick={handleSearch}>조회</SearchButton>
                <InsertButton />
                <SaveButton />
            </SearchLayout>

            <BodyGrid 
                columns={columns} 
                data={projects.map(p => ({
                    ...p, 
                    _key: p.projectId,
                    // DB에서 가져오는 필드 이름이 다를 경우 매핑 필요
                    createdAt: p.createdAt || p.created_at,
                    updatedAt: p.updatedAt || p.updated_at
                }))} 
            />
        </div>
    );
}
