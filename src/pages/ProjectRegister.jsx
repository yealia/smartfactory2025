import { useEffect, useState } from "react";
import axios from "axios";
import SearchLayout from "../layouts/SearchLayout";
import SearchTextBox from "../components/search/SearchTextBox";
import SearchDatePicker from "../components/search/SearchDatePicker";
import SearchButton from "../components/search/SearchButton";
import InsertButton from "../components/search/InsertButton";
import SaveButton from "../components/search/SaveButton";
import EditableGrid from "../layouts/EditableGrid";

const API_BASE = "http://localhost:8081/api/projects";

export default function ProjectRegister() {
    const [projects, setProjects] = useState([]);
    const [searchProjectId, setSearchProjectId] = useState("");
    const [searchProjectNm, setSearchProjectNm] = useState("");
    const [searchCustomerId, setSearchCustomerId] = useState("");
    const [searchStartDate, setSearchStartDate] = useState("");
    const [searchDeliveryDate, setSearchDeliveryDate] = useState("");

    // --- 삭제 버튼 핸들러 ---
    const handleDelete = async (projectId) => {
        if (!window.confirm(`프로젝트 ID: ${projectId}를 삭제하시겠습니까?`)) {
            return;
        }

        try {
            await axios.delete(`${API_BASE}/${projectId}`);
            alert("삭제가 완료되었습니다.");
            handleSearch(); // 삭제 후 목록 새로고침
        } catch (error) {
            console.error("프로젝트 삭제 중 오류:", error);
            alert("삭제에 실패했습니다. 관리자에게 문의하세요.");
        }
    };

    // --- 수정 버튼 핸들러 ---
    const handleUpdate = async (projectToUpdate) => {
        if (!projectToUpdate || !projectToUpdate.projectId) {
            alert("수정할 프로젝트 정보가 올바르지 않습니다.");
            return;
        }
        try {
            // isNew, _key 같은 프론트엔드 전용 속성 제거
            const payload = { ...projectToUpdate };
            delete payload.isNew;
            delete payload._key;
            
            await axios.put(`${API_BASE}/${payload.projectId}`, payload);
            alert("프로젝트가 성공적으로 수정되었습니다.");
            handleSearch(); // 수정 후 목록 새로고침
        } catch (error) {
            console.error("프로젝트 수정 중 오류:", error);
            alert("수정에 실패했습니다. 관리자에게 문의하세요.");
        }
    };


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
        {
            header: "작업",
            accessor: "actions",
            isEditable: false,
            render: (row) => (
                // 새 행이 아닐 경우에만 수정/삭제 버튼 표시
                !row.isNew && (
                    <div className="flex gap-x-2 justify-center">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation(); // 행 클릭 이벤트 전파 방지
                                handleUpdate(row);
                            }} 
                            className="text-blue-500 font-bold hover:text-blue-700"
                        >
                            수정
                        </button>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation(); // 행 클릭 이벤트 전파 방지
                                handleDelete(row.projectId);
                            }} 
                            className="text-red-500 font-bold hover:text-red-700"
                        >
                            삭제
                        </button>
                    </div>
                )
            )
        },
    ];

    // --- 데이터 불러오기 ---
    useEffect(() => {
        handleSearch();
    }, []);

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
            setProjects(sortedData.map((p, i) => ({ ...p, _key: p.projectId || `row_${i}` })));
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
            createdAt: null, // 생성 시에는 null
            updatedAt: null, // 생성 시에는 null
            _key: `new_${Date.now()}`, // 중복 방지를 위해 Date.now() 사용
            isNew: true
        };
        setProjects(prevProjects => [newProject, ...prevProjects]); // 새 행을 맨 위에 추가
    };

    // --- 셀 편집 처리 ---
    const handleCellChange = (_key, accessor, value) => {
        setProjects(prev =>
            prev.map(row => (row._key === _key ? { ...row, [accessor]: value } : row))
        );
    };

    // --- 저장 버튼 (신규 항목 일괄 저장) ---
    const handleSave = async () => {
        const newProjects = projects.filter(p => p.isNew);
        if(newProjects.length === 0) {
            alert("저장할 신규 프로젝트가 없습니다.");
            return;
        }

        try {
            // 신규 항목들만 saveAll 엔드포인트로 전송 (가정)
            // 만약 백엔드에 saveAll이 없다면, for문으로 하나씩 post
            const promises = newProjects.map(project => {
                const payload = { ...project };
                delete payload.isNew;
                delete payload._key;
                return axios.post(API_BASE, payload);
            });
            
            await Promise.all(promises);
            
            alert("저장이 완료되었습니다.");
            handleSearch(); // 전체 목록 새로고침
        } catch (error) {
            console.error("프로젝트 저장 중 오류:", error);
            alert("저장에 실패했습니다. 관리자에게 문의하세요.");
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

            <EditableGrid
                columns={columns}
                data={projects}
                onChange={handleCellChange}
            />
        </div>
    );
}