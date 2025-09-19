import { useEffect, useState } from "react";
import axios from "axios";

// 공통 UI 컴포넌트 (기존과 동일)
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
          key={row.employeeId || row._key}
          onClick={() => onRowClick(row)}
          className={`cursor-pointer hover:bg-sky-50 ${
            (selectedId && row.employeeId === selectedId) || (selectedId === null && row.isNew) ? "bg-sky-100" : ""
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

const API_BASE = "http://localhost:8081/api/employees";

const detailLabel = "block text-sm font-medium text-gray-700 mb-1";
const detailTextBox = "w-full rounded-lg border border-sky-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400";

export default function Employee() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchEmpId, setSearchEmpId] = useState("");
  const [searchEmpNm, setSearchEmpNm] = useState("");
  const [message, setMessage] = useState("");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const loadEmployees = async (employeeId, employeeNm) => {
    setMessage("데이터를 조회하고 있습니다...");
    try {
      const { data } = await axios.get(API_BASE, {
        params: {
          employeeId: employeeId || undefined,
          employeeNm: employeeNm || undefined,
        },
      });
      setEmployees(data);
      setSelectedEmployee(data[0] || null);
      setIsEditing(false);
      setIsConfirmingDelete(false);
      showMessage("사원 목록을 성공적으로 조회했습니다.");
    } catch (err) {
      console.error("사원 목록 조회 실패", err);
      showMessage("사원 목록 조회 중 오류가 발생했습니다.");
    }
  };

  const handleSearch = () => {
    loadEmployees(searchEmpId, searchEmpNm);
  };

  const handleInsert = () => {
    const newEmp = {
      isNew: true,
      _key: `new_${Date.now()}`,
      employeeId: "",
      employeeNm: "",
      departmentId: "",
      positionId: "",
      hireDate: new Date().toISOString().slice(0, 10),
      phone: "",
      email: "",
      employeeStatus: "ACTIVE",
    };
    setEmployees(prev => [newEmp, ...prev]);
    setSelectedEmployee(newEmp);
    setIsEditing(true);
    setIsConfirmingDelete(false);
  };

  const updateEmployeeField = (field, value) => {
    if (!selectedEmployee) return;
    const updated = { ...selectedEmployee, [field]: value };
    setSelectedEmployee(updated);
    setEmployees(prev =>
      prev.map(e => (e._key === selectedEmployee._key ? updated : e))
    );
  };

  const isFieldEditable = () => selectedEmployee?.isNew || isEditing;

  const handleSaveNew = async () => {
    const newEmps = employees.filter(e => e.isNew);
    if (newEmps.length === 0) {
      showMessage("저장할 신규 항목이 없습니다.");
      return;
    }
    for (const emp of newEmps) {
      if (!emp.employeeId || !emp.employeeNm || !emp.departmentId || !emp.positionId) {
        showMessage("사원ID, 사원명, 부서ID, 직책ID는 필수 입력입니다.");
        return;
      }
    }
    try {
      await axios.post(`${API_BASE}/saveAll`, newEmps);
      showMessage("신규 사원이 저장되었습니다.");
      loadEmployees();
    } catch (err) {
      console.error(err);
      showMessage("신규 저장 중 오류가 발생했습니다.");
    }
  };

  const handleUpdateClick = async () => {
    if (!selectedEmployee || selectedEmployee.isNew) {
      showMessage("수정할 기존 사원을 선택해주세요.");
      return;
    }
    if (!isEditing) {
      setIsEditing(true);
      return;
    }
    try {
      await axios.put(`${API_BASE}/${selectedEmployee.employeeId}`, selectedEmployee);
      showMessage("사원 정보가 수정되었습니다.");
      setIsEditing(false);
      loadEmployees();
    } catch (err) {
      console.error(err);
      showMessage("수정 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = () => {
    if (!selectedEmployee || !selectedEmployee.employeeId) {
      showMessage("삭제할 사원을 선택해주세요.");
      return;
    }
    setIsConfirmingDelete(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${API_BASE}/${selectedEmployee.employeeId}`);
      showMessage("삭제되었습니다.");
      loadEmployees();
    } catch (err) {
      console.error(err);
      showMessage("삭제 중 오류가 발생했습니다.");
    }
    setIsConfirmingDelete(false);
  };

  const cancelDelete = () => setIsConfirmingDelete(false);

  const handleRowClick = (row) => {
    setSelectedEmployee(row);
    setIsEditing(false);
    setIsConfirmingDelete(false);
  };

  // ✅ 수정된 부분
  const handleReset = () => {
    setSearchEmpId("");
    setSearchEmpNm("");
    // 검색 조건을 비우고 전체 목록을 다시 조회합니다.
    loadEmployees("", ""); 
    showMessage("검색 조건이 초기화되었습니다.");
  };

  const columns = [
    { header: "사원ID", accessor: "employeeId" },
    { header: "사원명", accessor: "employeeNm" },
    { header: "부서ID", accessor: "departmentId" },
    { header: "직책ID", accessor: "positionId" },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-inter">
      <h2 className="font-bold text-2xl mb-6 text-sky-700">사원 관리</h2>

      {message && (
        <div className="mb-4 p-3 bg-sky-100 text-sky-800 rounded-lg text-sm text-center">
          {message}
        </div>
      )}

      <SearchLayout className="bg-white rounded-xl p-4 shadow-md flex flex-col md:flex-row md:items-end gap-4 mb-6">
        <SearchTextBox
          label="사원ID"
          value={searchEmpId}
          onChange={e => setSearchEmpId(e.target.value)}
          type="text"
        />
        <SearchTextBox
          label="사원명"
          value={searchEmpNm}
          onChange={e => setSearchEmpNm(e.target.value)}
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
            columns={columns}
            data={employees.map(e => ({ ...e, _key: e.isNew ? e._key : e.employeeId }))}
            onRowClick={handleRowClick}
            selectedId={selectedEmployee?.employeeId}
          />
        </div>

        <div className="w-full md:w-[65%] bg-white rounded-2xl shadow-md p-6 border border-sky-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-sky-800">사원 상세정보</h3>
            {selectedEmployee && (
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
              <span>사원 '{selectedEmployee.employeeNm}' (ID: {selectedEmployee.employeeId})을 삭제하시겠습니까?</span>
              <div className="flex gap-2">
                <button onClick={confirmDelete} className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs hover:bg-rose-700">확인</button>
                <button onClick={cancelDelete} className="px-3 py-1 bg-gray-400 text-white rounded-lg text-xs hover:bg-gray-500">취소</button>
              </div>
            </div>
          )}

          {selectedEmployee ? (
            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className={detailLabel}>사원ID</label>
                <input type="text" value={selectedEmployee.employeeId || ""}
                  onChange={e => updateEmployeeField("employeeId", e.target.value)}
                  className={`${detailTextBox} ${!selectedEmployee.isNew ? "bg-gray-100" : "bg-white"}`}
                  readOnly={!selectedEmployee.isNew}
                />
              </div>
              <div className="col-span-2">
                <label className={detailLabel}>사원명</label>
                <input type="text" value={selectedEmployee.employeeNm || ""}
                  onChange={e => updateEmployeeField("employeeNm", e.target.value)}
                  className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                  readOnly={!isFieldEditable()}
                />
              </div>
              <div>
                <label className={detailLabel}>부서ID</label>
                <input
                  type="number"
                  value={selectedEmployee.departmentId || ""}
                  onChange={e => updateEmployeeField("departmentId", e.target.value)}
                  className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                  readOnly={!isFieldEditable()}
                />
              </div>
              <div>
                <label className={detailLabel}>직책ID</label>
                <input
                  type="number"
                  value={selectedEmployee.positionId || ""}
                  onChange={e => updateEmployeeField("positionId", e.target.value)}
                  className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                  readOnly={!isFieldEditable()}
                />
              </div>
              <div>
                <label className={detailLabel}>입사일</label>
                <input type="date" value={selectedEmployee.hireDate || ""}
                  onChange={e => updateEmployeeField("hireDate", e.target.value)}
                  className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                  readOnly={!isFieldEditable()}
                />
              </div>
              <div>
                <label className={detailLabel}>연락처</label>
                <input type="text" value={selectedEmployee.phone || ""}
                  onChange={e => updateEmployeeField("phone", e.target.value)}
                  className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                  readOnly={!isFieldEditable()}
                />
              </div>
              <div className="col-span-3">
                <label className={detailLabel}>E-mail</label>
                <input type="email" value={selectedEmployee.email || ""}
                  onChange={e => updateEmployeeField("email", e.target.value)}
                  className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                  readOnly={!isFieldEditable()}
                />
              </div>
              <div>
                <label className={detailLabel}>상태</label>
                <select value={selectedEmployee.employeeStatus || "ACTIVE"}
                  onChange={e => updateEmployeeField("employeeStatus", e.target.value)}
                  className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                  disabled={!isFieldEditable()}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">사원을 선택하거나 '추가' 버튼으로 신규 등록하세요.</p>
          )}
        </div>
      </div>
    </div>
  );
}