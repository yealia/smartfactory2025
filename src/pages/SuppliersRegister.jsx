import React, { useEffect, useState, useCallback, memo } from "react";
import axios from "axios";

// This file requires a running backend server at http://localhost:8081 before execution.

// =================================================================================
// ✨ 1. Constants and Configuration
// =================================================================================

const API_BASE_URL = "http://localhost:8081/api/suppliers";

const INITIAL_SEARCH_PARAMS = {
    supplierName: "",
    contractDate: "",
};

const ERROR_MESSAGES = {
    NETWORK_ERROR: "백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.",
    DEFAULT_FETCH_ERROR: "공급업체 목록을 불러오는 중 오류가 발생했습니다.",
    SAVE_ERROR: "저장 중 오류가 발생했습니다. (ID 중복 등)",
    DELETE_ERROR: "삭제 중 오류가 발생했습니다. (참조 데이터 확인 필요)",
    UPDATE_ERROR: "수정 중 오류가 발생했습니다."
};

const createNewSupplier = () => ({
    isNew: true,
    _tempId: `new_${Date.now()}`,
    supplierId: null,
    supplierName: "",
    contractDate: new Date().toISOString().slice(0, 10),
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    contactAddress: "",
});

// =================================================================================
// ✨ 2. API Service Layer
// =================================================================================

const supplierService = {
    search: (params) => axios.get(API_BASE_URL, { params }),
    createBulk: (suppliers) => axios.post(`${API_BASE_URL}/bulk`, suppliers),
    update: (id, supplier) => axios.put(`${API_BASE_URL}/${id}`, supplier),
    delete: (id) => axios.delete(`${API_BASE_URL}/${id}`),
};

// =================================================================================
// ✨ 3. Custom Hook for Business Logic
// =================================================================================

const useSupplierManagement = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [searchParams, setSearchParams] = useState(INITIAL_SEARCH_PARAMS);

    const showMessage = useCallback((msg, duration = 3000) => {
        setMessage(msg);
        setTimeout(() => setMessage(""), duration);
    }, []);

    const loadSuppliers = useCallback(async (paramsToLoad = searchParams) => {
        setIsLoading(true);
        setMessage("");
        try {
            const { data } = await supplierService.search({
                supplierName: paramsToLoad.supplierName || undefined,
                contractDate: paramsToLoad.contractDate || undefined,
            });
            setSuppliers(data);
            if (data.length > 0) {
                const previouslySelected = selectedSupplier;
                const reselectItem = previouslySelected ? data.find(s => s.supplierId === previouslySelected.supplierId) : null;
                setSelectedSupplier(reselectItem || data[0]);
            } else {
                setSelectedSupplier(null);
            }
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to fetch supplier list:", err);
            const errorMsg = err.code === "ERR_NETWORK" ? ERROR_MESSAGES.NETWORK_ERROR : ERROR_MESSAGES.DEFAULT_FETCH_ERROR;
            showMessage(errorMsg);
            setSuppliers([]);
            setSelectedSupplier(null);
        } finally {
            setIsLoading(false);
        }
    }, [searchParams, showMessage, selectedSupplier]);


    useEffect(() => {
        loadSuppliers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearchChange = useCallback((e) => {
        const { name, value } = e.target;
        setSearchParams(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleResetSearch = useCallback(() => {
        setSearchParams(INITIAL_SEARCH_PARAMS);
        loadSuppliers(INITIAL_SEARCH_PARAMS);
    }, [loadSuppliers]);

    // ✅ [수정] 새 항목을 배열의 마지막에 추가하도록 변경
    const handleInsert = useCallback(() => {
        if (suppliers.some(s => s.isNew)) {
            return showMessage("먼저 작성 중인 신규 공급업체를 저장해주세요.");
        }
        const newSupplier = createNewSupplier();
        setSuppliers(prev => [...prev, newSupplier]); // 배열의 뒤에 추가
        setSelectedSupplier(newSupplier);
        setIsEditing(true);
    }, [suppliers, showMessage]);

    const handleCancelInsert = useCallback(() => {
        const remaining = suppliers.filter(s => !s.isNew);
        setSuppliers(remaining);
        setSelectedSupplier(remaining.length > 0 ? remaining[0] : null);
        setIsEditing(false);
        showMessage("신규 공급업체 추가가 취소되었습니다.");
    }, [suppliers, showMessage]);

    const handleUpdateField = useCallback((field, value) => {
        if (!selectedSupplier) return;
        const updated = { ...selectedSupplier, [field]: value };
        setSelectedSupplier(updated);
        setSuppliers(prev =>
            prev.map(s =>
                (s._tempId && s._tempId === updated._tempId) || (s.supplierId && s.supplierId === updated.supplierId) ? updated : s
            )
        );
    }, [selectedSupplier]);

    const handleSaveNew = useCallback(async () => {
        const newSuppliers = suppliers.filter(s => s.isNew && s.supplierName);
        if (newSuppliers.length === 0) {
            return showMessage("저장할 신규 항목이 없습니다. 공급업체명을 입력해주세요.");
        }

        try {
            await supplierService.createBulk(newSuppliers);
            showMessage("신규 공급업체가 성공적으로 저장되었습니다.");
            await loadSuppliers();
        } catch (err) {
            console.error("Failed to save new suppliers:", err);
            showMessage(ERROR_MESSAGES.SAVE_ERROR);
        }
    }, [suppliers, loadSuppliers, showMessage]);

    const handleDelete = useCallback(async () => {
        if (!selectedSupplier || !selectedSupplier.supplierId) {
            return showMessage("삭제할 기존 공급업체를 선택해주세요.");
        }
        if (window.confirm(`[${selectedSupplier.supplierName}] 공급업체 정보를 정말 삭제하시겠습니까?`)) {
            try {
                await supplierService.delete(selectedSupplier.supplierId);
                showMessage("성공적으로 삭제되었습니다.");
                await loadSuppliers();
            } catch (err) {
                console.error("Delete error:", err);
                showMessage(ERROR_MESSAGES.DELETE_ERROR);
            }
        }
    }, [selectedSupplier, loadSuppliers, showMessage]);

    const handleRowClick = useCallback((row) => {
        const hasPendingNew = suppliers.some(c => c.isNew);
        if (hasPendingNew && !row.isNew) {
            if (window.confirm("작성 중인 신규 데이터가 있습니다. 저장하지 않고 이동하시겠습니까?")) {
                setSuppliers(prev => prev.filter(c => !c.isNew));
            } else {
                return;
            }
        }
        setSelectedSupplier(row);
        setIsEditing(!!row.isNew);
    }, [suppliers]);

    const handleToggleEdit = useCallback(async () => {
        if (!selectedSupplier || selectedSupplier.isNew) {
            return showMessage("수정할 기존 공급업체를 선택해주세요.");
        }
        if (isEditing) {
            try {
                await supplierService.update(selectedSupplier.supplierId, selectedSupplier);
                showMessage("공급업체 정보가 성공적으로 수정되었습니다.");
                setIsEditing(false);
                await loadSuppliers();
            } catch (err) {
                console.error("Update failed:", err);
                showMessage(ERROR_MESSAGES.UPDATE_ERROR);
            }
        } else {
            setIsEditing(true);
        }
    }, [isEditing, selectedSupplier, loadSuppliers, showMessage]);

    return {
        suppliers, selectedSupplier, isEditing, isLoading, message, searchParams,
        actions: { loadSuppliers, handleSearchChange, handleResetSearch, handleInsert, handleCancelInsert, handleUpdateField, handleSaveNew, handleDelete, handleRowClick, handleToggleEdit }
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

// --- Grid & Details Components ---
const SupplierGrid = memo(({ columns, data, onRowClick, selectedItem, isLoading, onSearch, onReset, onInsert }) => (
    <>
        <div className="flex justify-between items-center p-6 pb-4 border-b border-slate-200">
            <h4 className="text-xl font-bold text-slate-800">공급업체 목록</h4>
            <div className="flex gap-2">
                <ActionButton intent="primary" onClick={onSearch}>조회</ActionButton>
                <ActionButton intent="secondary" onClick={onReset}>리셋</ActionButton>
                <ActionButton intent="success" onClick={onInsert}>추가</ActionButton>
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
                            const isSelected = selectedItem && ((row.supplierId && row.supplierId === selectedItem.supplierId) || (row._tempId && row._tempId === selectedItem._tempId));
                            return (
                                <tr key={row.supplierId || row._tempId} onClick={() => onRowClick(row)} className={`cursor-pointer transition-colors duration-200 ${isSelected ? "bg-sky-100" : "hover:bg-slate-50"}`}>
                                    {columns.map(col => (
                                        <td key={col.accessor} className="px-6 py-4 whitespace-nowrap text-sm text-slate-800">
                                            <div className="truncate" title={row[col.accessor]}>
                                                {col.accessor === 'no' ? index + 1 : row[col.accessor]}
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

const DetailFormLayout = memo(({ children }) => <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">{children}</div>);
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
const Placeholder = memo(({ text }) => <div className="flex-grow flex items-center justify-center"><p className="text-slate-500 text-center">{text}</p></div>);

const DetailActions = memo(({ supplier, isEditing, actions }) => {
    if (supplier.isNew) {
        return (
            <>
                <ActionButton intent="secondary" onClick={actions.handleCancelInsert}>취소</ActionButton>
                <ActionButton intent="success" onClick={actions.handleSaveNew}>저장</ActionButton>
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

const SupplierDetails = memo(({ supplier, isEditing, actions }) => {
    const isFieldEditable = supplier?.isNew || isEditing;
    const updateField = (e) => actions.handleUpdateField(e.target.name, e.target.value);
    const inputPadding = "pl-10";

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-800">
                    {supplier?.isNew ? '신규 공급업체 등록' : '공급업체 상세정보'}
                </h3>
            </div>

            {supplier ? (
                <>
                    <div className="flex-grow overflow-y-auto px-2 pb-4">
                        <DetailFormLayout>
                            <DetailField label="공급업체 ID">
                                <DetailInput name="supplierId" value={supplier.supplierId || ""} readOnly={true} placeholder="자동 생성"/>
                            </DetailField>
                             <DetailField label="공급업체명" isRequired>
                                <DetailInput name="supplierName" value={supplier.supplierName} onChange={updateField} readOnly={!isFieldEditable} placeholder="공급업체명을 입력하세요" />
                            </DetailField>
                            <DetailField label="담당자명" icon="user">
                                <DetailInput name="contactName" value={supplier.contactName} onChange={updateField} readOnly={!isFieldEditable} placeholder="담당자명을 입력하세요" className={inputPadding} />
                            </DetailField>
                            <DetailField label="연락처" icon="phone">
                                <DetailInput name="contactPhone" value={supplier.contactPhone} onChange={updateField} readOnly={!isFieldEditable} placeholder="예) 010-1234-5678" className={inputPadding} />
                            </DetailField>
                            <DetailField label="E-mail" icon="email">
                                <DetailInput name="contactEmail" value={supplier.contactEmail} onChange={updateField} readOnly={!isFieldEditable} placeholder="예) supplier@example.com" className={inputPadding} />
                            </DetailField>
                            <DetailField label="등록날짜">
                                <DetailDateInput name="contractDate" value={supplier.contractDate} onChange={updateField} readOnly={!isFieldEditable} />
                            </DetailField>
                            <div className="md:col-span-2">
                                <DetailField label="주소">
                                    <DetailInput name="contactAddress" value={supplier.contactAddress} onChange={updateField} readOnly={!isFieldEditable} placeholder="상세 주소를 입력하세요"/>
                                </DetailField>
                            </div>
                        </DetailFormLayout>
                    </div>

                    <div className="mt-auto pt-6 flex gap-2">
                        {supplier.isNew ? (
                            <div className="w-full flex justify-center gap-2">
                                <DetailActions supplier={supplier} isEditing={isEditing} actions={actions} />
                            </div>
                        ) : (
                             <div className="w-full flex justify-end gap-2">
                                <DetailActions supplier={supplier} isEditing={isEditing} actions={actions} />
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <Placeholder text="공급업체를 선택하거나 '추가' 버튼으로 신규 등록하세요." />
            )}
        </div>
    );
});

const SupplierSearch = memo(({ params, onChange, onSearch }) => (
    <SearchLayout>
        <SearchField label="공급업체명">
            <SearchInput
                type="text"
                name="supplierName"
                value={params.supplierName}
                onChange={onChange}
                onKeyPress={(e) => e.key === 'Enter' && onSearch(params)}
                placeholder="공급업체명 입력"
            />
        </SearchField>
        <SearchField label="등록날짜">
            <SearchInput type="date" name="contractDate" value={params.contractDate} onChange={onChange} />
        </SearchField>
    </SearchLayout>
));

// =================================================================================
// ✨ 5. Main Page Component
// =================================================================================

export default function SupplierRegister() {
    const { suppliers, selectedSupplier, isEditing, isLoading, message, searchParams, actions } = useSupplierManagement();

    const gridColumns = [
        { header: "No", accessor: "no" },
        { header: "공급업체명", accessor: "supplierName" },
        { header: "담당자", accessor: "contactName" },
        { header: "등록날짜", accessor: "contractDate" },
    ];

    return (
        <UILayout>
            <Header title="공급업체 등록" />
            <SupplierSearch
                params={searchParams}
                onChange={actions.handleSearchChange}
                onSearch={() => actions.loadSuppliers(searchParams)}
            />
            <MessageBox message={message} />
            <MainLayout>
                <LeftPanel>
                    <SupplierGrid
                        columns={gridColumns}
                        data={suppliers}
                        onRowClick={actions.handleRowClick}
                        selectedItem={selectedSupplier}
                        isLoading={isLoading}
                        onSearch={() => actions.loadSuppliers(searchParams)}
                        onReset={actions.handleResetSearch}
                        onInsert={actions.handleInsert}
                    />
                </LeftPanel>
                <RightPanel>
                    <SupplierDetails
                        supplier={selectedSupplier}
                        isEditing={isEditing}
                        actions={actions}
                    />
                </RightPanel>
            </MainLayout>
        </UILayout>
    );
}