/*
메뉴명 : 자재 등록 
*/
import { useEffect, useState } from "react";
import axios from "axios";

// API 기본 주소
const API_BASE = "http://localhost:8081/api/materials";

// ===================================================================
// UI 컴포넌트 (별도 파일 대신 여기에 포함)
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
                            <th key={index} scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data && data.length > 0 ? (
                        data.map((row) => {
                            const isSelected = selectedItem && ((row._tempId && row._tempId === selectedItem._tempId) || (row.materialId && row.materialId === selectedItem.materialId));
                            return (
                                <tr key={row.materialId || row._tempId} onClick={() => onRowClick(row)} className={`cursor-pointer ${isSelected ? 'bg-sky-100' : 'hover:bg-gray-50'}`}>
                                    {columns.map((col) => (
                                        <td key={col.accessor} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
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

/* 자주 쓰는 스타일 */
const materialDetailLabel = "block text-sm font-medium text-gray-700 mb-1";
const detailTextBox = "w-full rounded-lg border border-gray-300 shadow-sm px-3 py-2 focus:ring-2 focus:ring-sky-400 focus:border-sky-500 outline-none transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed";

export default function MaterialRegister() {
    // --- 상태 관리 ---
    const [materials, setMaterials] = useState([]);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    
    // 조회 조건
    const [searchMaterialNm, setSearchMaterialNm] = useState("");
    const [searchCategory, setSearchCategory] = useState("");

    // --- 데이터 로딩 ---
    useEffect(() => {
        loadMaterials();
    }, []);

    const loadMaterials = async () => {
        try {
            const { data } = await axios.get(API_BASE, {
                params: {
                    materialNm: searchMaterialNm || undefined,
                    category: searchCategory || undefined,
                }
            });
            setMaterials(data);
            if (data.length > 0) {
                setSelectedMaterial(data[0]);
            } else {
                setSelectedMaterial(null);
            }
            setIsEditing(false); // 조회 후 수정 모드 초기화
        } catch (err) {
            console.error("자재 목록 조회 실패:", err);
            alert("자재 목록을 불러오는 중 오류가 발생했습니다.");
        }
    };
    
    // --- 버튼 핸들러 ---
    const handleInsert = () => {
        const tempId = `new_${Date.now()}`;
        const newMaterial = {
            _tempId: tempId,
            isNew: true,
            materialId: null,
            materialNm: "",
            category: "",
            specification: "",
            unit: "",
            unitPrice: 0,
            currentPrice: 0,
            minStockQuantity: 0,
            maxStockQuantity: 0,
            currentStock: 0,
            leadTime: 0,
            supplierId: "", // 초기값 null 대신 ""
            lastPurchaseDate: null,
            status: 0,
            warehouse: "",
            location: "",
            remark: "",
        };
        setIsEditing(true);
        setMaterials(prev => [newMaterial, ...prev]);
        setSelectedMaterial(newMaterial);
    };

    // ✅ [수정] 신규 자재들만 저장하는 로직으로 변경
    const handleSaveNewItems = async () => {
        const newMaterials = materials.filter(m => m.isNew && m.materialNm);
        if (newMaterials.length === 0) {
            alert("저장할 신규 자재가 없습니다. 자재명은 필수입니다.");
            return;
        }

        try {
            // ✅ Controller의 POST /api/materials 에 맞춰 개별 등록 요청을 병렬로 처리
            const savePromises = newMaterials.map(material => {
                const { _tempId, isNew, ...payload } = material; // 임시 데이터 제거
                return axios.post(API_BASE, payload);
            });
            await Promise.all(savePromises);
            
            alert(`${newMaterials.length}개의 신규 자재가 성공적으로 저장되었습니다.`);
            loadMaterials();
        } catch (err) {
            console.error("신규 자재 저장 실패:", err);
            alert("신규 자재 저장 중 오류가 발생했습니다.");
        }
    };

    // ✅ [수정] 기존 자재 수정 로직으로 변경
    const handleUpdate = async () => {
        if (!selectedMaterial || selectedMaterial.isNew) {
            alert("수정할 기존 자재를 선택해주세요.");
            return;
        }

        if (!isEditing) {
            setIsEditing(true); // '수정' -> 수정 모드로 전환
            return;
        }

        // '수정 완료' -> 서버로 데이터 전송
        try {
            // ✅ Controller의 PUT /api/materials/{id} 에 맞춰 수정 요청
            const { _tempId, isNew, ...payload } = selectedMaterial;
            await axios.put(`${API_BASE}/${payload.materialId}`, payload);
            alert("자재 정보가 성공적으로 수정되었습니다.");
            setIsEditing(false);
            
            // 수정 후 목록을 새로고침하여 최신 데이터 반영
            const currentId = selectedMaterial.materialId;
            await loadMaterials();
            
            // 수정했던 항목을 다시 선택하도록 처리
            setMaterials(prev => {
                const updatedItem = prev.find(m => m.materialId === currentId);
                setSelectedMaterial(updatedItem || (prev.length > 0 ? prev[0] : null));
                return prev;
            });

        } catch (err) {
            console.error("수정 실패:", err);
            alert("수정 중 오류가 발생했습니다.");
        }
    };

    // ✅ [수정] 현재 선택된 항목을 기준으로 삭제하도록 로직 안정화
    const handleDelete = async () => {
        if (!selectedMaterial || !selectedMaterial.materialId) {
            alert("삭제할 자재를 선택해주세요.");
            return;
        }

        const { materialId, materialNm } = selectedMaterial;
        if (window.confirm(`[${materialNm}] 자재를 정말 삭제하시겠습니까?`)) {
            try {
                // ✅ Controller의 DELETE /api/materials/{id} 에 맞춰 삭제 요청
                await axios.delete(`${API_BASE}/${materialId}`);
                alert("삭제되었습니다.");
                loadMaterials();
            } catch (err) {
                console.error("삭제 오류:", err);
                alert("삭제 중 오류가 발생했습니다.");
            }
        }
    };

    // ✅ [개선] 미저장 데이터 경고 로직 추가
    const handleRowClick = (row) => {
        const hasUnsavedNew = materials.some(m => m.isNew);
        if (hasUnsavedNew && !row.isNew) {
            if(window.confirm("저장되지 않은 신규 항목이 있습니다. 이동하시겠습니까?")) {
                setMaterials(prev => prev.filter(m => !m.isNew));
            } else {
                return; // 이동 취소
            }
        }
        setSelectedMaterial(row);
        setIsEditing(!!row.isNew);
    };

    const updateMaterialField = (field, value) => {
        if (!selectedMaterial) return;
        const updatedSelected = { ...selectedMaterial, [field]: value };
        setSelectedMaterial(updatedSelected);

        setMaterials(prev =>
            prev.map(m => {
                if (m._tempId && m._tempId === updatedSelected._tempId) return updatedSelected;
                if (m.materialId && m.materialId === updatedSelected.materialId) return updatedSelected;
                return m;
            })
        );
    };
    
    // ✅ 1. 표에 보일 컬럼 수정
    const columns = [
        { header: "자재명", accessor: "materialNm" },
        { header: "자재분류", accessor: "category" },
        { header: "단위", accessor: "unit" },
    ];
    
    const isFieldEditable = () => selectedMaterial?.isNew || isEditing;

    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">자재 등록</h2>
            <SearchLayout>
                <SearchTextBox 
                    label="자재명"
                    value={searchMaterialNm}
                    onChange={(e) => setSearchMaterialNm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && loadMaterials()}
                />
                <SearchTextBox 
                    label="자재분류"
                    value={searchCategory}
                    onChange={(e) => setSearchCategory(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && loadMaterials()}
                />
                <div className="flex items-end space-x-2 pt-6">
                    <SearchButton onClick={loadMaterials} />
                    <InsertButton onClick={handleInsert} />
                    <SaveButton onClick={handleSaveNewItems} />
                </div>
            </SearchLayout>

            <div className="flex flex-col md:flex-row gap-4 mt-4">
                {/* ✅ 2. 그리드(왼쪽) 너비 조정 (35%) */}
                <div className="w-full md:w-[35%]">
                    <BodyGrid
                        columns={columns}
                        data={materials}
                        onRowClick={handleRowClick}
                        selectedItem={selectedMaterial}
                    />
                </div>
                
                {/* ✅ 2. 상세정보 카드(오른쪽) 너비 조정 (65%) 및 스타일 통일 */}
                <div className="border w-full md:w-[65%] rounded-2xl shadow-lg p-6 bg-white">
                    {selectedMaterial ? (
                        <>
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="text-xl font-semibold text-gray-800">자재 상세정보</h3>
                                {/* ✅ 신규 항목이 아닐 경우에만 수정/삭제 버튼 표시 */}
                                {!selectedMaterial.isNew && (
                                    <div className="flex gap-x-2">
                                        <button type="button" onClick={handleUpdate}
                                            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none"
                                        >
                                            {isEditing ? "수정 완료" : "수정"}
                                        </button>
                                        <button type="button" onClick={handleDelete}
                                            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none"
                                        >
                                            삭제
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className={materialDetailLabel}>자재ID</label>
                                    <input type="text" value={selectedMaterial.materialId || "신규"} readOnly className={`${detailTextBox} bg-gray-100`} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className={materialDetailLabel}>자재명 <span className="text-red-500">*</span></label>
                                    <input type="text" value={selectedMaterial.materialNm || ""}
                                        onChange={(e) => updateMaterialField("materialNm", e.target.value)}
                                        className={detailTextBox} disabled={!isFieldEditable()} />
                                </div>
                                <div>
                                    <label className={materialDetailLabel}>자재분류</label>
                                    <input type="text" value={selectedMaterial.category || ""}
                                        onChange={(e) => updateMaterialField("category", e.target.value)}
                                        className={detailTextBox} disabled={!isFieldEditable()} />
                                </div>
                                <div>
                                    <label className={materialDetailLabel}>단위</label>
                                    <input type="text" value={selectedMaterial.unit || ""}
                                        onChange={(e) => updateMaterialField("unit", e.target.value)}
                                        className={detailTextBox} disabled={!isFieldEditable()} />
                                </div>
                                <div>
                                    <label className={materialDetailLabel}>공급업체 ID</label>
                                    <input type="number" value={selectedMaterial.supplierId || ""}
                                        onChange={(e) => updateMaterialField("supplierId", e.target.value ? Number(e.target.value) : null)}
                                        className={detailTextBox} disabled={!isFieldEditable()} />
                                </div>
                                <div className="md:col-span-3">
                                    <label className={materialDetailLabel}>규격</label>
                                    <input type="text" value={selectedMaterial.specification || ""}
                                        onChange={(e) => updateMaterialField("specification", e.target.value)}
                                        className={detailTextBox} disabled={!isFieldEditable()} />
                                </div>
                                <div>
                                    <label className={materialDetailLabel}>기준단가</label>
                                    <input type="number" value={selectedMaterial.unitPrice || 0}
                                        onChange={(e) => updateMaterialField("unitPrice", Number(e.target.value))}
                                        className={detailTextBox} disabled={!isFieldEditable()} />
                                </div>
                                <div>
                                    <label className={materialDetailLabel}>현재단가</label>
                                    <input type="number" value={selectedMaterial.currentPrice || 0}
                                        onChange={(e) => updateMaterialField("currentPrice", Number(e.target.value))}
                                        className={detailTextBox} disabled={!isFieldEditable()} />
                                </div>
                                <div>
                                    <label className={materialDetailLabel}>리드타임(일)</label>
                                    <input type="number" value={selectedMaterial.leadTime || 0}
                                        onChange={(e) => updateMaterialField("leadTime", Number(e.target.value))}
                                        className={detailTextBox} disabled={!isFieldEditable()} />
                                </div>
                                <div className="md:col-span-3 grid grid-cols-3 gap-4">
                                    <div>
                                        <label className={materialDetailLabel}>최소재고</label>
                                        <input type="number" value={selectedMaterial.minStockQuantity || 0}
                                            onChange={(e) => updateMaterialField("minStockQuantity", Number(e.target.value))}
                                            className={detailTextBox} disabled={!isFieldEditable()} />
                                    </div>
                                    <div>
                                        <label className={materialDetailLabel}>최대재고</label>
                                        <input type="number" value={selectedMaterial.maxStockQuantity || 0}
                                            onChange={(e) => updateMaterialField("maxStockQuantity", Number(e.target.value))}
                                            className={detailTextBox} disabled={!isFieldEditable()} />
                                    </div>
                                    <div>
                                        <label className={materialDetailLabel}>현재고</label>
                                        <input type="number" value={selectedMaterial.currentStock || 0}
                                            onChange={(e) => updateMaterialField("currentStock", Number(e.target.value))}
                                            className={detailTextBox} disabled={!isFieldEditable()} />
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className={materialDetailLabel}>창고</label>
                                    <input type="text" value={selectedMaterial.warehouse || ""}
                                        onChange={(e) => updateMaterialField("warehouse", e.target.value)}
                                        className={detailTextBox} disabled={!isFieldEditable()} />
                                </div>
                                <div>
                                    <label className={materialDetailLabel}>위치</label>
                                    <input type="text" value={selectedMaterial.location || ""}
                                        onChange={(e) => updateMaterialField("location", e.target.value)}
                                        className={detailTextBox} disabled={!isFieldEditable()} />
                                </div>
                                <div className="md:col-span-3">
                                    <label className={materialDetailLabel}>비고</label>
                                    <textarea value={selectedMaterial.remark || ""} rows={2}
                                        onChange={(e) => updateMaterialField("remark", e.target.value)}
                                        className={detailTextBox} disabled={!isFieldEditable()} />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                           <p>자재를 선택하거나 '행추가' 버튼으로 신규 등록하세요.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}