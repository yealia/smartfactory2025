/*
메뉴명 : 공급업체 등록 
*/
import { useEffect, useState } from "react";
import axios from "axios";

// API 기본 주소
const API_BASE = "http://localhost:8081/api/suppliers";

// ===================================================================
// UI 컴포넌트 정의 (별도 파일 대신 여기에 포함)
// ===================================================================

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
                        data.map((row) => {
                            // 선택된 항목인지 비교 (신규/기존 항목 모두 처리)
                            const isSelected = selectedItem && ((row._tempId && row._tempId === selectedItem._tempId) || (row.supplierId && row.supplierId === selectedItem.supplierId));
                            return (
                                <tr key={row.supplierId || row._tempId} onClick={() => onRowClick(row)} className={`cursor-pointer ${isSelected ? 'bg-sky-100' : 'hover:bg-gray-50'}`}>
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

// ===================================================================
// 메인 컴포넌트
// ===================================================================

/*자주 쓰는 스타일*/
const supplierDetailLabel = "block text-sm font-medium text-gray-700 mb-1";
const detailTextBox = "w-full rounded-lg border border-gray-300 shadow-sm px-3 py-2 focus:ring-2 focus:ring-sky-400 focus:border-sky-500 outline-none transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed";

export default function SupplierRegister() {
    //상태 관리
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [searchSupplierName, setSearchSupplierName] = useState("");
    const [searchContractDate, setSearchContractDate] = useState("");

    // 최초 렌더링 시 목록 조회
    useEffect(() => {
        loadSuppliers();
    }, []);

    // 공급업체 목록 조회 (검색 포함)
    const loadSuppliers = async () => {
        try {
            const { data } = await axios.get(API_BASE, {
                params: {
                    supplierName: searchSupplierName || undefined,
                    contractDate: searchContractDate || undefined,
                }
            });
            setSuppliers(data);
            if (data.length > 0) {
                setSelectedSupplier(data[0]);
            } else {
                setSelectedSupplier(null);
            }
            setIsEditing(false); // 조회 후 수정 모드 해제
        } catch (err) {
            console.error("공급업체 목록 조회 실패", err);
            alert("목록을 불러오는 중 오류가 발생했습니다.");
        }
    };

    // 행 추가 (신규 공급업체)
    const handleInsert = () => {
        const tempId = `new_${Date.now()}`;
        const newSupplier = {
            supplierId: null, // 새 항목은 ID가 없음
            supplierName: "",
            contractDate: new Date().toISOString().slice(0, 10),
            contactName: "",
            contactPhone: "",
            contactEmail: "",
            contactAddress: "",
            isNew: true, // 신규 행임을 구분하는 플래그
            _tempId: tempId, // 상태 업데이트를 위한 임시 고유 ID
        };
        setIsEditing(true); // 새 행은 바로 수정 모드로 진입
        setSuppliers(prev => [newSupplier, ...prev]);
        setSelectedSupplier(newSupplier);
    };

    // 상세 정보 입력 필드 값 변경 핸들러
    const updateSupplierField = (field, value) => {
        if (!selectedSupplier) return;
        const updatedSupplier = { ...selectedSupplier, [field]: value };
        setSelectedSupplier(updatedSupplier);
    
        // 그리드 목록의 상태도 실시간으로 동기화
        setSuppliers(prev =>
            prev.map(s => {
                if (s._tempId && s._tempId === updatedSupplier._tempId) return updatedSupplier;
                if (s.supplierId && s.supplierId === updatedSupplier.supplierId) return updatedSupplier;
                return s;
            })
        );
    };
    
    // 신규 항목 저장 (Bulk)
    const handleSaveNew = async () => {
        const newSuppliers = suppliers.filter(s => s.isNew && s.supplierName); // 이름이 있는 신규 항목만
        if (newSuppliers.length === 0) {
            alert("저장할 신규 항목이 없습니다. 공급업체명을 입력해주세요.");
            return;
        }

        try {
            // ✅ Controller와 일치하도록 `/bulk` 엔드포인트 사용
            await axios.post(`${API_BASE}/bulk`, newSuppliers);
            alert("신규 공급업체가 성공적으로 저장되었습니다.");
            loadSuppliers(); // 저장 후 목록 새로고침
        } catch (err) {
            console.error("신규 저장 실패", err);
            alert("저장 중 오류가 발생했습니다.");
        }
    };
    
    // 기존 항목 수정
    const handleUpdate = async () => {
        if (!selectedSupplier || selectedSupplier.isNew) {
            alert("수정할 기존 항목을 선택하세요.");
            return;
        }
        if (!isEditing) {
            setIsEditing(true); // '수정' 버튼 클릭 시 수정 모드로 전환
            return;
        }

        // '수정 완료' 버튼 클릭 시 API 호출
        try {
            // ✅ Controller와 일치하도록 PUT 메서드와 ID를 포함한 URL 사용
            await axios.put(`${API_BASE}/${selectedSupplier.supplierId}`, selectedSupplier);
            alert("수정되었습니다.");
            setIsEditing(false);
            // 목록을 다시 로드하여 변경사항 확인
            const currentId = selectedSupplier.supplierId;
            await loadSuppliers();
            // 수정했던 항목을 다시 선택
            setSuppliers(prev => {
                const updatedItem = prev.find(s => s.supplierId === currentId);
                setSelectedSupplier(updatedItem || (prev.length > 0 ? prev[0] : null));
                return prev;
            });
        } catch(err) {
            console.error("수정 실패:", err);
            alert("수정 중 오류가 발생했습니다.");
        }
    }
    
    // 공급업체 삭제
    const handleDelete = async () => {
        if (!selectedSupplier || !selectedSupplier.supplierId) {
            alert("삭제할 항목을 선택하세요.");
            return;
        }
        
        const { supplierId, supplierName } = selectedSupplier;
        
        if (!window.confirm(`'${supplierName}' 공급업체를 정말 삭제하시겠습니까?`)) return;
        
        try {
            // ✅ Controller와 일치하도록 DELETE 메서드 사용
            await axios.delete(`${API_BASE}/${supplierId}`);
            alert("삭제되었습니다.");
            loadSuppliers(); // 삭제 후 목록 새로고침
        } catch (err) {
            console.error("삭제 오류", err);
            alert(`삭제 중 오류가 발생했습니다.`);
        }
    }

    // 그리드 행 클릭 핸들러
    const handleRowClick = (row) => {
        const hasNewUnsaved = suppliers.some(s => s.isNew);
        if (hasNewUnsaved && !row.isNew) {
            if (window.confirm("저장하지 않은 신규 항목이 있습니다. 정말 이동하시겠습니까?")) {
                setSuppliers(prev => prev.filter(s => !s.isNew));
            } else {
                return; // 이동 취소
            }
        }
        setSelectedSupplier(row);
        setIsEditing(!!row.isNew); // 신규 행은 바로 수정 모드, 기존 행은 보기 모드
    }

    const columns = [
        { header: "공급업체명", accessor: "supplierName", width: "200px" },
        { header: "담당자", accessor: "contactName", width: "120px" },
        { header: "등록날짜", accessor: "contractDate", width: "150px" },
    ];
    
    const isFieldEditable = () => selectedSupplier?.isNew || isEditing;
    
    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">공급업체 등록</h2>
            <SearchLayout>
                <SearchTextBox 
                    label="공급업체명"
                    value={searchSupplierName}
                    onChange={(e) => setSearchSupplierName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && loadSuppliers()}
                />
                <SearchDatePicker 
                    label="등록날짜"
                    value={searchContractDate}
                    onChange={(e) => setSearchContractDate(e.target.value)}
                />
                <div className="flex items-end space-x-2 pt-6">
                    <SearchButton onClick={loadSuppliers} />
                    <InsertButton onClick={handleInsert} />
                    <SaveButton onClick={handleSaveNew} />
                </div>
            </SearchLayout>

            <div className="flex flex-col md:flex-row gap-4 mt-4">
                <div className="w-full md:w-[35%]">
                    <BodyGrid
                        columns={columns}
                        data={suppliers}
                        onRowClick={handleRowClick}
                        selectedItem={selectedSupplier}
                    />
                </div>
                <div className="border w-full md:w-[65%] rounded-2xl shadow-lg p-6 bg-white">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-xl font-semibold text-gray-800">공급업체 상세정보</h3>
                        {selectedSupplier && !selectedSupplier.isNew && (
                            <div className="flex gap-x-2">
                                <button
                                    type="button"
                                    onClick={handleUpdate}
                                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {isEditing ? "수정 완료" : "수정"}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    삭제
                                </button>
                            </div>
                        )}
                    </div>

                    {selectedSupplier ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div className="md:col-span-1">
                                <label className={supplierDetailLabel}>공급업체명 <span className="text-red-500">*</span></label>
                                <input type="text" value={selectedSupplier.supplierName || ""}
                                    onChange={(e) => updateSupplierField("supplierName", e.target.value)}
                                    className={detailTextBox}
                                    disabled={!isFieldEditable()}
                                />
                            </div>
                            <div>
                                <label className={supplierDetailLabel}>등록날짜</label>
                                <input type="date" value={selectedSupplier.contractDate || ""}
                                    onChange={(e) => updateSupplierField("contractDate", e.target.value)}
                                    className={detailTextBox}
                                    disabled={!isFieldEditable()}
                                />
                            </div>
                            <div>
                                <label className={supplierDetailLabel}>담당자명</label>
                                <input type="text" value={selectedSupplier.contactName || ""}
                                    onChange={(e) => updateSupplierField("contactName", e.target.value)}
                                    className={detailTextBox}
                                    disabled={!isFieldEditable()}
                                />
                            </div>
                            <div>
                                <label className={supplierDetailLabel}>연락처</label>
                                <input type="text" value={selectedSupplier.contactPhone || ""}
                                    onChange={(e) => updateSupplierField("contactPhone", e.target.value)}
                                    className={detailTextBox}
                                    disabled={!isFieldEditable()}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className={supplierDetailLabel}>E-mail</label>
                                <input type="email" value={selectedSupplier.contactEmail || ""}
                                    onChange={(e) => updateSupplierField("contactEmail", e.target.value)}
                                    className={detailTextBox}
                                    disabled={!isFieldEditable()}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className={supplierDetailLabel}>주소</label>
                                <input type="text" value={selectedSupplier.contactAddress || ""}
                                    onChange={(e) => updateSupplierField("contactAddress", e.target.value)}
                                    className={detailTextBox}
                                    disabled={!isFieldEditable()}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                           <p>공급업체를 선택하거나 '행추가' 버튼으로 신규 등록하세요.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}