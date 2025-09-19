/*
메뉴명 : 공급업체 등록 
*/
import SearchLayout from "../layouts/SearchLayout";
import SearchTextBox from "../components/search/SearchTextBox";
import SearchDatePicker from "../components/search/SearchDatePicker";
import BodyGrid from "../layouts/BodyGrid";
import { useEffect, useState } from "react";
import axios from "axios";
import SearchButton from "../components/search/SearchButton";
import InsertButton from "../components/search/InsertButton";
import SaveButton from "../components/search/SaveButton";

const API_BASE = "http://localhost:8081/api/suppliers"; // 백엔드 api 주소 

/*자주 쓰는 스타일*/
const supplierDetailLabel = "block text-sm font-medium text-gray-700 mb-1";
const detailTextBox = "w-full rounded-lg border border-sky-500 shadow-sm px-4 py-2";

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
        } catch (err) {
            console.error("공급업체 목록 조회 실패", err);
        }
    };

    // 행 추가 (신규 공급업체)
    const handleInsert = () => {
        const newSupplier = {
            supplierId: null, // 새 항목은 ID가 없음
            supplierName: "",
            contractDate: new Date().toISOString().slice(0, 10),
            contactName: "",
            contactPhone: "",
            contactEmail: "",
            contactAddress: "",
            isNew: true, // 신규 행임을 구분하는 플래그
        };
        setIsEditing(true); // 새 행은 바로 수정 모드로 진입
        setSuppliers(prev => [...prev, newSupplier]);
        setSelectedSupplier(newSupplier);
    };

    // 상세 정보 입력 필드 값 변경 핸들러
    const updateSupplierField = (field, value) => {
        const updatedSupplier = { ...selectedSupplier, [field]: value };
        setSelectedSupplier(updatedSupplier);
    
        // 그리드 목록의 상태도 실시간으로 동기화
        setSuppliers(prevSuppliers =>
            prevSuppliers.map(s => 
                s === selectedSupplier ? updatedSupplier : s
            )
        );
    };
    
    // 신규 항목 저장
    const handleSaveNew = async () => {
        const newSuppliers = suppliers.filter(s => s.isNew && s.supplierName); // 이름이 있는 신규 항목만
        if (newSuppliers.length === 0) {
            alert("저장할 신규 항목이 없습니다. 공급업체명을 입력해주세요.");
            return;
        }

        try {
            await axios.post(`${API_BASE}/saveAll`, newSuppliers);
            alert("저장되었습니다.");
            loadSuppliers(); // 저장 후 목록 새로고침
        } catch (err) {
            console.error("저장 실패", err);
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
            // ✅ [수정] PUT 메서드와 정확한 URL 사용
            await axios.put(`${API_BASE}/${selectedSupplier.supplierId}`, selectedSupplier);
            alert("수정되었습니다.");
            setIsEditing(false);
            loadSuppliers();
        } catch(err) {
            console.error("수정 실패:", err);
            alert("수정 중 오류가 발생했습니다.");
        }
    }
    
    // 공급업체 삭제
    const handleDelete = async () => {
        // ✅ [수정] 파라미터 대신 selectedSupplier 상태 사용
        if (!selectedSupplier || !selectedSupplier.supplierId) {
            alert("삭제할 항목을 선택하세요.");
            return;
        }
        
        const { supplierId, supplierName } = selectedSupplier;
        
        if (!window.confirm(`'${supplierName}' 공급업체를 정말 삭제하시겠습니까?`)) return;
        
        try {
            await axios.delete(`${API_BASE}/${supplierId}`);
            alert("삭제되었습니다.");
            loadSuppliers();
        } catch (err) {
            console.error("삭제 오류", err);
            alert(`삭제 중 오류가 발생했습니다. (오류: ${err.response?.data?.message || err.message})`);
        }
    }

    // 그리드 행 클릭 핸들러
    const handleRowClick = (row) => {
        setSelectedSupplier(row);
        setIsEditing(false); // 다른 행 클릭 시 수정 모드 해제
    }

    const columns = [
        { header: "공급업체명", accessor: "supplierName" },
        { header: "담당자", accessor: "contactName" },
        { header: "등록날짜", accessor: "contractDate" },
    ];
    
    const isFieldEditable = () => selectedSupplier?.isNew || isEditing;
    
    return (
        <div>
            <h2 className="text-xl font-bold mb-4">공급업체 등록</h2>
            <SearchLayout>
                <SearchTextBox 
                    label="공급업체명"
                    value={searchSupplierName}
                    onChange={(e) => setSearchSupplierName(e.target.value)}
                />
                <SearchDatePicker 
                    label="등록날짜"
                    value={searchContractDate}
                    onChange={(e) => setSearchContractDate(e.target.value)}
                />
                <SearchButton onClick={loadSuppliers} />
                <InsertButton onClick={handleInsert} />
                <SaveButton onClick={handleSaveNew} />
            </SearchLayout>

            <div className="flex flex-col md:flex-row gap-4 mt-4">
                <div className="w-full md:w-[35%] overflow-x-auto">
                    <BodyGrid
                        columns={columns}
                        data={suppliers}
                        onRowClick={handleRowClick}
                        selectedId={selectedSupplier?.supplierId}
                    />
                </div>
                <div className="border w-full md:w-[65%] rounded-2xl overflow-hidden shadow p-6 bg-white">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">공급업체 상세정보</h3>
                        {selectedSupplier && !selectedSupplier.isNew && (
                            <div className="flex gap-x-2">
                                <button
                                    type="button"
                                    onClick={handleUpdate}
                                    className="px-4 py-2 bg-blue-500 text-white font-medium rounded-lg shadow-md hover:bg-blue-600 focus:outline-none"
                                >
                                    {isEditing ? "수정 완료" : "수정"}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="px-4 py-2 bg-rose-500 text-white font-medium rounded-lg shadow-md hover:bg-red-600 focus:outline-none"
                                >
                                    삭제
                                </button>
                            </div>
                        )}
                    </div>

                    {selectedSupplier ? (
                        <div className="grid grid-cols-3 gap-6">
                            <div>
                                <label className={supplierDetailLabel}>공급업체명</label>
                                <input type="text" value={selectedSupplier.supplierName || ""}
                                    onChange={(e) => updateSupplierField("supplierName", e.target.value)}
                                    className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                    readOnly={!isFieldEditable()}
                                />
                            </div>
                            <div>
                                <label className={supplierDetailLabel}>등록날짜</label>
                                <input type="date" value={selectedSupplier.contractDate || ""}
                                    onChange={(e) => updateSupplierField("contractDate", e.target.value)}
                                    className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                    readOnly={!isFieldEditable()}
                                />
                            </div>
                            <div className="col-span-1">
                                <label className={supplierDetailLabel}>담당자명</label>
                                <input type="text" value={selectedSupplier.contactName || ""}
                                    onChange={(e) => updateSupplierField("contactName", e.target.value)}
                                    className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                    readOnly={!isFieldEditable()}
                                />
                            </div>
                            <div className="col-span-1">
                                <label className={supplierDetailLabel}>연락처</label>
                                <input type="text" value={selectedSupplier.contactPhone || ""}
                                    onChange={(e) => updateSupplierField("contactPhone", e.target.value)}
                                    className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                    readOnly={!isFieldEditable()}
                                />
                            </div>
                            <div className="col-span-3">
                                <label className={supplierDetailLabel}>E-mail</label>
                                <input type="text" value={selectedSupplier.contactEmail || ""}
                                    onChange={(e) => updateSupplierField("contactEmail", e.target.value)}
                                    className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                    readOnly={!isFieldEditable()}
                                />
                            </div>
                            <div className="col-span-3">
                                <label className={supplierDetailLabel}>주소</label>
                                <input type="text" value={selectedSupplier.contactAddress || ""}
                                    onChange={(e) => updateSupplierField("contactAddress", e.target.value)}
                                    className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                    readOnly={!isFieldEditable()}
                                />
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500">공급업체를 선택하거나 '행추가' 버튼으로 신규 등록하세요.</p>
                    )}
                </div>
            </div>
        </div>
    );
}