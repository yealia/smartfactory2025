import { useEffect, useState } from "react";
import axios from "axios";
import SearchLayout from "../layouts/SearchLayout";
import SearchTextBox from "../components/search/SearchTextBox";
import BodyGrid from "../layouts/BodyGrid";
import SearchButton from "../components/search/SearchButton";
import InsertButton from "../components/search/InsertButton";
import SaveButton from "../components/search/SaveButton";

const API_BASE = "http://localhost:8081/api/departments";
const detailLabel = "block text-sm font-medium text-gray-700 mb-1";
const detailTextBox = "w-full rounded-lg border border-sky-500 shadow-sm px-4 py-2";

export default function Department() {
    const [departments, setDepartments] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [tempIdCounter, setTempIdCounter] = useState(0); // 임시 ID 카운터
    const [searchParams, setSearchParams] = useState({ departmentNm: "", locationNm: "" });

    const gridColumns = [
        { header: "부서ID", accessor: "departmentId" },
        { header: "부서명", accessor: "departmentNm" },
        { header: "위치명", accessor: "locationNm" },
    ];
    const detailColumns = [
        { header: "부서 ID", accessor: "departmentId", isPk: true, type: "number" },
        { header: "부서명", accessor: "departmentNm" },
        { header: "관리자 ID", accessor: "managerId" },
        { header: "위치 ID", accessor: "locationId", type: "number" },
        { header: "위치명", accessor: "locationNm", className: "col-span-2" },
    ];

    const loadDepartments = async () => {
        try {
            const params = {
                departmentNm: searchParams.departmentNm || undefined,
                locationNm: searchParams.locationNm || undefined,
            };
            const { data } = await axios.get(API_BASE, { params });
            setDepartments(data);
            setSelectedDepartment(data.length > 0 ? data[0] : null);
        } catch (err) {
            console.error("부서 목록 조회 실패", err);
        }
    };

    useEffect(() => {
        loadDepartments();
    }, []);
    
    
    const handleInsert = () => {
        if (departments.some(d => d.isNew)) {
            alert("먼저 작성 중인 신규 부서를 저장해주세요.");
            return;
        }

        // ✨ 1. 임시 ID를 생성합니다.
        const tempId = `new_${tempIdCounter}`;
        setTempIdCounter(prev => prev + 1);

        const newDepartment = {
            tempId: tempId, //  임시 ID를 객체에 포함합니다.
            isNew: true,
            departmentId: null,
            departmentNm: "",
            managerId: "",
            locationId: null,
            locationNm: "",
        };
        setIsEditing(true);
        setDepartments(prev => [...prev, newDepartment]);
        setSelectedDepartment(newDepartment);
    };

    const updateDepartmentField = (field, value) => {
        const updatedValue = (field === 'departmentId' || field === 'locationId') ? (value === '' ? null : Number(value)) : value;
        const updatedDepartment = { ...selectedDepartment, [field]: updatedValue };
        setSelectedDepartment(updatedDepartment);

        setDepartments(prev =>
            prev.map(d => {
                // ✨ 2. 새 항목은 tempId로, 기존 항목은 departmentId로 정확하게 비교합니다.
                const isNewMatch = d.isNew && d.tempId === selectedDepartment.tempId;
                const isExistingMatch = !d.isNew && d.departmentId === selectedDepartment.departmentId;

                if (isNewMatch || isExistingMatch) {
                    return updatedDepartment;
                }
                return d;
            })
        );
    };

    const handleUpdateClick = async () => {
        if (!selectedDepartment || selectedDepartment.isNew) return alert("수정할 기존 부서를 선택해주세요.");
        if (!isEditing) return setIsEditing(true);
        try {
            await axios.put(`${API_BASE}/${selectedDepartment.departmentId}`, selectedDepartment);
            alert("부서 정보가 성공적으로 수정되었습니다.");
            setIsEditing(false);
            loadDepartments();
        } catch (err) { console.error("수정 실패:", err); alert("수정 중 오류가 발생했습니다."); }
    };
    const handleSaveNew = async () => {
        const newDepartments = departments.filter(d => d.isNew);
        if (newDepartments.length === 0) return alert("저장할 신규 항목이 없습니다.");
        for (const dept of newDepartments) { if (!dept.departmentId || !dept.departmentNm) return alert("부서 ID와 부서명은 필수입니다."); }
        try {
            await axios.post(`${API_BASE}/saveAll`, newDepartments);
            alert("신규 부서가 저장되었습니다.");
            loadDepartments();
        } catch (err) { console.error("신규 저장 실패:", err); alert("신규 저장 중 오류가 발생했습니다."); }
    };
    const handleDelete = async () => {
        if (!selectedDepartment || !selectedDepartment.departmentId) return alert("삭제할 부서를 선택해주세요.");
        const { departmentId, departmentNm } = selectedDepartment;
        if (!window.confirm(`부서 '${departmentNm}' (ID: ${departmentId})을(를) 정말 삭제하시겠습니까?`)) return;
        try {
            await axios.delete(`${API_BASE}/${departmentId}`);
            alert("삭제되었습니다.");
            loadDepartments();
        } catch (err) { console.error("삭제 오류", err); alert("삭제 중 오류가 발생했습니다."); }
    };
    const handleRowClick = (row) => {
        setSelectedDepartment(row);
        setIsEditing(false);
    }

    // --- 신규 행 추가 취소 ---
  const handleCancelInsert = () => {
    // isNew 플래그가 없는, 기존에 저장되어 있던 부서 목록만 필터링해서 남깁니다.
    const originalDepartments = departments.filter(d => !d.isNew);
    setDepartments(originalDepartments);
    
    // 선택된 항목을 목록의 첫 번째 항목으로 되돌리거나, 목록이 비었으면 null로 설정합니다.
    setSelectedDepartment(originalDepartments.length > 0 ? originalDepartments[0] : null);
    
    // 수정 모드를 해제합니다.
    setIsEditing(false);
  };
    
    // 2. isFieldEditable 로직 수정
    const isFieldEditable = (col) => {
        if (col.isPk) {
            return selectedDepartment?.isNew;
        }
        return selectedDepartment?.isNew || isEditing;
    };
    
    return (
        <div>
            <h2 className="font-bold text-xl mb-4">부서 등록</h2>
            <SearchLayout>
                
                <SearchTextBox label="부서명" value={searchParams.departmentNm} onChange={(e) => setSearchParams({...searchParams, departmentNm: e.target.value})} />
                <SearchTextBox label="위치명" value={searchParams.locationNm} onChange={(e) => setSearchParams({...searchParams, locationNm: e.target.value})} />
                <SearchButton onClick={loadDepartments} />
                <InsertButton onClick={handleInsert} />
                <SaveButton onClick={handleSaveNew} />
            </SearchLayout>
            <div className="flex flex-col md:flex-row gap-4 mt-4">
                <div className="w-full md:w-[35%] overflow-x-auto">
                    <BodyGrid
                        columns={gridColumns}
                        data={departments}
                        onRowClick={handleRowClick}
                        selectedId={selectedDepartment?.departmentId}
                    />
                </div>
                <div className="border w-full md:w-[65%] rounded-2xl overflow-hidden shadow p-6 bg-white">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">부서 상세정보</h3>
                        {selectedDepartment && !selectedDepartment.isNew && (
                             <div className="flex gap-x-2">
                                 <button type="button" onClick={handleUpdateClick} className="px-4 py-2 bg-blue-500 text-white font-medium rounded-lg shadow-md hover:bg-blue-600">
                                     {isEditing ? "수정 완료" : "수정"}
                                 </button>
                                 <button type="button" onClick={handleDelete} className="px-4 py-2 bg-rose-500 text-white font-medium rounded-lg shadow-md hover:bg-red-600">
                                     삭제
                                 </button>
                             </div>
                        )}
                        {selectedDepartment && selectedDepartment.isNew && (
                        <div className="flex gap-x-2">
                            <button type="button" onClick={handleCancelInsert} className="px-4 py-2 bg-gray-500 text-white font-medium rounded-lg shadow-md hover:bg-gray-600">
                                취소
                            </button>
                        </div>
                      )}
                    </div>
                    {selectedDepartment ? (
                        <div className="grid grid-cols-2 gap-6">
                            {detailColumns.map((col) => {
                                const editable = isFieldEditable(col);
                                return (
                                    <div key={col.accessor} className={col.className || ""}>
                                        <label className={detailLabel}>{col.header}</label>
                                        <input
                                            type={col.type || "text"}
                                            value={selectedDepartment[col.accessor] || ""}
                                            onChange={(e) => updateDepartmentField(col.accessor, e.target.value)}
                                            className={`${detailTextBox} ${!editable ? "bg-gray-100" : "bg-white"}`}
                                            readOnly={!editable}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-gray-500">부서를 선택하거나 '행추가' 버튼으로 신규 부서를 등록하세요.</p>
                    )}
                </div>
            </div>
        </div>
    );
}