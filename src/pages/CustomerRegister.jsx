import React, { useEffect, useState, useCallback, memo } from "react";
import axios from "axios";

// This file requires a running backend server at http://localhost:8081 before execution.

// =================================================================================
// 1. Constants and Configuration
// =================================================================================

const API_BASE_URL = "http://localhost:8081/api/customers";

const STATUS_MAP = {
    ACTIVE: '거래 가능',
    INACTIVE: '거래 중지',
};

const INITIAL_SEARCH_PARAMS = {
    customerNm: "",
    contractDate: "",
};

const ERROR_MESSAGES = {
    NETWORK_ERROR: "백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.",
    DEFAULT_FETCH_ERROR: "고객 목록을 불러오는 중 오류가 발생했습니다.",
    SAVE_ERROR: "저장 중 오류가 발생했습니다. (고객 ID 중복 등)",
    DELETE_ERROR: "삭제 중 오류가 발생했습니다. (참조 데이터 확인 필요)",
    UPDATE_ERROR: "수정 중 오류가 발생했습니다."
};

const createNewCustomer = () => ({
    isNew: true,
    _tempId: `new_${Date.now()}`,
    customerId: null,
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
});

// =================================================================================
// ✨ 2. API Service Layer
// =================================================================================

const customerService = {
    search: (params) => axios.get(API_BASE_URL, { params }),
    save: (customer) => axios.post(API_BASE_URL, customer),
    saveBulk: (customers) => axios.post(`${API_BASE_URL}/bulk`, customers),
    delete: (customerId) => axios.delete(`${API_BASE_URL}/${customerId}`),
};

// =================================================================================
// ✨ 3. Custom Hook for Business Logic
// =================================================================================

const useCustomerManagement = () => {
    const [customers, setCustomers] = useState([]);
    const [employees, setEmployees] = useState([]); // 직원 목록 state
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [searchParams, setSearchParams] = useState(INITIAL_SEARCH_PARAMS);

    const showMessage = useCallback((msg, duration = 3000) => {
        setMessage(msg);
        setTimeout(() => setMessage(""), duration);
    }, []);

    const loadCustomers = useCallback(async (paramsToLoad = searchParams) => {
        setIsLoading(true);
        setMessage("");
        try {
            const { data } = await customerService.search({
                customerNm: paramsToLoad.customerNm || undefined,
                contractDate: paramsToLoad.contractDate || undefined,
            });
            setCustomers(data);
            setSelectedCustomer(data.length > 0 ? data[0] : null);
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to fetch customer list:", err);
            const errorMsg = err.code === "ERR_NETWORK" ? ERROR_MESSAGES.NETWORK_ERROR : ERROR_MESSAGES.DEFAULT_FETCH_ERROR;
            showMessage(errorMsg);
            setCustomers([]);
            setSelectedCustomer(null);
        } finally {
            setIsLoading(false);
        }
    }, [searchParams, showMessage]);

    // 직원 목록을 불러오는 함수
    const loadEmployees = useCallback(async () => {
        try {
            // 실제 직원 목록 API 주소로 변경해야 합니다.
            const { data } = await axios.get("http://localhost:8081/api/employees"); 
            setEmployees(data || []);
        } catch (err) {
            console.error("직원 목록 조회 실패:", err);
            showMessage("담당자 목록을 불러오는 중 오류가 발생했습니다.");
        }
    }, [showMessage]);

    useEffect(() => {
        loadCustomers();  // 고객 조회
        loadEmployees();  // 직원 목록
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearchChange = useCallback((e) => {
        const { name, value } = e.target;
        setSearchParams(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleResetSearch = useCallback(() => {
        setSearchParams(INITIAL_SEARCH_PARAMS);
        loadCustomers(INITIAL_SEARCH_PARAMS);
    }, [loadCustomers]);

    const handleInsert = useCallback(() => {
        if (isEditing && selectedCustomer && !selectedCustomer.isNew) {
            if (!window.confirm("수정 중인 내용이 있습니다. 저장하지 않고 신규 등록으로 이동하시겠습니까?")) {
                return;
            }
        }
        if (customers.some(c => c.isNew)) {
            return showMessage("먼저 작성 중인 신규 고객을 저장해주세요.");
        }
        const newCustomer = createNewCustomer();
        setCustomers(prev => [newCustomer, ...prev]);
        setSelectedCustomer(newCustomer);
        setIsEditing(true);
    }, [customers, showMessage, isEditing, selectedCustomer]);

    const handleCancelInsert = useCallback(() => {
        const remaining = customers.filter(c => !c.isNew);
        setCustomers(remaining);
        setSelectedCustomer(remaining.length > 0 ? remaining[0] : null);
        setIsEditing(false);
        showMessage("신규 고객 추가가 취소되었습니다.");
    }, [customers, showMessage]);

    const handleUpdateField = useCallback((field, value) => {
        if (!selectedCustomer) return;
        const updated = { ...selectedCustomer, [field]: value };
        setSelectedCustomer(updated);
        setCustomers(prev =>
            prev.map(c =>
                (c._tempId && c._tempId === updated._tempId) || (c.customerId && c.customerId === updated.customerId) ? updated : c
            )
        );
    }, [selectedCustomer]);

    const handleSaveNew = useCallback(async () => {
        const newCustomers = customers.filter(c => c.isNew);
        if (newCustomers.length === 0) return showMessage("저장할 신규 항목이 없습니다.");
        if (newCustomers.some(c => !c.customerId || !c.customerNm || !c.businessRegistration)) {
            return showMessage("고객ID, 고객명, 사업자등록번호는 필수 입력 항목입니다.");
        }
        try {
            await customerService.saveBulk(newCustomers);
            showMessage("신규 고객이 성공적으로 저장되었습니다.");
            await loadCustomers();
        } catch (err) {
            console.error("Failed to save new customer:", err);
            showMessage(ERROR_MESSAGES.SAVE_ERROR);
        }
    }, [customers, loadCustomers, showMessage]);

    const handleDelete = useCallback(async () => {
        if (!selectedCustomer || !selectedCustomer.customerId || selectedCustomer.isNew) {
            return showMessage("삭제할 기존 고객을 선택해주세요.");
        }
        if (window.confirm(`[${selectedCustomer.customerNm}] 고객 정보를 정말 삭제하시겠습니까?`)) {
            try {
                await customerService.delete(selectedCustomer.customerId);
                showMessage("성공적으로 삭제되었습니다.");
                await loadCustomers();
            } catch (err) {
                console.error("Delete error:", err);
                showMessage(ERROR_MESSAGES.DELETE_ERROR);
            }
        }
    }, [selectedCustomer, loadCustomers, showMessage]);

    const handleRowClick = useCallback((row) => {
        const switchToNewRow = () => {
            setSelectedCustomer(row);
            setIsEditing(!!row.isNew);
        };

        if (isEditing && selectedCustomer && !selectedCustomer.isNew) {
            if (!window.confirm("수정 중인 내용이 있습니다. 저장하지 않고 이동하시겠습니까?")) return;
        }
        const hasPendingNew = customers.some(c => c.isNew);
        if (hasPendingNew && !row.isNew) {
            if (window.confirm("작성 중인 신규 데이터가 있습니다. 저장하지 않고 이동하시겠습니까?")) {
                setCustomers(prev => prev.filter(c => !c.isNew));
                switchToNewRow();
            }
        } else {
            switchToNewRow();
        }
    }, [isEditing, selectedCustomer, customers]);

    const handleToggleEdit = useCallback(async () => {
        if (!selectedCustomer || selectedCustomer.isNew) {
            return showMessage("수정할 기존 고객을 선택해주세요.");
        }
        if (isEditing) {
            try {
                await customerService.save(selectedCustomer);
                showMessage("고객 정보가 성공적으로 수정되었습니다.");
                setIsEditing(false);
                await loadCustomers();
            } catch (err) {
                console.error("Update failed:", err);
                showMessage(ERROR_MESSAGES.UPDATE_ERROR);
            }
        } else {
            setIsEditing(true);
        }
    }, [isEditing, selectedCustomer, loadCustomers, showMessage]);

    return {
        customers, selectedCustomer, isEditing, isLoading, message, searchParams, employees,
        actions: { loadCustomers, handleSearchChange, handleResetSearch, handleInsert, handleCancelInsert, handleUpdateField, handleSaveNew, handleDelete, handleRowClick, handleToggleEdit }
    };
};

// =================================================================================
// ✨ 4. Presentational UI Components (Optimized & Memoized)
// =================================================================================

const Icon = memo(({ name }) => {
    const ICONS = {
        user: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />,
        email: <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />,
        phone: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 6.75Z" />,
    };
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            {ICONS[name]}
        </svg>
    );
});

// --- Layout Components ---
const UILayout = memo(({ children }) => <div className="p-8 bg-slate-50 min-h-screen font-sans">{children}</div>);
const Header = memo(({ title }) => (
    <div className="mb-5">
        <h1 className="font-bold text-3xl text-slate-800 tracking-wide">{title}</h1>
        <div className="h-1 w-20 bg-amber-400 mt-2 rounded-full"></div>
    </div>
));
const MessageBox = memo(({ message }) => {
    if (!message) return null;
    return (
        <div className="mb-6 p-4 bg-sky-100 text-sky-800 rounded-xl text-sm text-center shadow-md border border-sky-200">
            {message}
        </div>
    );
});
const MainLayout = memo(({ children }) => <div className="flex flex-col lg:flex-row gap-6">{children}</div>);
// ✅ [수정] 4:6 비율로 변경 (목록: w-2/5, 상세: w-3/5)
const LeftPanel = memo(({ children }) => <div className="w-full lg:w-2/5 bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col">{children}</div>);
const RightPanel = memo(({ children }) => <div className="w-full lg:w-3/5 bg-white rounded-2xl shadow-lg p-8 border border-slate-200 flex flex-col">{children}</div>);


// --- Action Components ---
const ActionButton = memo(({ intent, onClick, children, ...props }) => {
    const intentClasses = {
        primary: "bg-sky-500 hover:bg-sky-600 focus:ring-sky-500",
        secondary: "bg-gray-500 hover:bg-gray-600 focus:ring-gray-500",
        success: "bg-green-500 hover:bg-green-600 focus:ring-green-500",
        danger: "bg-rose-500 hover:bg-rose-600 focus:ring-rose-500",
        edit: "bg-blue-500 hover:bg-blue-600 focus:ring-blue-500",
    };
    const className = `px-4 py-2 rounded-md font-semibold text-white shadow focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${intentClasses[intent]}`;
    return <button onClick={onClick} className={className} {...props}>{children}</button>;
});


// --- Search Components ---
const SearchLayout = memo(({ children }) => <div className="bg-white rounded-2xl p-6 shadow-lg flex flex-wrap items-end gap-4 mb-5 border border-slate-200">{children}</div>);
const SearchField = memo(({ label, children }) => <div className="w-56"><label className="block text-sm font-semibold text-gray-600 mb-2">{label}</label>{children}</div>);
const SearchInput = memo((props) => <input {...props} className="w-full rounded-lg border border-gray-300 shadow-sm px-3 py-2 focus:ring-2 focus:ring-sky-400 focus:border-sky-500 outline-none transition-all duration-200" />);

// --- Grid & Status Components ---

const StatusIndicator = memo(({ isActive, className = "" }) => {
    if (isActive) {
        return <span className={`w-2 h-2 rounded-full bg-green-600 ${className}`}></span>;
    }
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-3.5 w-3.5 text-red-600 ${className}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={4}
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
});

const StatusBadge = memo(({ status }) => {
    const isActive = String(status).toUpperCase() === 'ACTIVE' || String(status) === '거래 가능';
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <StatusIndicator isActive={isActive} className="mr-1.5" />
            {STATUS_MAP[status] || status}
        </span>
    );
});

const DetailStatus = memo(({ status }) => {
    const isActive = String(status).toUpperCase() === 'ACTIVE';
    const textColor = isActive ? 'text-green-800' : 'text-red-800';
    const bgColor = isActive ? 'bg-green-100' : 'bg-red-100';

    return (
        <div
            className={`w-full h-[42px] rounded-lg px-3 flex items-center font-semibold border border-gray-300 ${bgColor} ${textColor}`}
        >
            <StatusIndicator isActive={isActive} className="mr-2.5" />
            {STATUS_MAP[status] || status}
        </div>
    );
});


const CustomerGrid = memo(({ columns, data, onRowClick, selectedItem, isLoading, onSearch, onReset }) => (
    <>
        <div className="flex justify-between items-center p-6 pb-4 border-b border-slate-200">
            <h4 className="text-xl font-bold text-slate-800">고객 목록</h4>
            <div className="flex gap-2">
                <ActionButton intent="primary" onClick={onSearch}>조회</ActionButton>
                <ActionButton intent="secondary" onClick={onReset}>리셋</ActionButton>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto relative">
            {isLoading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600"></div>
                    <p className="ml-4 text-slate-600">데이터를 불러오는 중...</p>
                </div>
            )}
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr>{columns.map(col => <th key={col.accessor} className="px-6 py-4 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">{col.header}</th>)}</tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                    {!isLoading && data.length === 0
                        ? <tr><td colSpan={columns.length} className="text-center py-10 text-slate-500">데이터가 없습니다.</td></tr>
                        : data.map((row, index) => {
                            const isSelected = selectedItem && ((row.customerId && row.customerId === selectedItem.customerId) || (row._tempId && row._tempId === selectedItem._tempId));
                            return (
                                <tr key={row.customerId || row._tempId} onClick={() => onRowClick(row)} className={`cursor-pointer transition-colors duration-200 ${isSelected ? "bg-sky-100" : "hover:bg-slate-50"}`}>
                                    {columns.map(col => (
                                        <td key={col.accessor} className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">
                                            {/* ✅ [추가] 좁은 목록에서 긴 텍스트가 깨지지 않도록 처리 */}
                                            <div className="truncate" title={row[col.accessor]}>
                                                {col.accessor === 'no' ? index + 1 : col.accessor === 'status' ? <StatusBadge status={row[col.accessor]} /> : row[col.accessor]}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            );
                        })
                    }
                </tbody>
            </table>
        </div>
    </>
));

// --- Details Components ---
// ✅ [수정] 상세 정보 레이아웃을 3열(md:grid-cols-3)로 변경
const DetailFormLayout = memo(({ children }) => <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">{children}</div>);
const DetailField = memo(({ label, isRequired, children, icon }) => (
    <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">{label} {isRequired && <span className="text-red-500">*</span>}</label>
        <div className="relative">
            {icon && <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Icon name={icon} /></span>}
            {children}
        </div>
    </div>
));
const DetailInput = memo(({ name, value, onChange, readOnly, placeholder, className = '' }) => <input type="text" name={name} value={value || ""} onChange={onChange} readOnly={readOnly} placeholder={placeholder} className={`w-full rounded-lg border shadow-sm px-3 py-2 focus:ring-2 focus:ring-sky-400 focus:border-sky-500 outline-none transition-all duration-200 ${readOnly ? "bg-slate-100 cursor-not-allowed border-slate-200" : "bg-white border-gray-300"} ${className}`} />);
const DetailDateInput = memo(({ name, value, onChange, readOnly, className = '' }) => <input type="date" name={name} value={value || ""} onChange={onChange} readOnly={readOnly} className={`w-full rounded-lg border shadow-sm px-3 py-2 focus:ring-2 focus:ring-sky-400 focus:border-sky-500 outline-none transition-all duration-200 ${readOnly ? "bg-slate-100 cursor-not-allowed border-slate-200" : "bg-white border-gray-300"} ${className}`} />);
const DetailSelect = memo(({ name, value, onChange, disabled, children, className = '' }) => <select name={name} value={value || ""} onChange={onChange} disabled={disabled} className={`w-full rounded-lg border shadow-sm px-3 py-2 focus:ring-2 focus:ring-sky-400 focus:border-sky-500 outline-none transition-all duration-200 ${disabled ? "bg-slate-100 cursor-not-allowed border-slate-200" : "bg-white border-gray-300"} ${className}`}>{children}</select>);
const Placeholder = memo(({ text }) => <div className="flex-grow flex items-center justify-center"><p className="text-slate-500 text-center">{text}</p></div>);


const DetailActions = memo(({ customer, isEditing, actions }) => {
    if (customer.isNew) {
        return (
            <>
                <ActionButton intent="success" onClick={actions.handleSaveNew}>저장</ActionButton>
                <ActionButton intent="secondary" onClick={actions.handleCancelInsert}>취소</ActionButton>
            </>

        );
    }
    return (
        <>
            <ActionButton intent="edit" onClick={actions.handleToggleEdit}>{isEditing ? "수정 완료" : "수정"}</ActionButton>
            <ActionButton intent="danger" onClick={actions.handleDelete}>삭제</ActionButton>
        </>
    );
});


const CustomerSearch = memo(({ params, onChange, onSearch }) => (
    <SearchLayout>
        <SearchField label="고객명">
            <SearchInput
                type="text"
                name="customerNm"
                value={params.customerNm}
                onChange={onChange}
                onKeyPress={(e) => e.key === 'Enter' && onSearch(params)}
                placeholder="예) Smart Factory"
            />
        </SearchField>
        <SearchField label="등록날짜">
            <SearchInput type="date" name="contractDate" value={params.contractDate} onChange={onChange} />
        </SearchField>
    </SearchLayout>
));

const CustomerDetails = memo(({ customer, isEditing, actions, employees }) => {
    const isFieldEditable = customer?.isNew || isEditing;
    const updateField = (e) => actions.handleUpdateField(e.target.name, e.target.value);
    const inputPadding = "pl-10";

    return (
        <div className="flex flex-col h-full">
            {/* --- HEADER --- */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-800">
                    {customer?.isNew ? '신규 고객 등록' : '고객 상세정보'}
                </h3>
                {(!customer || !customer.isNew) && (
                    <div className="flex gap-2">
                        <ActionButton intent="success" onClick={actions.handleInsert}>추가</ActionButton>
                    </div>
                )}
            </div>

            {/* --- BODY & FOOTER --- */}
            {customer ? (
                <>
                    <div className="flex-grow overflow-y-auto px-2 pb-4">
                        <DetailFormLayout>
                            <DetailField label="고객ID" isRequired><DetailInput name="customerId" value={customer.customerId} onChange={updateField} readOnly={!customer.isNew} placeholder="예) HD001" /></DetailField>
                            <DetailField label="고객명" isRequired><DetailInput name="customerNm" value={customer.customerNm} onChange={updateField} readOnly={!isFieldEditable} placeholder="예) 현대중공업" /></DetailField>
                            <DetailField label="사업자등록번호" isRequired><DetailInput name="businessRegistration" value={customer.businessRegistration} onChange={updateField} readOnly={!isFieldEditable} placeholder="123-45-67890" /></DetailField>
                            <DetailField label="통화(국가코드)"><DetailInput name="countryCode" value={customer.countryCode} onChange={updateField} readOnly={!isFieldEditable} placeholder="KR" /></DetailField>
                            <DetailField label="등록날짜"><DetailDateInput name="contractDate" value={customer.contractDate} onChange={updateField} readOnly={!isFieldEditable} /></DetailField>
                            
                            <DetailField label="상태">
                                {isFieldEditable ? (
                                    <DetailSelect name="status" value={customer.status} onChange={updateField} disabled={!isFieldEditable}>
                                        <option value="ACTIVE">{STATUS_MAP.ACTIVE}</option>
                                        <option value="INACTIVE">{STATUS_MAP.INACTIVE}</option>
                                    </DetailSelect>
                                ) : (
                                    <DetailStatus status={customer.status} />
                                )}
                            </DetailField>

                            <DetailField label="담당자명" icon="user">
                                {/* input을 select(콤보박스)로 변경 */}
                                <DetailSelect
                                    name="contactPerson"
                                    value={customer.contactPerson}
                                    onChange={updateField}
                                    disabled={!isFieldEditable}
                                    className={inputPadding}
                                >
                                    <option value="">담당자 선택</option>
                                    {employees.map(emp => (
                                        <option key={emp.employeeId} value={emp.employeeNm}>
                                            {emp.employeeNm} ({emp.employeeId})
                                        </option>
                                    ))}
                                </DetailSelect>
                            </DetailField>
                            <DetailField label="연락처" icon="phone"><DetailInput name="contactPhone" value={customer.contactPhone} onChange={updateField} readOnly={!isFieldEditable} placeholder="예) 010-1234-5678" className={inputPadding} /></DetailField>
                            <DetailField label="E-mail" icon="email"><DetailInput name="contactEmail" value={customer.contactEmail} onChange={updateField} readOnly={!isFieldEditable} placeholder="예) spyard@cp.com" className={inputPadding} /></DetailField>
                            {/* ✅ [수정] 주소와 비고 필드의 col-span을 3으로 변경 */}
                            <div className="md:col-span-3"><DetailField label="주소"><DetailInput name="contactAddress" value={customer.contactAddress} onChange={updateField} readOnly={!isFieldEditable} placeholder="주소를 입력하세요" /></DetailField></div>
                            <div className="md:col-span-3"><DetailField label="비고"><DetailInput name="remark" value={customer.remark} onChange={updateField} readOnly={!isFieldEditable} placeholder="특이사항을 입력하세요" /></DetailField></div>
                        </DetailFormLayout>
                    </div>


                    {/* --- FOOTER --- */}
                    {customer.isNew && (
                        <div className="mt-auto pt-6 flex justify-end gap-2">
                            <DetailActions customer={customer} isEditing={isEditing} actions={actions} />

                        </div>
                    )}

                    {!customer.isNew && (
                        <div className="mt-auto pt-6 flex justify-center gap-2">
                            <DetailActions customer={customer} isEditing={isEditing} actions={actions} />
                        </div>
                    )}
                </>
            ) : (
                <Placeholder text="고객을 선택하거나 '추가' 버튼으로 신규 등록하세요." />
            )}
        </div>
    );
});


// =================================================================================
// ✨ 5. Main Page Component
// =================================================================================

export default function CustomerRegister() {
    const { customers, selectedCustomer, isEditing, isLoading, message, searchParams, employees, actions } = useCustomerManagement();

    const gridColumns = [
        { header: "No", accessor: "no" },
        { header: "고객ID", accessor: "customerId" },
        { header: "고객명", accessor: "customerNm" },
        { header: "등록날짜", accessor: "contractDate" },
    ];

    return (
        <UILayout>
            <Header title="고객 등록" />
            
            <CustomerSearch
                params={searchParams}
                onChange={actions.handleSearchChange}
                onSearch={() => actions.loadCustomers(searchParams)}
            />
            
            <MessageBox message={message} />
            
            <MainLayout>
                <LeftPanel>
                    <CustomerGrid
                        columns={gridColumns}
                        data={customers}
                        onRowClick={actions.handleRowClick}
                        selectedItem={selectedCustomer}
                        isLoading={isLoading}
                        onSearch={() => actions.loadCustomers(searchParams)}
                        onReset={actions.handleResetSearch}
                    />
                </LeftPanel>
                <RightPanel>
                    <CustomerDetails
                        customer={selectedCustomer}
                        isEditing={isEditing}
                        actions={actions}
                        employees={employees}
                    />
                </RightPanel>
            </MainLayout>
        </UILayout>
    );
}