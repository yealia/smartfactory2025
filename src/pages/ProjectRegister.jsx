import React, { useState, useEffect, useCallback } from "react"; // ✨ useCallback 추가
import axios from "axios";

import SearchLayout from "../layouts/SearchLayout";
import SearchTextBox from "../components/search/SearchTextBox";
import SearchDatePicker from "../components/search/SearchDatePicker";
import SearchButton from "../components/search/SearchButton";
import InsertButton from "../components/search/InsertButton";
import BodyGrid from "../layouts/BodyGrid"; // ✨ EditableGrid 대신 BodyGrid 사용

const API_BASE = "http://localhost:8081/api/projects";

export default function ProjectRegister() {
    const [projects, setProjects] = useState([]);

    const [searchProjectId, setSearchProjectId] = useState("");
    const [searchProjectNm, setSearchProjectNm] = useState("");
    const [searchCustomerId, setSearchCustomerId] = useState("");
    const [searchStartDate, setSearchStartDate] = useState("");
    const [searchDeliveryDate, setSearchDeliveryDate] = useState("");

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

  // --- 데이터 조회 ---
  const loadProjects = useCallback(async () => {
    try {
      // ✨ searchParams 객체를 사용하여 파라미터 구성
      const params = {
        projectId: searchParams.projectId || undefined,
        projectNm: searchParams.projectNm || undefined,
        customerId: searchParams.customerId || undefined,
        startDate: searchParams.startDate || undefined,
        deliveryDate: searchParams.deliveryDate || undefined,
      };
      const response = await axios.get(API_BASE, { params });
      // ✨ 서버에서 받은 데이터를 그대로 상태에 저장
      setProjects(response.data);
    } catch (err) {
      console.error("프로젝트 목록 조회 실패:", err);
      alert(`데이터 조회 중 오류 발생: ${err.message}`);
    }
  }, [searchParams]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]); // ✨ 의존성 배열에 loadProjects 추가

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

            const mappedData = sortedData.map((p, i) => ({
                ...p,
                _key: p.projectId || `row_${i}`,
            }));

            setProjects(mappedData);
        } catch (error) {
            console.error("프로젝트 데이터를 불러오는 중 오류:", error);
        }
    };

    // --- 추가 버튼 ---
    const handleInsert = () => {
        const today = new Date().toISOString().split("T")[0];
        const newProject = {
            projectId: "",
            projectNm: "",
            customerId: "",
            employeeId: "",
            startDate: today,
            deliveryDate: today,
            priority: 0,
            progressRate: 0,
            totalBudget: 0,
            currencyCode: "KRW",
            actualDeliveryDate: today,
            remark: "",
            createdAt: today + " 00:00:00",
            updatedAt: today + " 00:00:00",
            _key: `new_${projects.length + 1}`,
            isNew: true
        };
        setProjects([...projects, newProject]);
    };

    // --- 셀 편집 처리 ---
    const handleCellChange = (_key, accessor, value) => {
        setProjects(prev =>
            prev.map(row => (row._key === _key ? { ...row, [accessor]: value } : row))
        );
    };

    // --- 저장 ---
    const handleSave = async () => {
        try {
            for (let project of projects) {
                const payload = {
                    ...project,
                    startDate: project.startDate || null,
                    deliveryDate: project.deliveryDate || null,
                    actualDeliveryDate: project.actualDeliveryDate || null,
                };

                if (project.isNew) {
                    const res = await axios.post(API_BASE, payload);
                    project.projectId = res.data.projectId;
                    project.isNew = false;
                } else {
                    await axios.put(`${API_BASE}/${project.projectId}`, payload);
                }
            }
            alert("저장이 완료되었습니다.");
            handleSearch();
        } catch (error) {
            console.error("프로젝트 저장 중 오류:", error);
        }
    };

    return (
        <div className="w-screen p-6 space-y-4">
            <h2 className="font-bold text-xl">프로젝트 관리</h2>

            <SearchLayout>
                <SearchTextBox label="프로젝트 ID" value={searchProjectId} onChange={(e) => setSearchProjectId(e.target.value)} />
                <SearchTextBox label="프로젝트명" value={searchProjectNm} onChange={(e) => setSearchProjectNm(e.target.value)} />
                <SearchTextBox label="고객 ID" value={searchCustomerId} onChange={(e) => setSearchCustomerId(e.target.value)} />
                <SearchDatePicker label="시작일" value={searchStartDate} onChange={(e) => setSearchStartDate(e.target.value)} />
                <SearchDatePicker label="납기일" value={searchDeliveryDate} onChange={(e) => setSearchDeliveryDate(e.target.value)} />
                <SearchButton onClick={handleSearch}>조회</SearchButton>
                <InsertButton onClick={handleInsert} />
                <SaveButton onClick={handleSave} />
            </SearchLayout>

      <div className="mt-6">
        {/* ✨ EditableGrid를 BodyGrid로 변경하고 onRowClick 이벤트 핸들러 연결 */}
        <BodyGrid
          columns={columns}
          data={projects}
          onRowClick={openEditModal}
        />
      </div>

      {/* ✨ 모달 UI 추가 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-xl w-1/2 max-h-screen overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{editingProject.isNew ? "신규 프로젝트 등록" : "프로젝트 수정"}</h3>
            <div className="grid grid-cols-2 gap-4">
              {columns.map(col => (
                !col.readOnly && (
                  <div key={col.accessor}>
                    <label className="block text-sm font-medium text-gray-700">{col.header}</label>
                    <input
                      type={col.type || "text"}
                      name={col.accessor}
                      value={editingProject[col.accessor] || ''}
                      onChange={handleModalInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>
                )
              ))}
            </div>
            <div className="mt-6 flex justify-between">
              <div>
                {!editingProject.isNew && (
                  <button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                    삭제
                  </button>
                )}
              </div>
              <div>
                <button onClick={closeModalAndRefresh} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded mr-2">
                  취소
                </button>
                <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}