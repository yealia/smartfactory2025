import { useEffect, useState } from "react";
import axios from "axios";

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
        <input {...props} className="w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500" />
    </div>
);

const SearchButton = ({ onClick, children }) => (
    <button onClick={onClick} className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg shadow-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
        {children}
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

// 동기화 버튼 UI 컴포넌트 추가 (재사용 가능)
const SyncButton = ({ onClick }) => (
    <button onClick={onClick} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg shadow-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M15.312 11.227c.452.452.452 1.186 0 1.638l-2.083 2.083a1.156 1.156 0 01-1.637 0l-2.083-2.083a1.156 1.156 0 010-1.638l2.083-2.083a1.156 1.156 0 011.637 0l2.083 2.083zM4.688 3.121a1.156 1.156 0 011.637 0l2.083 2.083a1.156 1.156 0 010 1.638L6.325 8.925a1.156 1.156 0 01-1.637 0L2.605 6.842a1.156 1.156 0 010-1.638l2.083-2.083z" clipRule="evenodd" /><path d="M11.227 4.688a1.156 1.156 0 010 1.637L9.144 8.408a1.156 1.156 0 01-1.638 0L3.12 3.944a1.156 1.156 0 011.638-1.637l.002.002 4.384 4.384.002-.002a1.156 1.156 0 011.089.197zM8.773 15.312a1.156 1.156 0 010-1.637l2.083-2.083a1.156 1.156 0 011.638 0l4.384 4.384a1.156 1.156 0 01-1.638 1.637l-.002-.002-4.384-4.384-.002.002a1.156 1.156 0 01-1.089-.197z" /></svg>
        MES 동기화
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
                            const isSelected = selectedItem && ((row._tempId && row._tempId === selectedItem._tempId) || (row.inventoryId && row.inventoryId === selectedItem.inventoryId));
                            return (
                                <tr key={row.inventoryId || row._tempId} onClick={() => onRowClick(row)} className={`cursor-pointer ${isSelected ? 'bg-sky-100' : 'hover:bg-gray-50'}`}>
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

const detailLabelStyle = "block text-sm font-medium text-gray-700 mb-1";
const detailInputStyle = "w-full rounded-lg border border-gray-300 shadow-sm px-3 py-2 focus:ring-2 focus:ring-sky-400 focus:border-sky-500 outline-none transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed";

export default function InventoryPage() {
    const [inventories, setInventories] = useState([]);
    const [selectedInventory, setSelectedInventory] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [searchInventoryId, setSearchInventoryId] = useState("");
    const [searchMaterialId, setSearchMaterialId] = useState("");
    const [err, setErr] = useState("");

    const API_BASE = "http://localhost:8081/api/inventory";

    const columns = [
        { header: "재고ID", accessor: "inventoryId" },
        { header: "자재ID", accessor: "materialId" },
        { header: "창고", accessor: "warehouse" },
        { header: "위치", accessor: "location" },
        { header: "현재고", accessor: "onHand" },
        // { header: "현재고(자재쪽)", accessor: "materialCurrentStock" }, {/*  자재쪽 현재고 임의로 불러옴 */}
    ];


    useEffect(() => {
        loadInventory();
    }, []);

    const loadInventory = async () => {
        setErr("");
        try {
            const params = {
                inventoryId: searchInventoryId || undefined,
                materialId: searchMaterialId || undefined,
            };
            const { data } = await axios.get(API_BASE, { params });
            setInventories(data || []);
            setSelectedInventory(data.length > 0 ? data[0] : null);
            setIsEditing(false);
        } catch (e) {
            console.error("재고 조회 실패", e);
            setErr("재고 목록 조회에 실패했습니다.");
        }
    };

    const handleRowClick = (row) => {
        // 기존 수정 로직 (isEditing)을 유지하며 새로운 isNew 로직 추가
        const hasUnsavedNew = inventories.some(inv => inv.isNew && inv._tempId !== row._tempId);
        if (hasUnsavedNew) {
            if (window.confirm("저장되지 않은 신규 항목이 있습니다. 이동하시겠습니까?")) {
                setInventories(prev => prev.filter(inv => !inv.isNew));
            } else {
                return;
            }
        }
        setSelectedInventory(row);
        setIsEditing(!!row.isNew);
    };

    const handleInsert = () => {
        // 이미 신규 항목이 있을 경우 알림
        if (inventories.some(inv => inv.isNew)) {
            alert("이미 추가된 신규 항목이 있습니다. 먼저 저장하거나 다른 항목을 선택하세요.");
            return;
        }
        
        const tempId = `new_${Date.now()}`;
        const newInventory = {
            _tempId: tempId,
            isNew: true,
            inventoryId: null,
            materialId: "",
            warehouse: "",
            location: "",
            onHand: 0,
            reservedQty: 0,
            safetyStock: 0,
            reorderPoint: 0,
            remark: "",
        };
        setIsEditing(true);
        setInventories(prev => [newInventory, ...prev]);
        setSelectedInventory(newInventory);
    };

    const handleSave = async () => {
        if (!selectedInventory) {
            alert("저장할 항목을 선택하세요.");
            return;
        }

        const { _tempId, isNew, ...payload } = selectedInventory;
        
        if (payload.materialId === null || payload.materialId === "") {
            alert("자재 ID는 필수 입력 항목입니다.");
            return;
        }

        try {
            if (isNew) {
                // 신규 생성 (POST)
                const response = await axios.post(API_BASE, payload);
                alert("신규 재고가 성공적으로 등록되었습니다.");
            } else {
                // 기존 수정 (PUT)
                const response = await axios.put(`${API_BASE}/${payload.inventoryId}`, payload);
                alert("재고 정보가 성공적으로 수정되었습니다.");
            }
            loadInventory();
        } catch (error) {
            console.error("저장 실패:", error);
            alert(`저장 중 오류가 발생했습니다: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleDelete = async () => {
        if (!selectedInventory || selectedInventory.isNew) {
            alert("삭제할 기존 재고 항목을 선택하세요.");
            return;
        }
        if (window.confirm(`[${selectedInventory.inventoryId}] 재고 정보를 정말 삭제하시겠습니까?`)) {
            try {
                await axios.delete(`${API_BASE}/${selectedInventory.inventoryId}`);
                alert("성공적으로 삭제되었습니다.");
                loadInventory();
            } catch (error) {
                console.error("삭제 실패:", error);
                alert(`삭제 중 오류가 발생했습니다: ${error.response?.data?.message || error.message}`);
            }
        }
    };
    
    const updateSelectedField = (field, value) => {
        if (!selectedInventory) return;
        
        const updatedInventory = { ...selectedInventory, [field]: value };
        setSelectedInventory(updatedInventory);

        setInventories(prev => prev.map(inv => 
            (inv.inventoryId === updatedInventory.inventoryId && inv.inventoryId != null) || (inv._tempId === updatedInventory._tempId)
            ? updatedInventory 
            : inv
        ));
    };

    //  MES 동기화를 처리하는 함수 추가
    const handleSyncFromMes = async () => {
        if (!window.confirm("MES 품질검사 완료 내역을 가져와 재고에 반영하시겠습니까?")) {
            return;
        }
        try {
            const response = await axios.post("http://localhost:8081/api/sync/from-mes");
            alert(response.data); // "MES 데이터 동기화가 완료되었습니다."
            await loadInventory(); // 동기화 후 재고 목록을 새로고침하여 변경사항 확인
        } catch (error) {
            console.error("MES 동기화 실패:", error);
            alert(`동기화 중 오류가 발생했습니다: ${error.response?.data?.message || error.message}`);
        }
    };

    const isFieldEditable = () => selectedInventory?.isNew || isEditing;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h2 className="font-bold text-2xl mb-6 text-gray-800">재고 등록</h2>
            
            <SearchLayout>
                <SearchTextBox
                    label="재고 ID"
                    value={searchInventoryId}
                    onChange={(e) => setSearchInventoryId(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && loadInventory()}
                />
                <SearchTextBox
                    label="자재 ID"
                    value={searchMaterialId}
                    onChange={(e) => setSearchMaterialId(e.target.value)}
                    type="number"
                    onKeyPress={(e) => e.key === 'Enter' && loadInventory()}
                />
                <div className="flex items-end space-x-2 pt-6">
                    <SearchButton onClick={loadInventory}>조회</SearchButton>
                    <InsertButton onClick={handleInsert} />
                    <SyncButton onClick={handleSyncFromMes} />
                </div>
            </SearchLayout>

            {err && <div className="mt-4 text-red-600">{err}</div>}
            
            <div className="flex flex-col md:flex-row gap-4 mt-4">
                <div className="w-full md:w-1/2">
                    <BodyGrid
                        columns={columns}
                        data={inventories}
                        onRowClick={handleRowClick}
                        selectedItem={selectedInventory}
                    />
                </div>
                <div className="w-full md:w-1/2 p-6 bg-white rounded-2xl shadow-lg">
                    {selectedInventory ? (
                        <>
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="text-xl font-semibold text-gray-800">재고 상세정보</h3>
                                <div className="flex gap-x-2">
                                    {isFieldEditable() && <SaveButton onClick={handleSave} />}
                                    {!selectedInventory.isNew && !isEditing && (
                                        <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg shadow-md hover:bg-yellow-600">수정</button>
                                    )}
                                    {!selectedInventory.isNew && (
                                        <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700">삭제</button>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={detailLabelStyle}>재고 ID</label>
                                    <input type="text" value={selectedInventory.inventoryId || "신규 자동생성"} readOnly className={`${detailInputStyle} bg-gray-100`} />
                                </div>
                                <div>
                                    <label className={detailLabelStyle}>자재 ID <span className="text-red-500">*</span></label>
                                    <input type="number" value={selectedInventory.materialId || ""} onChange={(e) => updateSelectedField("materialId", e.target.value ? Number(e.target.value) : "")} className={detailInputStyle} disabled={!isFieldEditable()} />
                                </div>
                                <div>
                                    <label className={detailLabelStyle}>창고</label>
                                    <input type="text" value={selectedInventory.warehouse || ""} onChange={(e) => updateSelectedField("warehouse", e.target.value)} className={detailInputStyle} disabled={!isFieldEditable()} />
                                </div>
                                <div>
                                    <label className={detailLabelStyle}>위치</label>
                                    <input type="text" value={selectedInventory.location || ""} onChange={(e) => updateSelectedField("location", e.target.value)} className={detailInputStyle} disabled={!isFieldEditable()} />
                                </div>
                                <div>
                                    <label className={detailLabelStyle}>현재고</label>
                                    <input type="number" value={selectedInventory.onHand || 0} onChange={(e) => updateSelectedField("onHand", Number(e.target.value))} className={detailInputStyle} disabled={!isFieldEditable()} />
                                </div>
                {/* ==============  자재쪽 현재고 임의로 불러옴 */}
                                {/* <div>
                                    <label className={detailLabelStyle}>현재고(자재 관리..)</label>
                                    <input type="number"
                                           value={selectedInventory.materialCurrentStock ?? 0}
                                           readOnly
                                           className={`${detailInputStyle} bg-gray-100`} />
                                </div> */}
                                <div>
                                    <label className={detailLabelStyle}>예약수량</label>
                                    <input type="number" value={selectedInventory.reservedQty || 0} onChange={(e) => updateSelectedField("reservedQty", Number(e.target.value))} className={detailInputStyle} disabled={!isFieldEditable()} />
                                </div>
                                <div>
                                    <label className={detailLabelStyle}>안전재고</label>
                                    <input type="number" value={selectedInventory.safetyStock || 0} onChange={(e) => updateSelectedField("safetyStock", Number(e.target.value))} className={detailInputStyle} disabled={!isFieldEditable()} />
                                </div>
                                <div>
                                    <label className={detailLabelStyle}>재주문점</label>
                                    <input type="number" value={selectedInventory.reorderPoint || 0} onChange={(e) => updateSelectedField("reorderPoint", Number(e.target.value))} className={detailInputStyle} disabled={!isFieldEditable()} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className={detailLabelStyle}>비고</label>
                                    <textarea value={selectedInventory.remark || ""} onChange={(e) => updateSelectedField("remark", e.target.value)} className={detailInputStyle} disabled={!isFieldEditable()} rows={3}></textarea>
                                </div>
                            </div>
                        </>
                    ) : (
                         <div className="flex items-center justify-center h-full text-gray-500">
                            <p>재고를 선택하거나 '행추가' 버튼으로 신규 등록하세요.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}