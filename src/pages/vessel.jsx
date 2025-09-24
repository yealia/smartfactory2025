import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// ===================================================================
// UI 컴포넌트 (자재 등록 메뉴 스타일)
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

const SearchButton = ({ onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled} className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg shadow-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 disabled:bg-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
        조회
    </button>
);

const InsertButton = ({ onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 disabled:bg-green-300">
       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
        행추가
    </button>
);

const SaveButton = ({ onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 disabled:bg-blue-300">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6a1 1 0 10-2 0v5.586l-1.293-1.293zM5 4a1 1 0 011-1h8a1 1 0 011 1v1a1 1 0 11-2 0V5H7v1a1 1 0 11-2 0V4z" /><path d="M3 9a2 2 0 012-2h10a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
        저장
    </button>
);

const BodyGrid = ({ columns, data = [], onRowClick, selectedItem }) => {
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
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="text-center py-4 text-gray-500">
                                데이터가 없습니다.
                            </td>
                        </tr>
                    ) : (
                        data.map((row) => {
                            const isSelected = selectedItem && ((row.isNew && row === selectedItem) || (row.vesselId && row.vesselId === selectedItem.vesselId));
                            return (
                                <tr key={row.vesselId || row._key} onClick={() => onRowClick(row)} className={`cursor-pointer ${isSelected ? 'bg-sky-100' : 'hover:bg-gray-50'}`}>
                                    {columns.map((col) => (
                                        <td key={col.accessor} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {row[col.accessor]}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
};

// ===================================================================
// 메인 컴포넌트
// ===================================================================

const API_BASE = "http://localhost:8081/api/vessels";
const detailLabel = "block text-sm font-medium text-gray-700 mb-1";
const detailTextBox = "w-full rounded-lg border border-gray-300 shadow-sm px-3 py-2 focus:ring-2 focus:ring-sky-400 focus:border-sky-500 outline-none transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed";

const STATUS_MAP = { 0: '계획', 1: '진행', 2: '완료' };
const getStatusText = (status) => STATUS_MAP[status] || '알 수 없음';

export default function Vessels() {
    const [vessels, setVessels] = useState([]);
    const [selectedVessel, setSelectedVessel] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [searchVesselId, setSearchVesselId] = useState("");
    const [searchVesselNm, setSearchVesselNm] = useState("");
    const [message, setMessage] = useState("");
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    
    const columns = [
        { header: "선박 ID", accessor: "vesselId" },
        { header: "선박명", accessor: "vesselNm" },
        { header: "프로젝트 ID", accessor: "projectId" },
        { header: "상태", accessor: "statusText" },
    ];

    useEffect(() => {
        loadVessels();
    }, []);

    const showMessage = (msg) => {
        setMessage(msg);
        setTimeout(() => setMessage(""), 3000);
    };

    const loadVessels = async (id = searchVesselId, name = searchVesselNm) => {
        setIsLoading(true);
        try {
            const { data } = await axios.get(API_BASE, {
                params: { vesselId: id || undefined, vesselNm: name || undefined },
            });
            setVessels(data);
            setSelectedVessel(data[0] || null);
            setIsEditing(false);
            setIsConfirmingDelete(false);
        } catch (err) {
            console.error("선박 목록 조회 실패:", err);
            showMessage("선박 목록 조회 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleInsert = () => {
        if(isEditing) {
            if(!window.confirm("작성 중인 내용이 있습니다. 저장하지 않고 새 항목을 추가하시겠습니까?")) {
                return;
            }
        }
        const newVessel = {
            isNew: true, _key: `new_${Date.now()}`, vesselId: "", vesselNm: "", vesselType: "", status: 0,
            vesselLength: 0, vesselBeam: 0, vesselDepth: 0, cargoCapacity: "", engineSpec: "",
            totalWeight: 0, actualDeliveryDate: "", projectId: "", remark: "",
        };
        setVessels(prev => [newVessel, ...prev.filter(v => !v.isNew)]);
        setSelectedVessel(newVessel);
        setIsEditing(true);
        setIsConfirmingDelete(false);
    };
    
    const handleSaveNewItems = async () => {
        const newVessels = vessels.filter(v => v.isNew);
        if (newVessels.length === 0) {
            showMessage("저장할 신규 선박이 없습니다.");
            return;
        }

        for(const vessel of newVessels) {
            if (!vessel.vesselId || !vessel.vesselNm || !vessel.vesselType) {
                showMessage("선박ID, 선박명, 선박유형은 필수입니다.");
                return;
            }
        }
        
        setIsLoading(true);
        try {
            const savePromises = newVessels.map(vessel => {
                const { isNew, _key, ...payload } = vessel;
                return axios.post(API_BASE, payload);
            });
            await Promise.all(savePromises);
            showMessage(`${newVessels.length}개의 신규 선박이 성공적으로 저장되었습니다.`);
            await loadVessels();
        } catch (err) {
            console.error("신규 저장 실패:", err);
            showMessage("신규 저장 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleUpdate = async () => {
        if (!selectedVessel || selectedVessel.isNew) {
            showMessage("수정할 기존 선박을 선택해주세요.");
            return;
        }

        if (!isEditing) {
            setIsEditing(true);
            return;
        }
        
        setIsLoading(true);
        try {
            await axios.put(`${API_BASE}/${selectedVessel.vesselId}`, selectedVessel);
            showMessage("선박 정보가 성공적으로 수정되었습니다.");
            setIsEditing(false);
            await loadVessels();
        } catch (err) {
            console.error("수정 실패:", err);
            showMessage("수정 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = () => {
        if (!selectedVessel || selectedVessel.isNew || !selectedVessel.vesselId) {
            showMessage("삭제할 선박을 선택해주세요.");
            return;
        }
        setIsConfirmingDelete(true);
    };

    const confirmDelete = async () => {
        setIsLoading(true);
        try {
            await axios.delete(`${API_BASE}/${selectedVessel.vesselId}`);
            showMessage("선박이 성공적으로 삭제되었습니다.");
            await loadVessels();
        } catch (err) {
            console.error("삭제 실패:", err);
            showMessage("삭제 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
            setIsConfirmingDelete(false);
        }
    };

    const cancelDelete = () => setIsConfirmingDelete(false);

    const updateVesselField = (field, value) => {
        const updated = { ...selectedVessel, [field]: value };
        setSelectedVessel(updated);
        setVessels(prev =>
            prev.map(v => (v._key === updated._key) ? updated : v)
        );
    };
    
    const handleRowClick = (row) => {
        if(isEditing && selectedVessel.isNew && !row.isNew) {
             if(!window.confirm("저장되지 않은 신규 항목이 있습니다. 이동하시겠습니까?")) {
                return;
             }
             setVessels(prev => prev.filter(v => !v.isNew));
        }
        setSelectedVessel(row);
        setIsEditing(!!row.isNew);
        setIsConfirmingDelete(false);
    };
    
    const navigateToBom = () => {
        if (selectedVessel && selectedVessel.vesselId) {
            navigate(`/boms/${selectedVessel.vesselId}`);
        }
    };

    const handleReset = () => {
        setSearchVesselId("");
        setSearchVesselNm("");
        loadVessels("", "");
    };

    const isFieldEditable = () => selectedVessel?.isNew || isEditing;

    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            <h2 className="font-bold text-2xl mb-6 text-gray-800">선박 관리</h2>
            {message && <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded-lg text-sm text-center">{message}</div>}
            
            <SearchLayout>
                <SearchTextBox label="선박 ID" value={searchVesselId} onChange={(e) => setSearchVesselId(e.target.value)} />
                <SearchTextBox label="선박명" value={searchVesselNm} onChange={(e) => setSearchVesselNm(e.target.value)} />
                <div className="flex items-end space-x-2 pt-6">
                    <SearchButton onClick={() => loadVessels()} disabled={isLoading} />
                    <InsertButton onClick={handleInsert} disabled={isLoading} />
                    <SaveButton onClick={handleSaveNewItems} disabled={isLoading} />
                </div>
            </SearchLayout>

            <div className="flex flex-col md:flex-row gap-4 mt-4">
                <div className="w-full md:w-[35%]">
                    <BodyGrid
                        columns={columns}
                        data={vessels.map(v => ({ ...v, statusText: getStatusText(v.status), _key: v.vesselId || v._key }))}
                        onRowClick={handleRowClick}
                        selectedItem={selectedVessel}
                    />
                </div>
                <div className="border w-full md:w-[65%] rounded-2xl shadow-lg p-6 bg-white">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-xl font-semibold text-gray-800">선박 상세정보</h3>
                        {selectedVessel && !selectedVessel.isNew && (
                            <div className="flex gap-x-2">
                                <button onClick={navigateToBom} disabled={isLoading || isEditing} className="px-4 py-2 bg-teal-500 text-white font-semibold rounded-lg shadow-md hover:bg-teal-600 disabled:bg-gray-300">BOM 보기</button>
                                <button onClick={handleUpdate} disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">{isEditing ? "수정 완료" : "수정"}</button>
                                <button onClick={handleDelete} disabled={isLoading || isEditing} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 disabled:bg-gray-300">삭제</button>
                            </div>
                        )}
                    </div>
                    
                    {isConfirmingDelete && (
                        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg text-sm flex justify-between items-center">
                            <span>선박 ID '{selectedVessel.vesselId}'를 정말 삭제하시겠습니까?</span>
                            <div className="flex gap-2">
                                <button onClick={confirmDelete} disabled={isLoading} className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700">확인</button>
                                <button onClick={cancelDelete} disabled={isLoading} className="px-3 py-1 bg-gray-400 text-white rounded-lg text-xs hover:bg-gray-500">취소</button>
                            </div>
                        </div>
                    )}

                    {selectedVessel ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div><label className={detailLabel}>선박 ID <span className="text-red-500">*</span></label><input type="text" value={selectedVessel.vesselId || ""} onChange={(e) => updateVesselField("vesselId", e.target.value)} className={detailTextBox} disabled={!selectedVessel.isNew} /></div>
                            <div className="md:col-span-2"><label className={detailLabel}>선박명 <span className="text-red-500">*</span></label><input type="text" value={selectedVessel.vesselNm || ""} onChange={(e) => updateVesselField("vesselNm", e.target.value)} className={detailTextBox} disabled={!isFieldEditable()} /></div>
                            <div><label className={detailLabel}>선박유형 <span className="text-red-500">*</span></label><input type="text" value={selectedVessel.vesselType || ""} onChange={(e) => updateVesselField("vesselType", e.target.value)} className={detailTextBox} disabled={!isFieldEditable()} /></div>
                            <div><label className={detailLabel}>프로젝트 ID</label><input type="text" value={selectedVessel.projectId || ""} onChange={(e) => updateVesselField("projectId", e.target.value)} className={detailTextBox} disabled={!isFieldEditable()} /></div>
                            <div><label className={detailLabel}>상태</label><select value={selectedVessel.status ?? 0} onChange={(e) => updateVesselField("status", Number(e.target.value))} className={detailTextBox} disabled={!isFieldEditable()}><option value={0}>계획</option><option value={1}>진행</option><option value={2}>완료</option></select></div>
                            <div><label className={detailLabel}>길이(m)</label><input type="number" step="0.01" value={selectedVessel.vesselLength || 0} onChange={(e) => updateVesselField("vesselLength", Number(e.target.value))} className={detailTextBox} disabled={!isFieldEditable()} /></div>
                            <div><label className={detailLabel}>폭(m)</label><input type="number" step="0.01" value={selectedVessel.vesselBeam || 0} onChange={(e) => updateVesselField("vesselBeam", Number(e.target.value))} className={detailTextBox} disabled={!isFieldEditable()} /></div>
                            <div><label className={detailLabel}>깊이(m)</label><input type="number" step="0.01" value={selectedVessel.vesselDepth || 0} onChange={(e) => updateVesselField("vesselDepth", Number(e.target.value))} className={detailTextBox} disabled={!isFieldEditable()} /></div>
                            <div><label className={detailLabel}>적재능력</label><input type="text" value={selectedVessel.cargoCapacity || ""} onChange={(e) => updateVesselField("cargoCapacity", e.target.value)} className={detailTextBox} disabled={!isFieldEditable()} /></div>
                            <div className="md:col-span-2"><label className={detailLabel}>엔진스펙</label><input type="text" value={selectedVessel.engineSpec || ""} onChange={(e) => updateVesselField("engineSpec", e.target.value)} className={detailTextBox} disabled={!isFieldEditable()} /></div>
                            <div><label className={detailLabel}>총중량</label><input type="number" step="0.01" value={selectedVessel.totalWeight || 0} onChange={(e) => updateVesselField("totalWeight", Number(e.target.value))} className={detailTextBox} disabled={!isFieldEditable()} /></div>
                            <div><label className={detailLabel}>실제납기일</label><input type="date" value={selectedVessel.actualDeliveryDate || ""} onChange={(e) => updateVesselField("actualDeliveryDate", e.target.value)} className={detailTextBox} disabled={!isFieldEditable()} /></div>
                            <div className="md:col-span-3"><label className={detailLabel}>비고</label><textarea value={selectedVessel.remark || ""} onChange={(e) => updateVesselField("remark", e.target.value)} className={detailTextBox} disabled={!isFieldEditable()} rows={2} /></div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                           <p>선박을 선택하거나 '행추가' 버튼으로 신규 등록하세요.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

