/*
메뉴명 : 자재 등록 
*/
import { useEffect, useState } from "react";
import axios from "axios";
import SearchLayout from "../layouts/SearchLayout";
import SearchTextBox from "../components/search/SearchTextBox";
import BodyGrid from "../layouts/BodyGrid";
import SearchButton from "../components/search/SearchButton";
import InsertButton from "../components/search/InsertButton";
import SaveButton from "../components/search/SaveButton";

const API_BASE = "http://localhost:8081/api/materials"; // 백엔드 api 주소 

/* 자주 쓰는 스타일 */
const materialDetailLabel = "block text-sm font-medium text-gray-700 mb-1";
const detailTextBox = "w-full rounded-lg border border-sky-500 shadow-sm px-4 py-2";

export default function MaterialRegister() {
    // --- 상태 관리 ---
    const [materials, setMaterials] = useState([]); // 전체 자재 목록
    const [selectedMaterial, setSelectedMaterial] = useState(null); // 선택된 자재
    const [isEditing, setIsEditing] = useState(false); // 수정 모드 여부
    
    // 조회 조건
    const [searchMaterialNm, setSearchMaterialNm] = useState(""); // 자재명
    const [searchCategory, setSearchCategory] = useState("");     // 자재분류

    // --- 데이터 로딩 ---
    // 컴포넌트 첫 로딩 시 전체 조회 실행
    useEffect(() => {
        loadMaterials();
    }, []);

    // 자재 목록 불러오기 (전체/검색)
    const loadMaterials = async () => {
        try {
            const { data } = await axios.get(API_BASE, {
                params: {
                    materialNm: searchMaterialNm || undefined,
                    category: searchCategory || undefined, // 'contractDate' 대신 'category' 사용
                }
            });
            setMaterials(data);
            if (data.length > 0) {
                setSelectedMaterial(data[0]);
                setIsEditing(false); // 조회 후에는 수정 모드 해제
            } else {
                setSelectedMaterial(null);
            }
        } catch (err) {
            console.error("자재 목록 조회 실패:", err);
        }
    };
    
    // 선택된 자재가 바뀌면 상세정보 다시 로드
    useEffect(() => {
        if (selectedMaterial?.materialId && !selectedMaterial.isNew) {
            loadMaterialDetail(selectedMaterial.materialId);
        }
    }, [selectedMaterial?.materialId]); // selectedMaterial 객체 전체 대신 ID로 의존성 관리

    // 특정 자재 상세 정보 조회 (현재는 별도 API 호출 없이 상태 데이터 사용)
    const loadMaterialDetail = async (materialId) => {
        // 필요 시 단건 조회 API 호출 로직 추가
        console.log(`Load detail for ${materialId}`);
    };

    // --- 버튼 핸들러 ---
    // 행추가 (새로운 자재)
    const handleInsert = () => {
        const newMaterial = {
            materialId: null, // 새 자재는 ID가 없음
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
            supplierId: null,
            lastPurchaseDate: null,
            status: 0,
            warehouse: "",
            location: "",
            remark: "",
            isNew: true, // 신규 행 여부 플래그
        };
        setIsEditing(true); // 새 행은 바로 수정 모드
        setMaterials([...materials, newMaterial]);
        setSelectedMaterial(newMaterial);
    };

    // 전체 저장
    const handleSave = async () => {
        try {
            await axios.post(`${API_BASE}/saveAll`, materials);
            alert("저장되었습니다.");
            loadMaterials();
        } catch (err) {
            console.error("저장 실패:", err);
            alert("저장 중 오류가 발생했습니다.");
        }
    };

    // 수정 버튼 클릭
    const handleUpdate = () => {
        if (selectedMaterial && !selectedMaterial.isNew) {
            setIsEditing(true);
        }
    };

    // 삭제 버튼 클릭
    const handleDelete = async (materialId) => {
        if (!materialId) {
            alert("삭제할 항목을 선택하세요.");
            return;
        }
        if (window.confirm(`[${selectedMaterial.materialNm}] 자재를 정말 삭제하시겠습니까?`)) {
            try {
                await axios.delete(`${API_BASE}/${materialId}`);
                alert("삭제되었습니다.");
                loadMaterials();
            } catch (err) {
                console.error("삭제 오류:", err);
                alert("삭제 중 오류가 발생했습니다.");
            }
        }
    };

    // 상세정보 입력창 값 변경 핸들러
    const updateMaterialField = (field, value) => {
        // 상세 정보 상태 업데이트
        const updatedSelected = { ...selectedMaterial, [field]: value };
        setSelectedMaterial(updatedSelected);

        // 그리드 데이터도 함께 업데이트
        setMaterials(prev =>
            prev.map(m =>
                (m.materialId === selectedMaterial.materialId && m.isNew === selectedMaterial.isNew) 
                ? updatedSelected 
                : m
            )
        );
    };

    // --- 그리드/UI 설정 ---
    // 그리드 컬럼 정의
    const columns = [
        { header: "자재명", accessor: "materialNm" },
        { header: "자재분류", accessor: "category" },
        { header: "단위", accessor: "unit" },
        { header: "규격", accessor: "specification" },
    ];
    
    // 입력 필드 수정 가능 여부
    const isFieldEditable = () => selectedMaterial?.isNew || isEditing;

    // --- 렌더링 ---
    return (
        <div>
            <h2 className="text-xl font-bold mb-4">자재 등록</h2>
            <SearchLayout>
                <SearchTextBox 
                    label="자재명"
                    value={searchMaterialNm}
                    onChange={(e) => setSearchMaterialNm(e.target.value)}
                />
                <SearchTextBox 
                    label="자재분류"
                    value={searchCategory}
                    onChange={(e) => setSearchCategory(e.target.value)}
                />
                <SearchButton onClick={loadMaterials} />
                <InsertButton onClick={handleInsert} />
                <SaveButton onClick={handleSave} />
            </SearchLayout>

            <div className="flex flex-col md:flex-row gap-4 mt-4">
                {/* 그리드 영역 */}
                <div className="w-full md:w-1/2">
                    <BodyGrid
                        columns={columns}
                        data={materials.map(m => ({ ...m, _key: m.materialId || `new_${materials.indexOf(m)}`}))}
                        onRowClick={(row) => {
                            setSelectedMaterial(row);
                            setIsEditing(row.isNew || false);
                        }}
                        selectedId={selectedMaterial?.materialId}
                        readOnly={true} 
                    />
                </div>
                
                {/* 상세정보 영역 */}
                <div className="w-full md:w-1/2 p-6 bg-white rounded-lg shadow">
                    {selectedMaterial ? (
                        <>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">자재 상세정보</h3>
                                <div className="flex gap-x-2">
                                    <button type="button" onClick={handleUpdate}
                                        className="px-4 py-2 bg-blue-500 text-white font-medium rounded-lg shadow-md hover:bg-blue-600 focus:outline-none disabled:bg-gray-400"
                                        disabled={!selectedMaterial || selectedMaterial.isNew}
                                    >
                                        수정
                                    </button>
                                    <button type="button" onClick={() => handleDelete(selectedMaterial.materialId)}
                                        className="px-4 py-2 bg-red-500 text-white font-medium rounded-lg shadow-md hover:bg-red-600 focus:outline-none disabled:bg-gray-400"
                                        disabled={!selectedMaterial || selectedMaterial.isNew}
                                    >
                                        삭제
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className={materialDetailLabel}>자재ID</label>
                                    <input type="text" value={selectedMaterial.materialId || "자동 생성"} readOnly className={`${detailTextBox} bg-gray-100`} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className={materialDetailLabel}>자재명</label>
                                    <input type="text" value={selectedMaterial.materialNm || ""}
                                        onChange={(e) => updateMaterialField("materialNm", e.target.value)}
                                        className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : ""}`} readOnly={!isFieldEditable()} />
                                </div>
                                <div>
                                    <label className={materialDetailLabel}>자재분류</label>
                                    <input type="text" value={selectedMaterial.category || ""}
                                        onChange={(e) => updateMaterialField("category", e.target.value)}
                                        className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : ""}`} readOnly={!isFieldEditable()} />
                                </div>
                                <div>
                                    <label className={materialDetailLabel}>단위</label>
                                    <input type="text" value={selectedMaterial.unit || ""}
                                        onChange={(e) => updateMaterialField("unit", e.target.value)}
                                        className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : ""}`} readOnly={!isFieldEditable()} />
                                </div>
                                <div>
                                    <label className={materialDetailLabel}>공급업체 ID</label>
                                    <input type="number" value={selectedMaterial.supplierId || ""}
                                        onChange={(e) => updateMaterialField("supplierId", Number(e.target.value))}
                                        className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : ""}`} readOnly={!isFieldEditable()} />
                                </div>
                                <div className="md:col-span-3">
                                    <label className={materialDetailLabel}>규격</label>
                                    <input type="text" value={selectedMaterial.specification || ""}
                                        onChange={(e) => updateMaterialField("specification", e.target.value)}
                                        className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : ""}`} readOnly={!isFieldEditable()} />
                                </div>
                                <div>
                                    <label className={materialDetailLabel}>기준단가</label>
                                    <input type="number" value={selectedMaterial.unitPrice || 0}
                                        onChange={(e) => updateMaterialField("unitPrice", Number(e.target.value))}
                                        className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : ""}`} readOnly={!isFieldEditable()} />
                                </div>
                                <div>
                                    <label className={materialDetailLabel}>현재단가</label>
                                    <input type="number" value={selectedMaterial.currentPrice || 0}
                                        onChange={(e) => updateMaterialField("currentPrice", Number(e.target.value))}
                                        className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : ""}`} readOnly={!isFieldEditable()} />
                                </div>
                                <div>
                                    <label className={materialDetailLabel}>리드타임(일)</label>
                                    <input type="number" value={selectedMaterial.leadTime || 0}
                                        onChange={(e) => updateMaterialField("leadTime", Number(e.target.value))}
                                        className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : ""}`} readOnly={!isFieldEditable()} />
                                </div>
                                <div>
                                    <label className={materialDetailLabel}>최소재고</label>
                                    <input type="number" value={selectedMaterial.minStockQuantity || 0}
                                        onChange={(e) => updateMaterialField("minStockQuantity", Number(e.target.value))}
                                        className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : ""}`} readOnly={!isFieldEditable()} />
                                </div>
                                <div>
                                    <label className={materialDetailLabel}>최대재고</label>
                                    <input type="number" value={selectedMaterial.maxStockQuantity || 0}
                                        onChange={(e) => updateMaterialField("maxStockQuantity", Number(e.target.value))}
                                        className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : ""}`} readOnly={!isFieldEditable()} />
                                </div>
                                <div>
                                    <label className={materialDetailLabel}>현재고</label>
                                    <input type="number" value={selectedMaterial.currentStock || 0}
                                        onChange={(e) => updateMaterialField("currentStock", Number(e.target.value))}
                                        className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : ""}`} readOnly={!isFieldEditable()} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className={materialDetailLabel}>창고</label>
                                    <input type="text" value={selectedMaterial.warehouse || ""}
                                        onChange={(e) => updateMaterialField("warehouse", e.target.value)}
                                        className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : ""}`} readOnly={!isFieldEditable()} />
                                </div>
                                <div>
                                    <label className={materialDetailLabel}>위치</label>
                                    <input type="text" value={selectedMaterial.location || ""}
                                        onChange={(e) => updateMaterialField("location", e.target.value)}
                                        className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : ""}`} readOnly={!isFieldEditable()} />
                                </div>
                                <div className="md:col-span-3">
                                    <label className={materialDetailLabel}>비고</label>
                                    <input type="text" value={selectedMaterial.remark || ""}
                                        onChange={(e) => updateMaterialField("remark", e.target.value)}
                                        className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : ""}`} readOnly={!isFieldEditable()} />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            자재를 선택해주세요.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}