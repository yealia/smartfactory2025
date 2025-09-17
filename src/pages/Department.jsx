import { useEffect, useState } from "react";
import axios from "axios";

import SearchLayout from "../layouts/SearchLayout";
import SearchTextBox from "../components/search/SearchTextBox";
import SearchButton from "../components/search/SearchButton";
import BodyGrid from "../layouts/BodyGrid";

// API 엔드포인트
const API_BASE = "http://localhost:8081/api/departments";

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [searchDeptId, setSearchDeptId] = useState("");
  const [searchDeptNm, setSearchDeptNm] = useState("");

  // ✅ BodyGrid에 표시할 컬럼 정의 (모든 컬럼 포함)
  const columns = [
    { header: "부서 ID", accessor: "departmentId" },
    { header: "부서명", accessor: "departmentNm" },
    { header: "관리자 ID", accessor: "managerId" },
    { header: "위치 ID", accessor: "locationId" },
    { header: "위치명", accessor: "locationNm" },
    { header: "생성일", accessor: "createdAt" },
    { header: "수정일", accessor: "updatedAt" },
  ];

  // ✅ 부서 목록 불러오기
  const loadDepartments = async () => {
    try {
      const { data } = await axios.get(API_BASE, {
        params: {
          departmentId: searchDeptId || undefined,
          departmentNm: searchDeptNm || undefined,
        },
      });
      setDepartments(data);
    } catch (err) {
      console.error("부서 목록 불러오기 실패:", err);
    }
  };

  useEffect(() => {
    loadDepartments(); // 처음 로드 시 전체 목록 조회
  }, []);

  return (
    <div className="p-6">
      <h2 className="font-bold text-2xl mb-4">부서 관리</h2>

      {/* 검색 영역 */}
      <SearchLayout>
        <SearchTextBox
          label="부서 ID"
          type="number"
          value={searchDeptId}
          onChange={(e) => setSearchDeptId(e.target.value)}
        />
        <SearchTextBox
          label="부서명"
          value={searchDeptNm}
          onChange={(e) => setSearchDeptNm(e.target.value)}
        />
        <SearchButton onClick={loadDepartments}>조회</SearchButton>
      </SearchLayout>

      {/* 부서 목록 표시 */}
      <div className="mt-6">
        <BodyGrid
          columns={columns}
          data={departments.map((dept) => ({
            ...dept,
            _key: dept.departmentId, // ✅ Row key 지정
          }))}
        />
      </div>
    </div>
  );
}
