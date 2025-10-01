import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

// ===================================================================
// I. UI Components (프로젝트 메뉴 스타일과 동일하게 재사용)
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

const StyledButton = ({ onClick, children, colorClass, disabled }) => (
  <button onClick={onClick} disabled={disabled} className={`flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 transition-all duration-200 ${colorClass} disabled:bg-gray-400 disabled:cursor-not-allowed`}>
    {children}
  </button>
);

// ✅ [디자인 수정] TreeGrid를 프로젝트 메뉴 스타일로 업데이트
// 기존 TreeGrid 컴포넌트를 BodyGrid 스타일을 적용하고 확장/축소 기능을 내장하여 새롭게 정의
const TreeGrid = ({ columns, data, onRowClick }) => {
    const [expandedRows, setExpandedRows] = useState(new Set());

    const toggleRow = (key) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                newSet.delete(key);
            } else {
                newSet.add(key);
            }
            return newSet;
        });
    };
    
    const renderRow = (row, level = 0) => {
        const isParent = !!row.children && row.children.length > 0;
        const isExpanded = expandedRows.has(row._key);

        return (
            <React.Fragment key={row._key}>
                <tr className="hover:bg-gray-50 border-t">
                    {columns.map((col, index) => (
                        <td key={col.accessor} className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">
                            {index === 0 ? (
                                <div style={{ paddingLeft: `${level * 24}px` }} className="flex items-center">
                                    {isParent && (
                                        <button onClick={() => toggleRow(row._key)} className="mr-2 text-sky-600">
                                            {isExpanded ? '▼' : '▶'}
                                        </button>
                                    )}
                                    {col.render ? col.render(row) : row[col.accessor]}
                                </div>
                            ) : (
                                col.render ? col.render(row) : row[col.accessor]
                            )}
                        </td>
                    ))}
                </tr>
                {isParent && isExpanded && row.children.map(child => renderRow(child, level + 1))}
            </React.Fragment>
        );
    };

    return (
        <div className="h-[calc(100vh-280px)] overflow-auto border rounded-lg shadow-md bg-white">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100 sticky top-0">
                    <tr>
                        {columns.map((col) => (
                            <th key={col.accessor} className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
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
                        data.map(row => renderRow(row))
                    )}
                </tbody>
            </table>
        </div>
    );
};

// ✅ [디자인 수정] Modal 컴포넌트를 프로젝트 메뉴 스타일로 업데이트
function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col border">
                <div className="flex justify-between items-center mb-5">
                     <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                     <button onClick={onClose} className="text-2xl font-semibold text-gray-500 hover:text-gray-800">&times;</button>
                </div>
                {children}
            </div>
        </div>
    );
}

// ===================================================================
// II. BOM 메인 컴포넌트
// ===================================================================
const API_BASE = "http://localhost:8081/api/boms";

export default function Bom() {
    const [boms, setBoms] = useState([]);
    const { vesselId: vesselIdParam } = useParams();
    const [searchVesselId, setSearchVesselId] = useState("");
    const [message, setMessage] = useState("");

    const [form, setForm] = useState({
        vesselId: "", materialName: "",
        requiredQuantity: "", unit: "", remark: "",
    });
    const [editingId, setEditingId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const columns = [
        { header: "선박 ID", accessor: "vesselId" },
        { header: "자재명", accessor: "materialName" },
        { header: "소요수량", accessor: "requiredQuantity" },
        { header: "단위", accessor: "unit" },
        { header: "비고", accessor: "remark" },
    ];

    // ===================================================================
    // 데이터 핸들링 로직 (기능 변경 없음)
    // ===================================================================
    const showMessage = (msg) => {
        setMessage(msg);
        setTimeout(() => setMessage(""), 3000);
    };

    useEffect(() => {
        if (vesselIdParam) {
            setSearchVesselId(vesselIdParam);
            loadBoms(vesselIdParam);
        } else {
            loadBoms();
        }
    }, [vesselIdParam]);

    const loadBoms = async (vesselId) => {
        try {
            const { data } = await axios.get(API_BASE, {
                params: { vesselId: vesselId || undefined },
            });
            setBoms(data);
        } catch (err) {
            console.error("BOM 목록 조회 실패:", err);
            showMessage("BOM 목록 조회 중 오류가 발생했습니다.");
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setForm({
            vesselId: "",  materialName: "",
            requiredQuantity: "", unit: "", remark: "",
        });
    };

    const handleOpenCreateModal = () => {
        setEditingId(null);
        setForm({
            vesselId: "", materialName: "",
            requiredQuantity: "", unit: "", remark: "",
        });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (row) => {
        setEditingId(row.bomId);
        setForm({
            vesselId: row.vesselId || "",
            materialName: row.materialName || "",
            requiredQuantity: row.requiredQuantity || "",
            unit: row.unit || "",
            remark: row.remark || "",
        });
        setIsModalOpen(true);
    };

    const handleCreate = async () => {
        try {
            await axios.post(API_BASE, form);
            showMessage("BOM이 등록되었습니다.");
            loadBoms(searchVesselId);
            handleCloseModal();
        } catch (err) {
            console.error("BOM 등록 실패:", err);
            showMessage("BOM 등록 중 오류가 발생했습니다.");
        }
    };

    const handleUpdate = async () => {
        try {
            await axios.put(`${API_BASE}/${editingId}`, form);
            showMessage("BOM이 수정되었습니다.");
            loadBoms(searchVesselId);
            handleCloseModal();
        } catch (err) {
            console.error("BOM 수정 실패:", err);
            showMessage("BOM 수정 중 오류가 발생했습니다.");
        }
    };

    const handleDelete = async (bomId) => {
        if (!window.confirm("정말 삭제하시겠습니까?")) return;
        try {
            await axios.delete(`${API_BASE}/${bomId}`);
            showMessage("BOM이 삭제되었습니다.");
            loadBoms(searchVesselId);
        } catch (err) {
            console.error("BOM 삭제 실패:", err);
            showMessage("BOM 삭제 중 오류가 발생했습니다.");
        }
    };

    const groupByVessel = (flatData) => {
        const grouped = {};
        flatData.forEach((row) => {
            if (!grouped[row.vesselId]) {
                grouped[row.vesselId] = {
                    _key: `vessel-${row.vesselId}`,
                    vesselId: `${row.vesselId} 선박`,
                    children: [],
                };
            }
            grouped[row.vesselId].children.push({
                ...row,
                _key: `bom-${row.bomId}`,
            });
        });
        return Object.values(grouped);
    };

    // ===================================================================
    // 렌더링 (JSX)
    // ===================================================================
    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            <h2 className="font-bold text-2xl mb-6 text-gray-800">BOM 관리</h2>

            {message && (
                <div className="mb-4 p-3 bg-sky-100 text-sky-800 rounded-lg text-sm text-center shadow">
                    {message}
                </div>
            )}

            <SearchLayout>
                <SearchTextBox
                    label="선박ID"
                    value={searchVesselId || ""}
                    onChange={(e) => setSearchVesselId(e.target.value)}
                    placeholder="선박 ID로 검색"
                />
                 <div className="flex items-end space-x-2 pt-6">
                    <StyledButton onClick={() => loadBoms(searchVesselId)} colorClass="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500">
                        <span>조회</span>
                    </StyledButton>
                    <StyledButton onClick={handleOpenCreateModal} colorClass="bg-green-600 hover:bg-green-700 focus:ring-green-500">
                        <span>BOM 신규 등록</span>
                    </StyledButton>
                </div>
            </SearchLayout>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingId ? "BOM 수정" : "BOM 신규 등록"}
            >
                <div className="overflow-y-auto pr-2 flex-grow">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        {/* ✅ [디자인 수정] Modal 내부 Input에 Label 추가 및 스타일 통일 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">선박 ID</label>
                            <input placeholder="선박 ID" value={form.vesselId} onChange={(e) => setForm({ ...form, vesselId: e.target.value })} className="w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">자재명</label>
                            <input placeholder="자재명" value={form.materialName} onChange={(e) => setForm({ ...form, materialName: e.target.value })} className="w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">소요수량</label>
                            <input type="number" placeholder="소요수량" value={form.requiredQuantity} onChange={(e) => setForm({ ...form, requiredQuantity: e.target.value })} className="w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">단위</label>
                            <input placeholder="단위" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500" />
                        </div>
                        <div className="col-span-2">
                             <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
                            <input placeholder="비고" value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} className="w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500" />
                        </div>
                    </div>
                </div>
                 <div className="mt-6 flex justify-end w-full pt-4 border-t gap-x-2">
                    <StyledButton onClick={handleCloseModal} colorClass="bg-gray-600 hover:bg-gray-700 focus:ring-gray-500">
                        <span>취소</span>
                    </StyledButton>
                    <StyledButton onClick={editingId ? handleUpdate : handleCreate} colorClass="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500">
                        <span>{editingId ? "수정 저장" : "등록"}</span>
                    </StyledButton>
                </div>
            </Modal>

            <TreeGrid
                columns={[
                    ...columns,
                    {
                        header: "액션",
                        accessor: "actions",
                        render: (row) => (
                           // 자식 노드(BOM 상세)에만 수정/삭제 버튼 표시
                           row.children ? null : (
                            <div className="flex items-center gap-2">
                                <button
                                    className="px-2.5 py-1 bg-green-500 text-white text-xs font-semibold rounded-md shadow-sm hover:bg-green-600"
                                    onClick={() => handleOpenEditModal(row)}
                                >
                                    수정
                                </button>
                                <button
                                    className="px-2.5 py-1 bg-red-500 text-white text-xs font-semibold rounded-md shadow-sm hover:bg-red-600"
                                    onClick={() => handleDelete(row.bomId)}
                                >
                                    삭제
                                </button>
                            </div>
                           )
                        ),
                    },
                ]}
                data={groupByVessel(boms)}
            />
        </div>
    );
}