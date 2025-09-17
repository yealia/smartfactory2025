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
const API_BASE = "http://localhost:8081/api/project_plans";

export default function ProjectPlan() {
  const [plans, setPlans] = useState([]);
  const [searchProjectId, setSearchProjectId] = useState("");
  const [searchVesselId, setSearchVesselId] = useState("");
  const [searchStartDate, setSearchStartDate] = useState("");
  const [searchEndDate, setSearchEndDate] = useState("");
  const [searchStatus, setSearchStatus] = useState("");

  // BodyGrid에 표시될 컬럼 정의 (생성일/수정일 추가)
  const columns = [
    { header: "계획 ID", accessor: "planId" },
    { header: "프로젝트 ID", accessor: "projectId" },
    { header: "선박 ID", accessor: "vesselId" },
    { header: "계획 범위", accessor: "planScope" },
    { header: "시작일", accessor: "startDate" },
    { header: "종료일", accessor: "endDate" },
    { header: "진행률(%)", accessor: "progressRate" },
    { header: "상태", accessor: "status" },
    { header: "비고", accessor: "remark" },
    { header: "생성일", accessor: "createdAt" }, 
    { header: "수정일", accessor: "updatedAt" }, 
  ];

  const getStatusText = (status) => {
    switch (status) {
      case 0: return "계획";
      case 1: return "진행";
      case 2: return "완료";
      default: return "알 수 없음";
    }
  };

  const toDateString = (value) => {
    if (!value) return "";
    if (value?.target && typeof value.target.value === "string") {
      return toDateString(value.target.value);
    }
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }
    if (typeof value === "string") {
      if (value.includes("T")) return value.slice(0, 10);
      return value;
    }
    return "";
  };

  const handleStartDateChange = (value) => setSearchStartDate(toDateString(value));
  const handleEndDateChange = (value) => setSearchEndDate(toDateString(value));

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const params = {
        projectId: searchProjectId || undefined,
        vesselId: searchVesselId || undefined,
        startDate: searchStartDate || undefined,
        endDate: searchEndDate || undefined,
        status: searchStatus || undefined,
      };
      
      console.log("Sending search params:", params);
      const { data } = await axios.get(API_BASE, { params });
      setPlans(data);
    } catch (err) {
      console.error("생산계획 목록 조회 실패:", err);
    }
  };

  const handleRowClick = (row) => {
    console.log("선택된 계획:", row);
  };

  return (
    <div>
      <h2 className="font-bold text-2xl mb-4">생산 계획 관리</h2>

      <SearchLayout>
        <SearchTextBox label="프로젝트 ID" value={searchProjectId} onChange={(e) => setSearchProjectId(e.target.value)} />
        <SearchTextBox label="선박 ID" value={searchVesselId} onChange={(e) => setSearchVesselId(e.target.value)} />
        <SearchDatePicker label="시작일" value={searchStartDate} onChange={handleStartDateChange} />
        <SearchDatePicker label="종료일" value={searchEndDate} onChange={handleEndDateChange} />
        <SearchTextBox label="상태 (0:계획, 1:진행, 2:완료)" value={searchStatus} onChange={(e) => setSearchStatus(e.target.value)} />
        <SearchButton onClick={loadPlans} />
        <InsertButton />
        <SaveButton />
      </SearchLayout>
      
      <div className="mt-6">
        <BodyGrid
          columns={columns}
          data={plans.map((plan) => ({
            ...plan,
            status: getStatusText(plan.status),
            _key: plan.planId,
            // DB에서 가져오는 필드 이름이 snake_case일 경우 매핑
            createdAt: plan.createdAt || plan.created_at,
            updatedAt: plan.updatedAt || plan.updated_at
          }))}
          onRowClick={handleRowClick}
        />
      </div>
    </div>
  );
}
