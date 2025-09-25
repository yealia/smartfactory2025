import { useEffect, useState } from "react";
import axios from "axios";

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
                    key={row.employeeId || row._key}
                    onClick={() => onRowClick(row)}
                    className={`cursor-pointer hover:bg-sky-50 ${
                        selectedId && row.employeeId === selectedId ? "bg-sky-100" : ""
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


const API_BASE = "http://localhost:8083/api/proxy/employees";
const POSITIONS_API_BASE = "http://localhost:8083/api/proxy/positions";
const detailLabel = "block text-sm font-medium text-gray-700 mb-1";
const detailTextBox = "w-full rounded-lg border border-sky-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400";

export default function Employee() {
  const [employees, setEmployees] = useState([]);
  const [positions, setPositions] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchParams, setSearchParams] = useState({ employeeId: "", employeeNm: "" });
  const [message, setMessage] = useState("");
  const [formErrors, setFormErrors] = useState({ phone: "", email: "" });


  const gridColumns = [
    { header: "사원ID", accessor: "employeeId" },
    { header: "사원명", accessor: "employeeNm" },
    { header: "부서명", accessor: "departmentNm" },
    { header: "직책명", accessor: "positionNm" },
    { header: "재직상태", accessor: "employeeStatus" },
  ];

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const validateField = (name, value) => {
    let error = "";
    if (value) {
      if (name === 'phone') {
        const phoneRegex = /^\d{2,3}-\d{3,4}-\d{4}$/;
        if (!phoneRegex.test(value)) {
          error = "전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678)";
        }
      }
      if (name === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          error = "이메일 형식이 올바르지 않습니다. (예: user@example.com)";
        }
      }
    }
    setFormErrors(prev => ({ ...prev, [name]: error }));
    return error === "";
  };


  const loadEmployees = async (employeeId, employeeNm) => {
        showMessage("사원 데이터를 조회하고 있습니다...");
        try {
            // ✅ [수정] 파라미터 이름을 백엔드와 일치시킵니다.
            const params = { employeeId: employeeId || undefined, employeeNm: employeeNm || undefined };
            const { data } = await axios.get(API_BASE, { params });
            setEmployees(data);
            setSelectedEmployee(null);
            setIsEditing(false);
            showMessage("사원 목록을 성공적으로 조회했습니다.");
        } catch (err) {
            console.error("사원 목록 조회 실패", err);
            showMessage("사원 목록 조회 중 오류가 발생했습니다.");
        }
    };
  
  const loadPositions = async () => {
    try {
      const { data } = await axios.get(POSITIONS_API_BASE);
      if (Array.isArray(data)) {
        setPositions(data);
      } else {
        console.error("직책 API 응답이 배열이 아닙니다:", data);
        setPositions([]);
      }
    } catch (err) {
      console.error("직책 목록 조회 실패", err);
      showMessage("직책 목록을 불러오는 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    loadEmployees();
    loadPositions();
  }, []);

  const handleSave = async () => {
    if (!selectedEmployee) {
      showMessage("저장할 사원을 선택해주세요.");
      return;
    }
    
    const isPhoneValid = validateField('phone', selectedEmployee.phone);
    const isEmailValid = validateField('email', selectedEmployee.email);

    if (!isPhoneValid || !isEmailValid) {
        showMessage("입력 형식이 올바르지 않은 항목이 있습니다.");
        return;
    }

    if (!selectedEmployee.employeeId || !selectedEmployee.employeeNm || !selectedEmployee.departmentId || !selectedEmployee.positionId || !selectedEmployee.hireDate) {
      showMessage("사원ID, 사원명, 부서ID, 직책, 입사일은 필수입니다.");
      return;
    }

    try {
      if (selectedEmployee.isNew) {
          const response = await axios.post(API_BASE, selectedEmployee);
          showMessage(`사원 정보(ID: ${response.data.employeeId})가 성공적으로 저장되었습니다.`);
      } else {
          // ✅ [수정] URL 생성 오류 수정: '/api' 중복 제거
          const response = await axios.put(`${API_BASE}/${selectedEmployee.employeeId}`, selectedEmployee);
          showMessage(`사원 정보(ID: ${response.data.employeeId})가 성공적으로 수정되었습니다.`);
      }
          loadEmployees(searchParams.employeeId, searchParams.employeeNm);
      } catch (err) {
       if (err.response && err.response.status === 400 && err.response.data) {
        const serverErrors = err.response.data;
        let errorMsg = "저장 실패: ";
        const messages = Object.values(serverErrors).join(', ');
        showMessage(errorMsg + messages);
      } else {
        console.error("사원 정보 저장 실패:", err);
        showMessage("저장 중 오류가 발생했습니다.");
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedEmployee || !selectedEmployee.employeeId || selectedEmployee.isNew) {
      showMessage("삭제할 기존 사원을 선택해주세요.");
      return;
    }
    if (window.confirm(`'${selectedEmployee.employeeNm}' (ID: ${selectedEmployee.employeeId}) 사원 정보를 정말 삭제하시겠습니까?`)) {
      try {
            // ✅ [수정] URL 생성 오류 수정: '/api' 중복 제거
            await axios.delete(`${API_BASE}/${selectedEmployee.employeeId}`);
            showMessage("사원 정보가 삭제되었습니다.");
            loadEmployees(searchParams.employeeId, searchParams.employeeNm);
        } catch (err) {
        if (err.response && err.response.status === 409) {
          showMessage("해당 사원을 참조하는 데이터가 있어 삭제할 수 없습니다.");
        } else {
          console.error("사원 정보 삭제 실패:", err);
          showMessage("삭제 중 오류가 발생했습니다.");
        }
      }
    }
  };

  const handleSearch = () => {
    loadEmployees(searchParams.employeeId, searchParams.employeeNm);
  };

  const handleReset = () => {
    setSearchParams({ employeeId: "", employeeNm: "" });
    loadEmployees("", "");
    showMessage("검색 조건이 초기화되었습니다.");
  };

  const handleInsert = () => {
    if (employees.some(emp => emp.isNew)) {
      showMessage("먼저 작성 중인 신규 사원을 저장해주세요.");
      return;
    }
    const newEmployee = {
      _key: `new_${Date.now()}`, isNew: true, employeeId: "", employeeNm: "",
      departmentId: "", positionId: "", hireDate: new Date().toISOString().slice(0, 10),
      phone: "", email: "", employeeStatus: "재직",
    };
    setEmployees(prev => [newEmployee, ...prev]);
    setSelectedEmployee(newEmployee);
    setIsEditing(true);
    setFormErrors({ phone: "", email: "" });
  };

  const handleCancelInsert = () => {
    setEmployees(prev => prev.filter(emp => !emp.isNew));
    setSelectedEmployee(null);
    setIsEditing(false);
    showMessage("신규 사원 추가가 취소되었습니다.");
  };

  const handleRowClick = (row) => {
    setSelectedEmployee(row);
    setIsEditing(false);
    setFormErrors({ phone: "", email: "" });
  };

  const updateEmployeeField = (field, value) => {
    if (!selectedEmployee) return;
    
    if (field === 'phone' || field === 'email') {
        validateField(field, value);
    }

    const updatedValue = ['departmentId', 'positionId'].includes(field)
      ? (value === '' ? '' : Number(value)) : value;
    const updated = { ...selectedEmployee, [field]: updatedValue };
    setSelectedEmployee(updated);
    setEmployees(prev =>
      prev.map(emp => {
        const keyToMatch = emp.isNew ? emp._key : emp.employeeId;
        const selectedKey = selectedEmployee.isNew ? selectedEmployee._key : selectedEmployee.employeeId;

        return keyToMatch === selectedKey ? updated : emp;
      })
    );
  };

  const handleToggleEdit = () => {
    if (!selectedEmployee || selectedEmployee.isNew) {
      showMessage("수정할 기존 사원을 선택해주세요.");
      return;
    }
    if (isEditing) {
      handleSave();
    } else {
      setIsEditing(true);
    }
  };

  const handleSaveClick = () => {
    if (!selectedEmployee) return;
    if (selectedEmployee.isNew) {
      handleSave();
    } else {
      showMessage("기존 직원의 정보는 '수정' 버튼을 눌러 변경할 수 있습니다.");
    }
  };

  const isFieldEditable = selectedEmployee?.isNew || isEditing;

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-inter">
      <h2 className="font-bold text-2xl mb-6 text-sky-700">사원 관리</h2>

      {message && (
        <div className="mb-4 p-3 bg-sky-100 text-sky-800 rounded-lg text-sm text-center shadow">
          {message}
        </div>
      )}

      <SearchLayout className="bg-white rounded-xl p-4 shadow-md flex items-end gap-4 mb-6">
        <SearchTextBox
          label="사원ID"
          value={searchParams.employeeId}
          onChange={(e) => setSearchParams({ ...searchParams, employeeId: e.target.value })}
        />
        <SearchTextBox
          label="사원명"
          value={searchParams.employeeNm}
          onChange={(e) => setSearchParams({ ...searchParams, employeeNm: e.target.value })}
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
            data={employees}
            onRowClick={handleRowClick}
            selectedId={selectedEmployee?.employeeId}
          />
        </div>

        <div className="w-full md:w-[55%] bg-white rounded-2xl shadow-md p-6 border border-sky-200 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-sky-800">사원 상세정보</h3>
            {selectedEmployee && !selectedEmployee.isNew && (
              <div className="flex gap-2">
                <button onClick={handleToggleEdit} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow">
                  {isEditing ? "수정 완료" : "수정"}
                </button>
                <button onClick={handleDelete} className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 shadow">
                  삭제
                </button>
              </div>
            )}
            {selectedEmployee && selectedEmployee.isNew && (
              <div className="flex gap-2">
                <SaveButton onClick={handleSaveClick} />
                <CancelButton onClick={handleCancelInsert} />
              </div>
            )}
          </div>

          {selectedEmployee ? (
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className={detailLabel}>사원ID</label>
                <input type="text" value={selectedEmployee.employeeId || ""}
                  onChange={e => updateEmployeeField("employeeId", e.target.value)}
                  className={`${detailTextBox} ${!selectedEmployee.isNew ? "bg-gray-100" : "bg-white"}`}
                  readOnly={!selectedEmployee.isNew}
                />
              </div>
              <div>
                <label className={detailLabel}>사원명</label>
                <input type="text" value={selectedEmployee.employeeNm || ""}
                  onChange={e => updateEmployeeField("employeeNm", e.target.value)}
                  className={`${detailTextBox} ${!isFieldEditable ? "bg-gray-100" : "bg-white"}`}
                  readOnly={!isFieldEditable}
                />
              </div>
              <div>
                <label className={detailLabel}>부서ID</label>
                <input type="text" inputMode="numeric" value={selectedEmployee.departmentId ?? ""}
                  onChange={e => updateEmployeeField("departmentId", e.target.value)}
                  className={`${detailTextBox} ${!isFieldEditable ? "bg-gray-100" : "bg-white"}`}
                  readOnly={!isFieldEditable}
                />
              </div>
              <div>
                <label className={detailLabel}>직책명</label>
                <select
                  value={selectedEmployee.positionId ?? ""}
                  onChange={e => updateEmployeeField("positionId", e.target.value)}
                  className={`${detailTextBox} ${!isFieldEditable ? "bg-gray-100" : "bg-white"}`}
                  disabled={!isFieldEditable}
                >
                  <option value="" disabled>
                    {positions.length > 0 ? "직책을 선택하세요" : "직책 정보 없음"}
                  </option>
                  {positions.map((pos) => (
                    <option key={pos.positionId} value={pos.positionId}>
                      {pos.positionNm}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={detailLabel}>재직상태</label>
                <select value={selectedEmployee.employeeStatus || "재직"}
                  onChange={e => updateEmployeeField("employeeStatus", e.target.value)}
                  className={`${detailTextBox} ${!isFieldEditable ? "bg-gray-100" : "bg-white"}`}
                  disabled={!isFieldEditable}
                >
                  <option value="재직">재직</option>
                  <option value="휴직">휴직</option>
                  <option value="퇴사">퇴사</option>
                </select>
              </div>
              <div>
                <label className={detailLabel}>입사일</label>
                <input type="date" value={selectedEmployee.hireDate || ""}
                  onChange={e => updateEmployeeField("hireDate", e.target.value)}
                  className={`${detailTextBox} ${!isFieldEditable ? "bg-gray-100" : "bg-white"}`}
                  readOnly={!isFieldEditable}
                />
              </div>
              
              <div className="col-span-2">
                <label className={detailLabel}>연락처</label>
                <input type="text" value={selectedEmployee.phone || ""}
                  onChange={e => updateEmployeeField("phone", e.target.value)}
                  className={`${detailTextBox} ${!isFieldEditable ? "bg-gray-100" : "bg-white"} ${formErrors.phone ? 'border-red-500' : ''}`}
                  readOnly={!isFieldEditable}
                />
                {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
              </div>
              <div className="col-span-2">
                <label className={detailLabel}>이메일</label>
                <input type="email" value={selectedEmployee.email || ""}
                  onChange={e => updateEmployeeField("email", e.target.value)}
                  className={`${detailTextBox} ${!isFieldEditable ? "bg-gray-100" : "bg-white"} ${formErrors.email ? 'border-red-500' : ''}`}
                  readOnly={!isFieldEditable}
                />
                {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
              </div>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center">
                 <p className="text-gray-500">사원을 선택하거나 '추가' 버튼으로 신규 등록하세요.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
