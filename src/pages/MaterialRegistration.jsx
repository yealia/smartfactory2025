import React, { useEffect, useState } from "react";
import axios from "axios";
import SearchLayout from "../layouts/SearchLayout"
import SearchTextBox from "../components/search/SearchTextBox"
import SearchButton from "../components/search/SearchButton"
import BodyGrid from "../layouts/BodyGrid";

export default function MaterialRegistration() {
  const [materials, setMaterials] = useState([]);
  // 자재 목록 불러오기
  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    const res = await axios.get("http://localhost:8081/api/materials");
    setMaterials(res.data);
  };

 //컬럼정의 
  const columns = [
    { header: "ID", accessor: "materialId" },
    { header: "자재명", accessor: "materialNm" },
    { header: "카테고리", accessor: "category" },
    { header: "단위", accessor: "unit" },
    { header: "기준 단가", accessor: "unitPrice" },
    { header: "비고", accessor: "remark" },
  ];
  

  return (
    <div className="">
      <h2 className="font-bold mb-4">자재 관리</h2>
      {/* 등록 폼 */}
      <SearchLayout>
        <SearchTextBox label="조건1"/>
        <SearchTextBox label="조건2"/>
        <SearchTextBox label="조건3"/>
        <SearchTextBox label="조건4"/>
        <SearchTextBox label="조건5"/>
        <SearchTextBox label="조건6"/>
        <SearchTextBox label="조건6"/>
        
        
        <div class="relative max-w-sm">
          <div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
            <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z"/>
              </svg>
          </div>
        </div>

        <SearchButton>조회</SearchButton>
        <SearchButton>초기화</SearchButton>

      </SearchLayout>  
      

      {/* 자재 목록 */}
        <BodyGrid columns={columns} data={materials}/>
    </div>
  );
}