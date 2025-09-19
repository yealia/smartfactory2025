import { useEffect, useState } from "react";
import axios from "axios";

// 공통 UI 컴포넌트 (사원 관리 코드에서 복사하여 일관성을 유지)
const SearchLayout = ({ children, className }) => <div className={className}>{children}</div>;
const SearchTextBox = ({ label, value, onChange, className, type = "text" }) => (
  <div className={`flex flex-col ${className}`}>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      className="w-full rounded-lg border border-sky-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
    />
  </div>
);
const BodyGrid = ({ columns, data, onRowClick, selectedId }) => (
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-sky-50">
      <tr>
        {columns.map((col) => (
          <th key={col.accessor} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            {col.header}
          </th>
        ))}
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {data.map((row) => (
        <tr
          key={row.departmentId || row._key}
          onClick={() => onRowClick(row)}
          className={`cursor-pointer hover:bg-sky-50 ${
            (selectedId && row.departmentId === selectedId) || (selectedId === null && row.isNew) ? "bg-sky-100" : ""
          }`}
        >
          {columns.map((col) => (
            <td key={col.accessor} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {row[col.accessor]}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);
const SearchButton = ({ onClick }) => (
  <button onClick={onClick} className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 shadow">
    조회
  </button>
);
const InsertButton = ({ onClick }) => (
  <button onClick={onClick} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow">
    추가
  </button>
);
const SaveButton = ({ onClick }) => (
  <button onClick={onClick} className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 shadow">
    저장
  </button>
);
const ResetButton = ({ onClick }) => (
  <button onClick={onClick} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 shadow">
    리셋
  </button>
);


const API_BASE = "http://localhost:8081/api/departments";
const detailLabel = "block text-sm font-medium text-gray-700 mb-1";
const detailTextBox = "w-full rounded-lg border border-sky-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400";

export default function Department() {
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchParams, setSearchParams] = useState({ departmentNm: "", locationNm: "" });
  const [message, setMessage] = useState("");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const gridColumns = [
    { header: "부서ID", accessor: "departmentId" },
    { header: "부서명", accessor: "departmentNm" },
    { header: "위치명", accessor: "locationNm" },
  ];

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const loadDepartments = async (departmentNm, locationNm) => {
    showMessage("데이터를 조회하고 있습니다...");
    try {
      const params = {
        departmentNm: departmentNm || undefined,
        locationNm: locationNm || undefined,
      };
      const { data } = await axios.get(API_BASE, { params });
      setDepartments(data);
      setSelectedDepartment(data.length > 0 ? data[0] : null);
      setIsEditing(false);
      setIsConfirmingDelete(false);
      showMessage("부서 목록을 성공적으로 조회했습니다.");
    } catch (err) {
      console.error("부서 목록 조회 실패", err);
      showMessage("부서 목록 조회 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

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
      showMessage("먼저 작성 중인 신규 부서를 저장하거나 취소해주세요.");
      return;
    }
    const newDepartment = {
      _key: `new_${Date.now()}`,
      isNew: true,
      departmentId: null,
      departmentNm: "",
      managerId: null,
      locationId: null,
      locationNm: "",
    };
    setDepartments(prev => [newDepartment, ...prev]);
    setSelectedDepartment(newDepartment);
    setIsEditing(true);
    setIsConfirmingDelete(false);
  };

  const updateDepartmentField = (field, value) => {
    if (!selectedDepartment) return;
    const updatedValue = (field === 'departmentId' || field === 'locationId' || field === 'managerId') ? (value === '' ? null : Number(value)) : value;
    const updated = { ...selectedDepartment, [field]: updatedValue };
    setSelectedDepartment(updated);
    setDepartments(prev =>
      prev.map(d => (d._key === selectedDepartment._key ? updated : d))
    );
  };

  const isFieldEditable = (col) => {
    if (!selectedDepartment) return false;
    if (col.isPk) {
      return selectedDepartment.isNew;
    }
    return selectedDepartment.isNew || isEditing;
  };

  const handleSaveNew = async () => {
    const newDepartments = departments.filter(d => d.isNew);
    if (newDepartments.length === 0) {
      showMessage("저장할 신규 항목이 없습니다.");
      return;
    }
    for (const dept of newDepartments) {
      if (!dept.departmentId || !dept.departmentNm) {
        showMessage("부서ID와 부서명은 필수 입력입니다.");
        return;
      }
    }
    try {
      await axios.post(`${API_BASE}/saveAll`, newDepartments);
      showMessage("신규 부서가 저장되었습니다.");
      loadDepartments();
    } catch (err) {
      console.error(err);
      showMessage("신규 저장 중 오류가 발생했습니다.");
    }
  };

  const handleUpdateClick = async () => {
    if (!selectedDepartment || selectedDepartment.isNew) {
      showMessage("수정할 기존 부서를 선택해주세요.");
      return;
    }
    if (!isEditing) {
      setIsEditing(true);
      return;
    }
    try {
      await axios.put(`${API_BASE}/${selectedDepartment.departmentId}`, selectedDepartment);
      showMessage("부서 정보가 수정되었습니다.");
      setIsEditing(false);
      loadDepartments();
    } catch (err) {
      console.error("수정 실패:", err);
      showMessage("수정 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = () => {
    if (!selectedDepartment || !selectedDepartment.departmentId) {
      showMessage("삭제할 부서를 선택해주세요.");
      return;
    }
    setIsConfirmingDelete(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${API_BASE}/${selectedDepartment.departmentId}`);
      showMessage("삭제되었습니다.");
      loadDepartments();
    } catch (err) {
      console.error("삭제 오류", err);
      showMessage("삭제 중 오류가 발생했습니다.");
    }
    setIsConfirmingDelete(false);
  };

  const cancelDelete = () => setIsConfirmingDelete(false);

  const handleRowClick = (row) => {
    setSelectedDepartment(row);
    setIsEditing(false);
    setIsConfirmingDelete(false);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-inter">
      <h2 className="font-bold text-2xl mb-6 text-sky-700">부서 관리</h2>

      {message && (
        <div className="mb-4 p-3 bg-sky-100 text-sky-800 rounded-lg text-sm text-center">
          {message}
        </div>
      )}

      <SearchLayout className="bg-white rounded-xl p-4 shadow-md flex flex-col md:flex-row md:items-end gap-4 mb-6">
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
        <div className="flex gap-2 md:ml-auto mt-4 md:mt-0">
          <SearchButton onClick={handleSearch} />
          <ResetButton onClick={handleReset} />
          <InsertButton onClick={handleInsert} />
          <SaveButton onClick={handleSaveNew} />
        </div>
      </SearchLayout>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-[35%] bg-white rounded-2xl shadow-md overflow-x-auto">
          <BodyGrid
            columns={gridColumns}
            data={departments.map(d => ({ ...d, _key: d.isNew ? d._key : d.departmentId }))}
            onRowClick={handleRowClick}
            selectedId={selectedDepartment?.departmentId}
          />
        </div>

        <div className="w-full md:w-[65%] bg-white rounded-2xl shadow-md p-6 border border-sky-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-sky-800">부서 상세정보</h3>
            {selectedDepartment && (
              <div className="flex gap-2">
                <button
                  onClick={handleUpdateClick}
                  className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 shadow"
                >
                  {isEditing ? "수정 완료" : "수정"}
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 shadow"
                >
                  삭제
                </button>
              </div>
            )}
          </div>

          {isConfirmingDelete && (
            <div className="mb-4 p-3 bg-rose-100 text-rose-800 rounded-lg text-sm flex justify-between items-center">
              <span>부서 '{selectedDepartment.departmentNm}' (ID: {selectedDepartment.departmentId})을 삭제하시겠습니까?</span>
              <div className="flex gap-2">
                <button onClick={confirmDelete} className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs hover:bg-rose-700">확인</button>
                <button onClick={cancelDelete} className="px-3 py-1 bg-gray-400 text-white rounded-lg text-xs hover:bg-gray-500">취소</button>
              </div>
            </div>
          )}

          {selectedDepartment ? (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className={detailLabel}>부서ID</label>
                <input type="number" value={selectedDepartment.departmentId || ""}
                  onChange={e => updateDepartmentField("departmentId", e.target.value)}
                  className={`${detailTextBox} ${!selectedDepartment.isNew ? "bg-gray-100" : "bg-white"}`}
                  readOnly={!selectedDepartment.isNew}
                />
              </div>
              <div className="col-span-1">
                <label className={detailLabel}>부서명</label>
                <input type="text" value={selectedDepartment.departmentNm || ""}
                  onChange={e => updateDepartmentField("departmentNm", e.target.value)}
                  className={`${detailTextBox} ${!isFieldEditable({}) ? "bg-gray-100" : "bg-white"}`}
                  readOnly={!isFieldEditable({})}
                />
              </div>
              <div>
                <label className={detailLabel}>관리자ID</label>
                <input
                  type="number"
                  value={selectedDepartment.managerId || ""}
                  onChange={e => updateDepartmentField("managerId", e.target.value)}
                  className={`${detailTextBox} ${!isFieldEditable({}) ? "bg-gray-100" : "bg-white"}`}
                  readOnly={!isFieldEditable({})}
                />
              </div>
              <div>
                <label className={detailLabel}>위치ID</label>
                <input
                  type="number"
                  value={selectedDepartment.locationId || ""}
                  onChange={e => updateDepartmentField("locationId", e.target.value)}
                  className={`${detailTextBox} ${!isFieldEditable({}) ? "bg-gray-100" : "bg-white"}`}
                  readOnly={!isFieldEditable({})}
                />
              </div>
              <div>
                <label className={detailLabel}>위치명</label>
                <input
                  type="text"
                  value={selectedDepartment.locationNm || ""}
                  onChange={e => updateDepartmentField("locationNm", e.target.value)}
                  className={`${detailTextBox} ${!isFieldEditable({}) ? "bg-gray-100" : "bg-white"}`}
                  readOnly={!isFieldEditable({})}
                />
              </div>
            </div>
          ) : (
            <p className="text-gray-500">부서를 선택하거나 '추가' 버튼으로 신규 등록하세요.</p>
          )}
        </div>
      </div>
    </div>
  );
}
