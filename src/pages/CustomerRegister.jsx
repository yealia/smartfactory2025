import { useEffect, useState } from "react";
import axios from "axios";

// API 기본 주소
const API_BASE = "http://localhost:8081/api/customers";

const SearchLayout = ({ children }) => (
    <div className="p-4 mb-4 bg-white rounded-lg shadow-md flex flex-wrap items-end gap-4 border border-gray-200">
        {children}
    </div>
);

const SearchTextBox = ({ label, ...props }) => (
    <div className="flex-grow min-w-[200px]">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input type="text" {...props} className="w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500" />
    </div>
);

const SearchDatePicker = ({ label, ...props }) => (
    <div className="flex-grow min-w-[200px]">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input type="date" {...props} className="w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500" />
    </div>
);

const SearchButton = ({ onClick }) => (
    <button onClick={onClick} className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg shadow-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
        조회
    </button>
);

const InsertButton = ({ onClick }) => (
    <button onClick={onClick} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200">
       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
        행추가
    </button>
);

const SaveButton = ({ onClick }) => (
    <button onClick={onClick} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6a1 1 0 10-2 0v5.586l-1.293-1.293zM5 4a1 1 0 011-1h8a1 1 0 011 1v1a1 1 0 11-2 0V5H7v1a1 1 0 11-2 0V4z" /><path d="M3 9a2 2 0 012-2h10a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
        저장
    </button>
);

const BodyGrid = ({ columns, data, onRowClick, selectedItem }) => {
    return (
        <div className="h-[calc(100vh-250px)] overflow-auto border rounded-lg shadow-md bg-white">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100 sticky top-0">
                    <tr>
                        {columns.map((col, index) => (
                            <th key={index} scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider" style={{ width: col.width }}>
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data && data.length > 0 ? (
                        data.map((row, rowIndex) => {
                            const isSelected = selectedItem && (row.customerId === selectedItem.customerId);
                            return (
                                <tr key={row.customerId || rowIndex} onClick={() => onRowClick(row)} className={`cursor-pointer ${isSelected ? 'bg-sky-100' : 'hover:bg-gray-50'}`}>
                                    {columns.map((col, colIndex) => (
                                        <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {row[col.accessor]}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan={columns.length} className="px-6 py-4 text-center text-sm text-gray-500">
                                데이터가 없습니다.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};


// 상세 정보 스타일
const customerDetailLabel = "block text-sm font-medium text-gray-700 mb-1";
const detailTextBox = "w-full rounded-lg border border-gray-300 shadow-sm px-3 py-2 focus:ring-2 focus:ring-sky-400 focus:border-sky-500 outline-none transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed";

export default function CustomerRegister() {
    const [customers, setCustomers] = useState([]); // 그리드에 표시될 고객 목록
    const [selectedCustomer, setSelectedCustomer] = useState(null); // 선택된 고객 상세 정보
    const [isEditing, setIsEditing] = useState(false); // 수정 모드 여부
    const [searchCustomerNm, setSearchCustomerNm] = useState(""); // 검색 조건: 고객명
    const [searchContractDate, setSearchContractDate] = useState(""); // 검색 조건: 계약일
    const [employees, setEmployees] = useState([]); // 직원 목록을 저장

    // 컴포넌트가 처음 렌더링될 때 고객 목록을 불러옵니다.
    useEffect(() => {
        loadCustomers();  // 고객 목록
        loadEmployees();  // 직원 목록 
    }, []);

    // 고객 목록 조회 함수 (검색 조건 포함)
    const loadCustomers = async () => {
        try {
            // ✅✅✅ Controller의 기본 GET 메서드로 엔드포인트 수정 ✅✅✅
            const { data } = await axios.get(API_BASE, {
                params: {
                    // 값이 비어있으면 파라미터를 보내지 않도록 처리
                    customerNm: searchCustomerNm || undefined,
                    contractDate: searchContractDate || undefined,
                }
            });
            setCustomers(data);
            if (data.length > 0) {
                setSelectedCustomer(data[0]); // 첫 번째 고객을 기본으로 선택
            } else {
                setSelectedCustomer(null); // 결과가 없으면 상세 정보 초기화
            }
            setIsEditing(false); // 조회 후 수정 모드 해제
        } catch (err) {
            console.error("고객 목록 조회 실패:", err);
            alert("고객 목록을 불러오는 중 오류가 발생했습니다.");
        }
    };

    // 직원 목록을 불러오는 함수 추가
    const loadEmployees = async () => {
        try {
            // 실제 직원 목록 API 주소로 변경해야 합니다.
            const { data } = await axios.get("http://localhost:8081/api/employees"); 
            setEmployees(data || []);
        } catch (err) {
            console.error("직원 목록 조회 실패:", err);
            alert("담당자 목록을 불러오는 중 오류가 발생했습니다.");
        }
    };

    // '행추가' 버튼 클릭 핸들러
    const handleInsert = () => {
        // 임시 ID로 중복 선택 문제 방지
        const tempId = `new_${Date.now()}`;
        const newCustomer = {
            isNew: true, // 신규 행임을 표시하는 임시 플래그
            customerId: "", // 사용자가 직접 입력
            customerNm: "",
            businessRegistration: "",
            contractDate: new Date().toISOString().slice(0, 10),
            countryCode: "KR",
            status: "ACTIVE",
            contactPerson: "",
            contactPhone: "",
            contactEmail: "",
            contactAddress: "",
            remark: "",
            // React key 및 선택 처리를 위한 임시 고유값
            _tempId: tempId
        };
        setIsEditing(true); // 새 항목은 바로 수정 모드로 진입
        setCustomers(prev => [newCustomer, ...prev]); // 새 고객을 목록 맨 위에 추가
        setSelectedCustomer(newCustomer);
    };
    
    // 상세 정보 필드 값 변경 핸들러
    const updateCustomerField = (field, value) => {
        if (!selectedCustomer) return;

        const updatedCustomer = { ...selectedCustomer, [field]: value };
        setSelectedCustomer(updatedCustomer);

        // 그리드(customers) 상태도 실시간으로 동기화
        setCustomers(prev =>
            prev.map(c =>
                (c._tempId && c._tempId === selectedCustomer._tempId) || (c.customerId === selectedCustomer.customerId) ? updatedCustomer : c
            )
        );
    };

    // '수정' 또는 '수정 완료' 버튼 클릭 핸들러 (기존 고객 수정)
    const handleUpdateClick = async () => {
        if (!selectedCustomer || selectedCustomer.isNew) {
            alert("수정할 기존 고객을 선택해주세요.");
            return;
        }

        if (!isEditing) {
            setIsEditing(true); // '수정' -> 수정 모드로 전환
            return;
        }

        // '수정 완료' -> 서버로 데이터 전송
        try {
            // Controller의 POST 메서드는 ID 존재 여부로 등록/수정을 모두 처리
            await axios.post(API_BASE, selectedCustomer);
            alert("고객 정보가 성공적으로 수정되었습니다.");
            setIsEditing(false); // 수정 모드 종료
            loadCustomers(); // 목록 새로고침
        } catch (err) {
            console.error("수정 실패:", err);
            alert("수정 중 오류가 발생했습니다.");
        }
    };

    // '저장' 버튼 핸들러 (신규 항목 일괄 저장)
    const handleSaveNew = async () => {
        const newCustomers = customers.filter(c => c.isNew);

        if (newCustomers.length === 0) {
            alert("저장할 신규 항목이 없습니다.");
            return;
        }

        // 유효성 검사
        for(const customer of newCustomers) {
            if (!customer.customerId || !customer.customerNm || !customer.businessRegistration) {
                alert("고객ID, 고객명, 사업자등록번호는 필수 입력 항목입니다.");
                return;
            }
        }

        try {
            // Controller의 '/bulk' 엔드포인트로 전송
            await axios.post(`${API_BASE}/bulk`, newCustomers);
            alert("신규 고객이 성공적으로 저장되었습니다.");
            loadCustomers(); // 목록 새로고침
        } catch (err) {
            console.error("신규 저장 실패:", err);
            alert("신규 저장 중 오류가 발생했습니다. (고객 ID가 중복될 수 있습니다)");
        }
    };
    
    // '삭제' 버튼 핸들러
    const handleDelete = async () => {
        if (!selectedCustomer || !selectedCustomer.customerId || selectedCustomer.isNew) {
            alert("삭제할 기존 고객을 선택해주세요.");
            return;
        }

        const { customerId, customerNm } = selectedCustomer;
        
        if (window.confirm(`[${customerNm}] 고객 정보를 정말 삭제하시겠습니까?`)) {
            try {
                await axios.delete(`${API_BASE}/${customerId}`);
                alert("성공적으로 삭제되었습니다.");
                loadCustomers();
            } catch (err) {
                console.error("삭제 오류:", err);
                alert("삭제 중 오류가 발생했습니다. (해당 고객을 참조하는 다른 데이터가 있을 수 있습니다)");
            }
        }
    };

    // 그리드 행 클릭 핸들러
    const handleRowClick = (row) => {
        const pendingNew = customers.some(c => c.isNew);
        
        // 작성 중인 신규 데이터가 있고, 다른 행을 클릭했을 때
        if(pendingNew && !row.isNew) {
            if (window.confirm("작성 중인 신규 데이터가 있습니다. 저장하지 않고 이동하시겠습니까?")) {
                setCustomers(customers.filter(c => !c.isNew)); // 신규 행들 제거
            } else {
                return; // 이동 취소
            }
        }
        setSelectedCustomer(row);
        // 신규 행을 클릭하면 수정모드, 기존 행을 클릭하면 보기모드
        setIsEditing(!!row.isNew);
    }

    // 그리드 컬럼 정의
    const columns = [
        { header: "고객ID", accessor: "customerId", width: "120px" },
        { header: "고객명", accessor: "customerNm", width: "200px" },
        { header: "등록날짜", accessor: "contractDate", width: "120px" },
    ];

    // 현재 필드가 편집 가능한 상태인지 확인하는 함수
    const isFieldEditable = () => selectedCustomer?.isNew || isEditing;

    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            <h2 className="font-bold text-2xl mb-6 text-gray-800">고객 등록</h2>
            
            {/* 검색 영역 */}
            <SearchLayout>
                <SearchTextBox
                    label="고객명"
                    value={searchCustomerNm}
                    onChange={(e) => setSearchCustomerNm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && loadCustomers()}
                />
                <SearchDatePicker
                    label="등록날짜"
                    value={searchContractDate}
                    onChange={(e) => setSearchContractDate(e.target.value)}
                />
                <div className="flex items-end space-x-2 pt-6">
                    <SearchButton onClick={loadCustomers} />
                    <InsertButton onClick={handleInsert} />
                    <SaveButton onClick={handleSaveNew} />
                </div>
            </SearchLayout>

            {/* 본문 영역 (그리드 + 상세 정보) */}
            <div className="flex flex-col md:flex-row gap-4 mt-4">
                {/* 왼쪽 그리드 */}
                <div className="w-full md:w-[35%]">
                    <BodyGrid
                        columns={columns}
                        data={customers}
                        onRowClick={handleRowClick}
                        selectedItem={selectedCustomer}
                    />
                </div>

                {/* 오른쪽 상세 정보 */}
                <div className="border w-full md:w-[65%] rounded-2xl shadow-lg p-6 bg-white">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-xl font-semibold text-gray-800">고객 상세정보</h3>
                        {selectedCustomer && !selectedCustomer.isNew && (
                            <div className="flex gap-x-2">
                                <button type="button" onClick={handleUpdateClick} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200">
                                    {isEditing ? "수정 완료" : "수정"}
                                </button>
                                <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200">
                                    삭제
                                </button>
                            </div>
                        )}
                    </div>

                    {selectedCustomer ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                            {/* 고객ID */}
                            <div>
                                <label className={customerDetailLabel}>고객ID <span className="text-red-500">*</span></label>
                                <input type="text" value={selectedCustomer.customerId || ""}
                                    onChange={(e) => updateCustomerField("customerId", e.target.value)}
                                    className={detailTextBox}
                                    disabled={!selectedCustomer.isNew} // 신규일 때만 활성화
                                    placeholder="예) HD001"
                                />
                            </div>
                            {/* 고객명 */}
                            <div className="md:col-span-2">
                                <label className={customerDetailLabel}>고객명 <span className="text-red-500">*</span></label>
                                <input type="text" value={selectedCustomer.customerNm || ""}
                                    onChange={(e) => updateCustomerField("customerNm", e.target.value)}
                                    className={detailTextBox}
                                    disabled={!isFieldEditable()}
                                />
                            </div>
                            {/* 사업자등록번호 */}
                            <div>
                                <label className={customerDetailLabel}>사업자등록번호 <span className="text-red-500">*</span></label>
                                <input type="text" value={selectedCustomer.businessRegistration || ""}
                                    onChange={(e) => updateCustomerField("businessRegistration", e.target.value)}
                                    className={detailTextBox}
                                    disabled={!isFieldEditable()}
                                />
                            </div>
                            {/* 등록날짜 */}
                            <div>
                                <label className={customerDetailLabel}>등록날짜</label>
                                <input type="date" value={selectedCustomer.contractDate || ""}
                                    onChange={(e) => updateCustomerField("contractDate", e.target.value)}
                                    className={detailTextBox}
                                    disabled={!isFieldEditable()}
                                />
                            </div>
                            {/* 상태 */}
                            <div>
                                <label className={customerDetailLabel}>상태</label>
                                <select value={selectedCustomer.status || "ACTIVE"}
                                    onChange={(e) => updateCustomerField("status", e.target.value)}
                                    className={detailTextBox}
                                    disabled={!isFieldEditable()}
                                >
                                    <option value="ACTIVE">ACTIVE</option>
                                    <option value="INACTIVE">INACTIVE</option>
                                </select>
                            </div>
                            {/* 담당자명 */}
                            <div className="md:col-span-1">
                                <label className={customerDetailLabel}>담당자명</label>
                                <select
                                        value={selectedCustomer.contactPerson || ""}
                                        onChange={(e) => updateCustomerField("contactPerson", e.target.value)}
                                        className={detailTextBox}
                                        disabled={!isFieldEditable()}
                                    >
                                        <option value="">담당자 선택</option>
                                        {employees.map(emp => (
                                            <option key={emp.employeeId} value={emp.employeeNm}>
                                                {emp.employeeNm} ({emp.employeeId})
                                            </option>
                                        ))}
                                    </select>
                            </div>
                            {/* 연락처 */}
                            <div className="md:col-span-1">
                                <label className={customerDetailLabel}>연락처</label>
                                <input type="text" value={selectedCustomer.contactPhone || ""}
                                    onChange={(e) => updateCustomerField("contactPhone", e.target.value)}
                                    className={detailTextBox}
                                    disabled={!isFieldEditable()}
                                />
                            </div>
                            {/* 이메일 */}
                            <div className="md:col-span-3">
                                <label className={customerDetailLabel}>E-mail</label>
                                <input type="email" value={selectedCustomer.contactEmail || ""}
                                    onChange={(e) => updateCustomerField("contactEmail", e.target.value)}
                                    className={detailTextBox}
                                    disabled={!isFieldEditable()}
                                />
                            </div>
                            {/* 주소 */}
                            <div className="md:col-span-3">
                                <label className={customerDetailLabel}>주소</label>
                                <input type="text" value={selectedCustomer.contactAddress || ""}
                                    onChange={(e) => updateCustomerField("contactAddress", e.target.value)}
                                    className={detailTextBox}
                                    disabled={!isFieldEditable()}
                                />
                            </div>
                            {/* 비고 */}
                            <div className="md:col-span-3">
                                <label className={customerDetailLabel}>비고</label>
                                <textarea value={selectedCustomer.remark || ""}
                                    onChange={(e) => updateCustomerField("remark", e.target.value)}
                                    className={detailTextBox}
                                    disabled={!isFieldEditable()}
                                    rows={3}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                           <p>고객을 선택하거나 '행추가' 버튼으로 신규 고객을 등록하세요.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
