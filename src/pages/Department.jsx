import { useEffect, useState } from "react";
import axios from "axios";

// ===================================================================
// UI 컴포넌트 (직원 등록 메뉴 스타일)
// ===================================================================

const SearchLayout = ({ children, className }) => <div className={className}>{children}</div>;
const SearchTextBox = ({ label, value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type="text"
      value={value}
      onChange={onChange}
      className="w-full rounded-lg border border-sky-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
    />
  </div>
);
const BodyGrid = ({ columns, data, onRowClick, selectedId }) => (
    // ✅ [수정] 그리드 높이를 고정하고 스크롤을 추가하여 레이아웃을 안정적으로 만듭니다.
    <div className="h-[calc(100vh-280px)] overflow-auto">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-sky-50 sticky top-0">
                <tr>
                    {columns.map((col) => (
                    <th key={col.accessor} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {col.header}
                    </th>
                    ))}
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {data.length === 0 ? (
                    <tr>
                        <td colSpan={columns.length} className="text-center py-4 text-gray-500">
                            데이터가 없습니다.
                        </td>
                    </tr>
                ) : (
                    data.map((row) => (
                        <tr
                        key={row.departmentId || row._key}
                        onClick={() => onRowClick(row)}
                        className={`cursor-pointer hover:bg-sky-50 ${
                            selectedId && row.departmentId === selectedId ? "bg-sky-100" : ""
                        }`}
                        >
                        {columns.map((col) => (
                            <td key={col.accessor} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row[col.accessor]}
                            </td>
                        ))}
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
);
const SearchButton = ({ onClick }) => <button onClick={onClick} className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 shadow">조회</button>;
const InsertButton = ({ onClick }) => <button onClick={onClick} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow">추가</button>;
const ResetButton = ({ onClick }) => <button onClick={onClick} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 shadow">리셋</button>;
const CancelButton = ({ onClick }) => <button onClick={onClick} className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 shadow">취소</button>;
const SaveButton = ({ onClick }) => <button onClick={onClick} className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 shadow">저장</button>;


// ===================================================================
// 메인 컴포넌트
// ===================================================================

const API_BASE = "http://localhost:8081/api/departments";
const detailLabel = "block text-sm font-medium text-gray-700 mb-1";
const detailTextBox = "w-full rounded-lg border border-sky-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400";

export default function Department() {
    const [departments, setDepartments] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [searchParams, setSearchParams] = useState({ departmentNm: "", locationNm: "" });
    const [message, setMessage] = useState("");

    const gridColumns = [
        { header: "부서ID", accessor: "departmentId" },
        { header: "부서명", accessor: "departmentNm" },
        { header: "위치명", accessor: "locationNm" },
    ];

    const showMessage = (msg) => {
        setMessage(msg);
        setTimeout(() => setMessage(""), 3000);
    };

    const loadDepartments = async (departmentNm = searchParams.departmentNm, locationNm = searchParams.locationNm) => {
        showMessage("부서 데이터를 조회하고 있습니다...");
        try {
            const params = { departmentNm: departmentNm || undefined, locationNm: locationNm || undefined };
            const { data } = await axios.get(API_BASE, { params });
            setDepartments(data);
            setSelectedDepartment(null);
            setIsEditing(false);
            showMessage("부서 목록을 성공적으로 조회했습니다.");
        } catch (err) {
            console.error("부서 목록 조회 실패", err);
            showMessage("부서 목록 조회 중 오류가 발생했습니다.");
        }
    };

    useEffect(() => {
        loadDepartments();
    }, []);

    const handleSave = async () => {
        if (!selectedDepartment) return showMessage("저장할 부서를 선택해주세요.");

        if (selectedDepartment.isNew) { // 신규 저장
            if (!selectedDepartment.departmentId || !selectedDepartment.departmentNm) {
                return showMessage("부서 ID와 부서명은 필수입니다.");
            }
            try {
                await axios.post(API_BASE, selectedDepartment);
                showMessage("신규 부서가 저장되었습니다.");
                loadDepartments();
            } catch (err) {
                console.error("신규 저장 실패:", err);
                showMessage("신규 저장 중 오류가 발생했습니다.");
            }
        } else { // 기존 항목 수정
             try {
                await axios.put(`${API_BASE}/${selectedDepartment.departmentId}`, selectedDepartment);
                showMessage("부서 정보가 성공적으로 수정되었습니다.");
                setIsEditing(false);
                loadDepartments();
            } catch (err) {
                console.error("수정 실패:", err);
                showMessage("수정 중 오류가 발생했습니다.");
            }
        }
    };

    const handleDelete = async () => {
        if (!selectedDepartment || !selectedDepartment.departmentId || selectedDepartment.isNew) {
            return showMessage("삭제할 기존 부서를 선택해주세요.");
        }
        const { departmentId, departmentNm } = selectedDepartment;
        if (window.confirm(`부서 '${departmentNm}' (ID: ${departmentId})을(를) 정말 삭제하시겠습니까?`)) {
            try {
                await axios.delete(`${API_BASE}/${departmentId}`);
                showMessage("삭제되었습니다.");
                loadDepartments();
            } catch (err) {
                console.error("삭제 오류", err);
                showMessage("삭제 중 오류가 발생했습니다.");
            }
        }
    };

    const handleSearch = () => {
        loadDepartments(searchParams.departmentNm, searchParams.locationNm);
    };

    const handleReset = () => {
        setSearchParams({ departmentNm: "", locationNm: "" });
        loadDepartments("", "");
        showMessage("검색 조건이 초기화되었습니다.");
    };

    const handleInsert = () => {
        if (departments.some(d => d.isNew)) {
            return showMessage("먼저 작성 중인 신규 부서를 저장해주세요.");
        }
        const newDepartment = {
            _key: `new_${Date.now()}`, isNew: true, departmentId: "", departmentNm: "",
            managerId: "", locationId: "", locationNm: "",
        };
        setDepartments(prev => [newDepartment, ...prev]);
        setSelectedDepartment(newDepartment);
        setIsEditing(true);
    };

    const handleCancelInsert = () => {
        setDepartments(prev => prev.filter(d => !d.isNew));
        setSelectedDepartment(null);
        setIsEditing(false);
        showMessage("신규 부서 추가가 취소되었습니다.");
    };

    const handleRowClick = (row) => {
        setSelectedDepartment(row);
        setIsEditing(false);
    };

    const updateDepartmentField = (field, value) => {
        if (!selectedDepartment) return;
        const updated = { ...selectedDepartment, [field]: value };
        setSelectedDepartment(updated);
        setDepartments(prev =>
            prev.map(d => {
                const keyToMatch = d.isNew ? d._key : d.departmentId;
                const selectedKey = selectedDepartment.isNew ? selectedDepartment._key : selectedDepartment.departmentId;
                return keyToMatch === selectedKey ? updated : d;
            })
        );
    };

    const handleToggleEdit = () => {
        if (!selectedDepartment || selectedDepartment.isNew) {
            return showMessage("수정할 기존 부서를 선택해주세요.");
        }
        if (isEditing) {
            handleSave();
        } else {
            setIsEditing(true);
        }
    };

    const handleSaveClick = () => {
        if (selectedDepartment?.isNew) {
            handleSave();
        } else {
            showMessage("기존 부서 정보는 '수정' 버튼을 눌러 변경할 수 있습니다.");
        }
    };
    
    const isFieldEditable = selectedDepartment?.isNew || isEditing;

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-inter">
            <h2 className="font-bold text-2xl mb-6 text-sky-700">부서 관리</h2>

            {message && (
                <div className="mb-4 p-3 bg-sky-100 text-sky-800 rounded-lg text-sm text-center shadow">
                    {message}
                </div>
            )}

            <SearchLayout className="bg-white rounded-xl p-4 shadow-md flex items-end gap-4 mb-6">
                <SearchTextBox
                    label="부서명"
                    value={searchParams.departmentNm}
                    onChange={(e) => setSearchParams({ ...searchParams, departmentNm: e.target.value })}
                />
                <SearchTextBox
                    label="위치명"
                    value={searchParams.locationNm}
                    onChange={(e) => setSearchParams({ ...searchParams, locationNm: e.target.value })}
                />
                <div className="flex gap-2 ml-auto">
                    <SearchButton onClick={handleSearch} />
                    <ResetButton onClick={handleReset} />
                    <InsertButton onClick={handleInsert} />
                </div>
            </SearchLayout>

            <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-[45%] bg-white rounded-2xl shadow-md overflow-hidden">
                    <BodyGrid
                        columns={gridColumns}
                        data={departments}
                        onRowClick={handleRowClick}
                        selectedId={selectedDepartment?.departmentId}
                    />
                </div>
                
                {/* ✅ [수정] flex-col을 추가하여 내부 아이템을 수직으로 정렬합니다. */}
                <div className="w-full md:w-[55%] bg-white rounded-2xl shadow-md p-6 border border-sky-200 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-sky-800">부서 상세정보</h3>
                        {selectedDepartment && !selectedDepartment.isNew && (
                            <div className="flex gap-2">
                                <button onClick={handleToggleEdit} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow">
                                    {isEditing ? "수정 완료" : "수정"}
                                </button>
                                <button onClick={handleDelete} className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 shadow">
                                    삭제
                                </button>
                            </div>
                        )}
                        {selectedDepartment && selectedDepartment.isNew && (
                            <div className="flex gap-2">
                                <SaveButton onClick={handleSaveClick} />
                                <CancelButton onClick={handleCancelInsert} />
                            </div>
                        )}
                    </div>

                    {selectedDepartment ? (
                        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                            <div>
                                <label className={detailLabel}>부서 ID</label>
                                <input type="number" value={selectedDepartment.departmentId || ""}
                                    onChange={e => updateDepartmentField("departmentId", e.target.value)}
                                    className={`${detailTextBox} ${!selectedDepartment.isNew ? "bg-gray-100" : "bg-white"}`}
                                    readOnly={!selectedDepartment.isNew}
                                />
                            </div>
                            <div>
                                <label className={detailLabel}>부서명</label>
                                <input type="text" value={selectedDepartment.departmentNm || ""}
                                    onChange={e => updateDepartmentField("departmentNm", e.target.value)}
                                    className={`${detailTextBox} ${!isFieldEditable ? "bg-gray-100" : "bg-white"}`}
                                    readOnly={!isFieldEditable}
                                />
                            </div>
                            <div>
                                <label className={detailLabel}>관리자 ID</label>
                                <input type="number" value={selectedDepartment.managerId || ""}
                                    onChange={e => updateDepartmentField("managerId", e.target.value)}
                                    className={`${detailTextBox} ${!isFieldEditable ? "bg-gray-100" : "bg-white"}`}
                                    readOnly={!isFieldEditable}
                                />
                            </div>
                            <div>
                                <label className={detailLabel}>위치 ID</label>
                                <input type="number" value={selectedDepartment.locationId || ""}
                                    onChange={e => updateDepartmentField("locationId", e.target.value)}
                                    className={`${detailTextBox} ${!isFieldEditable ? "bg-gray-100" : "bg-white"}`}
                                    readOnly={!isFieldEditable}
                                />
                            </div>
                             <div className="col-span-2">
                                <label className={detailLabel}>위치명</label>
                                <input type="text" value={selectedDepartment.locationNm || ""}
                                    onChange={e => updateDepartmentField("locationNm", e.target.value)}
                                    className={`${detailTextBox} ${!isFieldEditable ? "bg-gray-100" : "bg-white"}`}
                                    readOnly={!isFieldEditable}
                                />
                            </div>
                        </div>
                    ) : (
                        // ✅ [수정] flex-grow와 정렬 클래스를 사용하여 남은 공간을 채우고 내용을 중앙에 배치합니다.
                        <div className="flex-grow flex items-center justify-center">
                            <p className="text-gray-500">부서를 선택하거나 '추가' 버튼으로 신규 등록하세요.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

