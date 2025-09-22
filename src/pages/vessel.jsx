import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// 이 예제를 위한 모의 컴포넌트입니다.
const SearchLayout = ({ children, className }) => <div className={`flex flex-col md:flex-row items-end gap-4 p-4 bg-white rounded-xl shadow-md ${className}`}>{children}</div>;
const SearchTextBox = ({ label, value, onChange, className }) => (
    <div className={`flex flex-col ${className}`}>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
            type="text"
            value={value}
            onChange={onChange}
            className="w-full rounded-lg border border-sky-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
        />
    </div>
);
const SearchButton = ({ onClick, children, disabled }) => (
    <button onClick={onClick} disabled={disabled} className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 shadow disabled:bg-sky-300 disabled:cursor-not-allowed">{children}</button>
);
const SaveButton = ({ onClick, children, disabled }) => (
    <button onClick={onClick} disabled={disabled} className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 shadow disabled:bg-indigo-300 disabled:cursor-not-allowed">{children}</button>
);

const BodyGrid = ({
    columns,
    data = [],
    onRowClick,
    selectedId,
}) => {
    return (
        <div className="rounded-2xl overflow-hidden shadow">
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
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="text-center py-4 text-gray-500">
                                데이터가 없습니다.
                            </td>
                        </tr>
                    ) : (
                        data.map((row) => (
                            <tr
                                key={row._key}
                                onClick={() => onRowClick(row)}
                                className={`cursor-pointer hover:bg-sky-50 ${
                                    selectedId && row.vesselId === selectedId ? "bg-sky-100" : ""
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
};

const API_BASE = "http://localhost:8081/api/vessels";
const detailLabel = "block text-sm font-medium text-gray-700 mb-1";
const detailTextBox = "w-full rounded-lg border border-sky-300 shadow-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400";

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
        { header: "선박유형", accessor: "vesselType" },
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
        showMessage("데이터를 조회하고 있습니다...");
        try {
            const { data } = await axios.get(API_BASE, {
                params: { vesselId: id || undefined, vesselNm: name || undefined },
            });
            setVessels(data);
            setSelectedVessel(data[0] || null);
            setIsEditing(false);
            setIsConfirmingDelete(false);
            showMessage("선박 목록을 성공적으로 조회했습니다.");
        } catch (err) {
            console.error("선박 목록 조회 실패:", err);
            showMessage("선박 목록 조회 중 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleInsert = () => {
        const newVessel = {
            isNew: true, vesselId: "", vesselNm: "", vesselType: "", status: 0,
            vesselLength: 0, vesselBeam: 0, vesselDepth: 0, cargoCapacity: "", engineSpec: "",
            totalWeight: 0, actualDeliveryDate: null, projectId: "", remark: "",
        };
        setVessels(prev => [newVessel, ...prev]);
        setSelectedVessel(newVessel);
        setIsEditing(true);
        setIsConfirmingDelete(false);
    };

    const handleSave = async () => {
        if (!selectedVessel) {
            showMessage("저장할 선박을 선택해주세요.");
            return;
        }
        if (!selectedVessel.vesselId || !selectedVessel.vesselNm || !selectedVessel.vesselType) {
            showMessage("선박ID, 선박명, 선박유형은 필수입니다.");
            return;
        }
        
        setIsLoading(true);
        try {
            if (selectedVessel.isNew) {
                const payload = { ...selectedVessel };
                delete payload.isNew;
                await axios.post(API_BASE, payload);
                showMessage("새로운 선박이 성공적으로 저장되었습니다.");
            } else {
                await axios.put(`${API_BASE}/${selectedVessel.vesselId}`, selectedVessel);
                showMessage("선박 정보가 성공적으로 수정되었습니다.");
            }
            await loadVessels();
        } catch (err) {
            console.error("저장 실패:", err);
            showMessage("저장 중 오류가 발생했습니다.");
            setIsLoading(false);
        } 
    };

    const handleDelete = () => {
        if (!selectedVessel || !selectedVessel.vesselId) {
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
            setIsLoading(false);
        } finally {
            setIsConfirmingDelete(false);
        }
    };

    const cancelDelete = () => setIsConfirmingDelete(false);

    const updateVesselField = (field, value) => {
        const updated = { ...selectedVessel, [field]: value };
        setSelectedVessel(updated);
        setVessels(prev =>
            prev.map(v => (v.vesselId === updated.vesselId || (v.isNew && selectedVessel.isNew)) ? updated : v)
        );
    };
    
    const handleRowClick = (row) => {
        const originalVessel = vessels.find(v => v.vesselId === row.vesselId) || row;
        setSelectedVessel(originalVessel);
        setIsEditing(row.isNew || false);
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
        <div className="p-6 bg-gray-50 min-h-screen font-inter">
            <h2 className="font-bold text-2xl mb-6 text-sky-700">선박 관리</h2>
            {message && <div className="mb-4 p-3 bg-sky-100 text-sky-800 rounded-lg text-sm text-center">{message}</div>}
            
            <SearchLayout className="mb-6">
                <SearchTextBox label="선박 ID" value={searchVesselId} onChange={(e) => setSearchVesselId(e.target.value)} />
                <SearchTextBox label="선박명" value={searchVesselNm} onChange={(e) => setSearchVesselNm(e.target.value)} />
                <div className="flex gap-2 md:ml-auto">
                    <SearchButton onClick={() => loadVessels()} disabled={isLoading}>조회</SearchButton>
                    <button onClick={handleReset} disabled={isLoading} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-300 shadow disabled:bg-gray-100 disabled:cursor-not-allowed">리셋</button>
                    <button onClick={handleInsert} disabled={isLoading} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow disabled:bg-green-300 disabled:cursor-not-allowed">추가</button>
                    <SaveButton onClick={handleSave} disabled={isLoading}>저장</SaveButton>
                </div>
            </SearchLayout>

            <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/2 bg-white rounded-2xl shadow-md overflow-x-auto">
                    <BodyGrid
                        columns={columns}
                        data={vessels.map(v => ({ ...v, statusText: getStatusText(v.status), _key: v.vesselId || `new_${vessels.indexOf(v)}` }))}
                        onRowClick={handleRowClick}
                        selectedId={selectedVessel?.vesselId}
                    />
                </div>
                <div className="w-full md:w-1/2 p-6 bg-white rounded-2xl shadow-md border border-sky-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-sky-800">선박 상세정보</h3>
                        {selectedVessel && !selectedVessel.isNew && (
                            <div className="flex gap-2">
                                <button onClick={navigateToBom} disabled={isLoading} className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 shadow disabled:bg-teal-300 disabled:cursor-not-allowed">BOM 보기</button>
                                <button onClick={() => setIsEditing(true)} disabled={isLoading} className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 shadow disabled:bg-sky-300 disabled:cursor-not-allowed">수정</button>
                                <button onClick={handleDelete} disabled={isLoading} className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 shadow disabled:bg-rose-300 disabled:cursor-not-allowed">삭제</button>
                            </div>
                        )}
                    </div>
                    
                    {isConfirmingDelete && (
                        <div className="mb-4 p-3 bg-rose-100 text-rose-800 rounded-lg text-sm flex justify-between items-center">
                            <span>선박 ID '{selectedVessel.vesselId}'를 정말 삭제하시겠습니까?</span>
                            <div className="flex gap-2">
                                <button onClick={confirmDelete} disabled={isLoading} className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs hover:bg-rose-700">확인</button>
                                <button onClick={cancelDelete} disabled={isLoading} className="px-3 py-1 bg-gray-400 text-white rounded-lg text-xs hover:bg-gray-500">취소</button>
                            </div>
                        </div>
                    )}

                    {selectedVessel ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div><label className={detailLabel}>선박 ID</label><input type="text" value={selectedVessel.vesselId || ""} onChange={(e) => updateVesselField("vesselId", e.target.value)} className={`${detailTextBox} ${!isFieldEditable() || !selectedVessel.isNew ? "bg-gray-100" : ""}`} readOnly={!selectedVessel.isNew} /></div>
                            <div className="md:col-span-2"><label className={detailLabel}>선박명</label><input type="text" value={selectedVessel.vesselNm || ""} onChange={(e) => updateVesselField("vesselNm", e.target.value)} className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : ""}`} readOnly={!isFieldEditable()} /></div>
                            <div><label className={detailLabel}>선박유형</label><input type="text" value={selectedVessel.vesselType || ""} onChange={(e) => updateVesselField("vesselType", e.target.value)} className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : ""}`} readOnly={!isFieldEditable()} /></div>
                            <div><label className={detailLabel}>프로젝트 ID</label><input type="text" value={selectedVessel.projectId || ""} onChange={(e) => updateVesselField("projectId", e.target.value)} className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : ""}`} readOnly={!isFieldEditable()} /></div>
                            <div><label className={detailLabel}>상태</label><select value={selectedVessel.status ?? 0} onChange={(e) => updateVesselField("status", Number(e.target.value))} className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : ""}`} disabled={!isFieldEditable()}><option value={0}>계획</option><option value={1}>진행</option><option value={2}>완료</option></select></div>
                            <div><label className={detailLabel}>길이(m)</label><input type="number" step="0.01" value={selectedVessel.vesselLength || ""} onChange={(e) => updateVesselField("vesselLength", Number(e.target.value))} className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : ""}`} readOnly={!isFieldEditable()} /></div>
                            <div><label className={detailLabel}>폭(m)</label><input type="number" step="0.01" value={selectedVessel.vesselBeam || ""} onChange={(e) => updateVesselField("vesselBeam", Number(e.target.value))} className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : ""}`} readOnly={!isFieldEditable()} /></div>
                            <div><label className={detailLabel}>깊이(m)</label><input type="number" step="0.01" value={selectedVessel.vesselDepth || ""} onChange={(e) => updateVesselField("vesselDepth", Number(e.target.value))} className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : ""}`} readOnly={!isFieldEditable()} /></div>
                            <div><label className={detailLabel}>적재능력</label><input type="text" value={selectedVessel.cargoCapacity || ""} onChange={(e) => updateVesselField("cargoCapacity", e.target.value)} className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : ""}`} readOnly={!isFieldEditable()} /></div>
                            <div className="md:col-span-2"><label className={detailLabel}>엔진스펙</label><input type="text" value={selectedVessel.engineSpec || ""} onChange={(e) => updateVesselField("engineSpec", e.target.value)} className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : ""}`} readOnly={!isFieldEditable()} /></div>
                            <div><label className={detailLabel}>총중량</label><input type="number" step="0.01" value={selectedVessel.totalWeight || ""} onChange={(e) => updateVesselField("totalWeight", Number(e.target.value))} className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : ""}`} readOnly={!isFieldEditable()} /></div>
                            <div><label className={detailLabel}>실제납기일</label><input type="date" value={selectedVessel.actualDeliveryDate || ""} onChange={(e) => updateVesselField("actualDeliveryDate", e.target.value)} className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : ""}`} readOnly={!isFieldEditable()} /></div>
                            <div className="md:col-span-3"><label className={detailLabel}>비고</label><input type="text" value={selectedVessel.remark || ""} onChange={(e) => updateVesselField("remark", e.target.value)} className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : ""}`} readOnly={!isFieldEditable()} /></div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">선박을 선택해주세요.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

