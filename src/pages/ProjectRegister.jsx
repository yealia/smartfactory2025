import { useEffect, useState } from "react";
import axios from "axios";
import SearchLayout from "../layouts/SearchLayout";
import SearchTextBox from "../components/search/SearchTextBox";
import SearchDatePicker from "../components/search/SearchDatePicker";
import SearchButton from "../components/search/SearchButton";
import InsertButton from "../components/search/InsertButton";
import SaveButton from "../components/search/SaveButton";
import EditableGrid from "../layouts/EditableGrid"; // 추가

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
            // _key 추가
            const mappedData = sortedData.map((p, i) => ({
                ...p,
                _key: p.projectId || `row_${i}`
            }));
            setProjects(mappedData);
        } catch (error) {
            console.error("프로젝트 데이터를 불러오는 중 오류:", error);
        }
    };

    // --- 추가 버튼 ---
    const handleInsert = () => {
        const newProject = {
            projectId: "",
            projectNm: "",
            customerId: "",
            employeeId: "",
            startDate: "",
            deliveryDate: "",
            priority: 0,
            progressRate: 0,
            totalBudget: 0,
            currencyCode: "KRW",
            actualDeliveryDate: "",
            remark: "",
            createdAt: new Date().toISOString().split("T")[0],
            updatedAt: new Date().toISOString().split("T")[0],
            _key: `new_${projects.length + 1}`,
            isNew: true
        };
        setProjects([...projects, newProject]);
    };

    // --- 셀 편집 처리 ---
    const handleCellChange = (_key, accessor, value) => {
        const updated = projects.map(row => {
            if (row._key === _key) {
                return { ...row, [accessor]: value };
            }
            return row;
        });
        setProjects(updated);
    };

    // --- 저장 ---
    const handleSave = async () => {
        try {
            for (let project of projects) {
                if (project.isNew) {
                    const res = await axios.post(API_BASE, project);
                    project.projectId = res.data.projectId;
                    project.isNew = false;
                } else {
                    await axios.put(`${API_BASE}/${project.projectId}`, project);
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

            {/* EditableGrid 적용 */}
            <EditableGrid
                columns={columns}
                data={projects}
                onChange={handleCellChange}
            />
        </div>
    );
}
