import { useEffect, useState } from "react";
import axios from "axios";
import SearchLayout from "../layouts/SearchLayout";
import SearchTextBox from "../components/search/SearchTextBox";
import SearchButton from "../components/search/SearchButton";
import BodyGrid from "../layouts/BodyGrid";

export default function ProjectRegister() {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get("http://localhost:8081/api/projects");
      setProjects(res.data);
      setFilteredProjects(res.data); // 초기 필터링 없이 전체 데이터
    } catch (error) {
      console.error("프로젝트 데이터를 불러오는 중 오류:", error);
    }
  };

  const columns = [
    { header: "ID", accessor: "projectId" },
    { header: "프로젝트명", accessor: "projectName" },
    { header: "시작일", accessor: "startDate" },
    { header: "종료일", accessor: "endDate" },
    { header: "담당자", accessor: "manager" },
    { header: "상태", accessor: "status" },
    { header: "비고", accessor: "remark" },
  ];

  // 간트 차트 데이터
  const ganttData = [
    [
      { type: "string", label: "Task ID" },
      { type: "string", label: "Task Name" },
      { type: "date", label: "Start Date" },
      { type: "date", label: "End Date" },
      { type: "number", label: "Duration" },
      { type: "number", label: "Percent Complete" },
      { type: "string", label: "Dependencies" },
    ],
    ...filteredProjects.map(p => [
      p.projectId,
      p.projectName,
      new Date(p.startDate),
      new Date(p.endDate),
      null,
      p.status === "완료" ? 100 : 50,
      null,
    ])
  ];

  // 검색 필터 (예시: 프로젝트명 필터링)
//   const handleSearch = () => {
//     const projectName = document.getElementById("search-projectName").value.toLowerCase();
//     const manager = document.getElementById("search-manager").value.toLowerCase();
//     const status = document.getElementById("search-status").value.toLowerCase();

//     const filtered = projects.filter(p => 
//       p.projectName.toLowerCase().includes(projectName) &&
//       p.manager.toLowerCase().includes(manager) &&
//       p.status.toLowerCase().includes(status)
//     );

//     setFilteredProjects(filtered);
//   };

//   const handleReset = () => {
//     document.getElementById("search-projectName").value = "";
//     document.getElementById("search-manager").value = "";
//     document.getElementById("search-status").value = "";
//     setFilteredProjects(projects);
//   };

  return (
    <div className="p-6">
      <h2 className="font-bold text-xl mb-4">프로젝트 관리</h2>

      {/* 검색 영역 */}
      <SearchLayout>
        <SearchTextBox id="search-projectName" label="프로젝트명" />
        <SearchTextBox id="search-manager" label="담당자" />
        <SearchTextBox id="search-status" label="상태" />
        <SearchButton >조회</SearchButton>
        <SearchButton >초기화</SearchButton>
      </SearchLayout>

      {/* 상단 요약 */}
      <div className="grid grid-cols-3 gap-4 my-6">
        <div className="p-4 bg-blue-100 rounded">총 프로젝트: {filteredProjects.length}</div>
        <div className="p-4 bg-green-100 rounded">진행중: {filteredProjects.filter(p => p.status === "진행중").length}</div>
        <div className="p-4 bg-gray-100 rounded">완료: {filteredProjects.filter(p => p.status === "완료").length}</div>
      </div>

      {/* 하단 상세 그리드 */}
      <BodyGrid columns={columns} data={filteredProjects} />

      {/* 간트 차트 */}
      <div className="mt-8">
        <h3 className="font-semibold mb-2">간트 차트</h3>
        {/* <Chart
          chartType="Gantt"
          width="100%"
          height="400px"
          data={ganttData}
          options={{
            gantt: {
              trackHeight: 30,
            },
          }}
        /> */}
      </div>
    </div>
  );
}
