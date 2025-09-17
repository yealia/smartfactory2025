import { useEffect, useState } from "react";
import axios from "axios";

import SearchLayout from "../layouts/SearchLayout";
import SearchTextBox from "../components/search/SearchTextBox";
import BodyGrid from "../layouts/BodyGrid";
import SearchButton from "../components/search/SearchButton";

const API_BASE = "http://localhost:8081/api";

export default function Employee() {
  // --- 상태(State) 관리 ---
  const [employees, setEmployees] = useState([]);
  const [searchDeptNm, setSearchDeptNm] = useState("");
  const [searchEmpNm, setSearchEmpNm] = useState("");
  
  // ✅ [삭제] selectedEmployee state 제거
  // const [selectedEmployee, setSelectedEmployee] = useState(null);

  // --- 데이터 로딩 ---
  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const response = await axios.get(`${API_BASE}/employees`, {
        params: {
          departmentNm: searchDeptNm || undefined,
          employeeNm: searchEmpNm || undefined,
        },
      });
      setEmployees(response.data);
      // ✅ [삭제] 데이터 로딩 후 기본 선택 로직 제거
    } catch (error) {
      console.error("사원 목록 조회 실패:", error);
    }
  };

  // --- 렌더링을 위한 설정 ---
  const columns = [
    { header: "사원 ID", accessor: "employeeId" },
    { header: "사원명", accessor: "employeeNm" },
    { header: "부서명", accessor: "departmentNm" },
    { header: "직책명", accessor: "positionNm" },
    { header: "입사일", accessor: "hireDate" },
    { header: "연락처", accessor: "phone" },
    { header: "이메일", accessor: "email" },
    { header: "상태", accessor: "employeeStatus" },
    { header: "생성일", accessor: "createdAt" },
    { header: "수정일", accessor: "updatedAt" },
  ];

  return (
    <div className="p-6">
      <h2 className="font-bold text-xl mb-4">사원 관리</h2>
      <SearchLayout>
        <SearchTextBox
          label="부서명"
          value={searchDeptNm}
          onChange={(e) => setSearchDeptNm(e.target.value)}
        />
        <SearchTextBox
          label="사원명"
          value={searchEmpNm}
          onChange={(e) => setSearchEmpNm(e.target.value)}
        />
        <SearchButton onClick={loadEmployees}>조회</SearchButton>
      </SearchLayout>

      {/* ✅ [수정] 그리드 컨테이너를 full width로 변경하고 상세 정보 영역 삭제 */}
      <div className="mt-6">
        <BodyGrid
          columns={columns}
          data={employees.map((e) => ({ ...e, _key: e.employeeId }))}
          // ✅ [삭제] onRowClick, selectedId 속성 제거
        />
      </div>
    </div>
  );
}