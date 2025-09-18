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

    // ✅ [수정] 조회조건 변수명 변경 (백엔드 DTO와 일치)
    const [searchSupplierName, setSearchSupplierName] = useState("");
    const [searchContractDate, setSearchContractDate] = useState("");

    // 전체 조회 실행 
    useEffect(() => {
        loadSuppliers();
    }, []);

    // 전체 공급업체 목록 불러오기
    const loadSuppliers = async () => {
        try {
            const { data } = await axios.get(API_BASE, {
                params: {
                    // ✅ [수정] API 요청 파라미터 이름 변경 (Controller와 일치)
                    supplierName: searchSupplierName || undefined,
                    contractDate: searchContractDate || undefined,
                }
            });
            setSuppliers(data);
            if (data.length > 0) {
                setSelectedSupplier(data[0]);
            } else {
                setSelectedSupplier(null); // ✅ [추가] 검색 결과가 없으면 상세 정보 초기화
            }
        } catch (err) {
            console.log("공급업체 목록 조회 실패", err);
        }
    };

    // 선택된 공급업체가 바뀌면 상세조회 실행
    useEffect(() => {
        if (selectedSupplier?.supplierId && !selectedSupplier?.isNew) {
            // 상세 조회 로직은 선택 시점에 이미 모든 데이터를 가지고 있으므로, 추가 API 호출은 불필요.
            // 필요하다면 아래 주석 해제.
            // loadSupplierDetail(selectedSupplier.supplierId);
        }
        // 수정 모드 해제
        setIsEditing(false);
    }, [selectedSupplier]);


    //행추가(새로운 공급업체 추가)
    const handleInsert = () => {
        const newSupplier = {
            // ✅ [수정] DTO 필드명에 맞게 키 이름 변경
            supplierId: null, // 새 항목은 ID가 없음
            supplierName: "",
            contractDate: new Date().toISOString().slice(0, 10),
            contactName: "",
            contactPhone: "",
            contactEmail: "",
            contactAddress: "",
            isNew: true, // 신규 행 여부 true
        };
        setIsEditing(true); // 새 행은 바로 수정 모드로 진입
        setSuppliers([...suppliers, newSupplier]);
        setSelectedSupplier(newSupplier);
    };

    //상세정보 입력창에서 값 변경시 실행
    const updateSupplierField = (field, value) => {
        // 선택된 항목(상세정보)의 상태 업데이트
        const updatedSupplier = { ...selectedSupplier, [field]: value };
        setSelectedSupplier(updatedSupplier);
    
        // 그리드(전체 목록)의 상태도 함께 업데이트
        setSuppliers(prevSuppliers =>
            prevSuppliers.map(s => 
                (s.supplierId === updatedSupplier.supplierId && s.isNew === updatedSupplier.isNew) ? updatedSupplier : s
            )
        );
    };

    //전체 저장(목록 전체를 백엔드로 전송)
    const handleSave = async () => {
        // ✅ [수정] isNew가 true인 항목만 필터링하여 저장 API 호출
        const newSuppliers = suppliers.filter(s => s.isNew);
        if (newSuppliers.length === 0) {
            alert("저장할 신규 항목이 없습니다.");
            return;
        }

        try {
            await axios.post(`${API_BASE}/saveAll`, newSuppliers);
            alert("저장되었습니다.");
            loadSuppliers(); // 저장 후 목록 다시 불러오기
        } catch (err) {
            console.log("저장 실패", err);
            alert("저장 중 오류가 발생했습니다.");
        }
    };
    
    //공급업체 수정
    const handleUpdate = async () => {
        if (!selectedSupplier || selectedSupplier.isNew) {
            alert("기존에 저장된 항목을 선택하세요.");
            return;
        }
        if (!isEditing) {
            setIsEditing(true); // 수정 모드로 전환
            return;
        }

        // 수정 API 호출
        try {
            await axios.post(API_BASE, selectedSupplier);
            alert("수정되었습니다.");
            setIsEditing(false);
            loadSuppliers();
        } catch(err) {
            console.error("수정 실패:", err);
            alert("수정 중 오류가 발생했습니다.");
        }
    }
    
    //공급업체 삭제
    const handleDelete = async (supplierId) => {
        if (!supplierId) {
            alert("삭제할 항목을 선택하세요.");
            return;
        }
        if (!window.confirm(`선택한 공급업체를 정말 삭제하시겠습니까?`)) return;
        try {
            await axios.delete(`${API_BASE}/${supplierId}`);
            alert("삭제되었습니다.");
            loadSuppliers();
        } catch (err) {
            console.log("삭제 오류", err);
            alert("삭제 중 오류가 발생했습니다.");
        }
    }

    //표에 보여줄 컬럼 정의
    const columns = [
        // ✅ [수정] accessor를 DTO 필드명에 맞게 변경
        { header: "공급업체명", accessor: "supplierName" },
        { header: "담당자", accessor: "contactName" },
        { header: "등록날짜", accessor: "contractDate" },
    ];
    
    //수정가능한지 여부 
    const isFieldEditable = () => {
        return selectedSupplier?.isNew || isEditing;
    }
    
    //화면 랜더링
    return (
        <div>
            <h2 className="font-bold mb-4">공급업체 등록</h2>
            <SearchLayout>
                {/* ✅ [수정] 조회 필드와 상태 변수 연결 */}
                <SearchTextBox label="공급업체명"
                    value={searchSupplierName}
                    onChange={(e) => setSearchSupplierName(e.target.value)}
                />
                <SearchDatePicker label="등록날짜"
                    value={searchContractDate}
                    onChange={(e) => setSearchContractDate(e.target.value)}
                />
                <SearchButton onClick={loadSuppliers} />
                <InsertButton onClick={handleInsert} />
                <SaveButton onClick={handleSave} />
            </SearchLayout>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-[35%] overflow-x-auto">
                    <BodyGrid
                        columns={columns}
                        data={suppliers}
                        onRowClick={(row) => setSelectedSupplier(row)}
                        selectedId={selectedSupplier?.supplierId}
                    />
                </div>
                <div className="border w-full md:w-[65%] rounded-2xl overflow-hidden shadow p-6 bg-white">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">공급업체 상세정보</h3>
                    {selectedSupplier ? ( // ✅ [추가] selectedSupplier가 있을 때만 상세 정보 렌더링
                        <>
                            <div className="grid grid-cols-3 gap-6">
                                {/* ✅ [수정] DTO 필드명에 맞게 value와 onChange 핸들러의 필드명 변경 */}
                                <div>
                                    <label className={supplierDetailLabel}>공급업체명</label>
                                    <input type="text" value={selectedSupplier?.supplierName || ""}
                                        onChange={(e) => updateSupplierField("supplierName", e.target.value)}
                                        className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                        readOnly={!isFieldEditable()}
                                    />
                                </div>
                                <div>
                                    <label className={supplierDetailLabel}>등록날짜</label>
                                    <input type="date" value={selectedSupplier?.contractDate || ""}
                                        onChange={(e) => updateSupplierField("contractDate", e.target.value)}
                                        className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                        readOnly={!isFieldEditable()}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className={supplierDetailLabel}>담당자명</label>
                                    <input type="text" value={selectedSupplier?.contactName || ""}
                                        onChange={(e) => updateSupplierField("contactName", e.target.value)}
                                        className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                        readOnly={!isFieldEditable()}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className={supplierDetailLabel}>연락처</label>
                                    <input type="text" value={selectedSupplier?.contactPhone || ""}
                                        onChange={(e) => updateSupplierField("contactPhone", e.target.value)}
                                        className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                        readOnly={!isFieldEditable()}
                                    />
                                </div>
                                <div className="col-span-3">
                                    <label className={supplierDetailLabel}>E-mail</label>
                                    <input type="text" value={selectedSupplier?.contactEmail || ""}
                                        onChange={(e) => updateSupplierField("contactEmail", e.target.value)}
                                        className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                        readOnly={!isFieldEditable()}
                                    />
                                </div>
                                <div className="col-span-3">
                                    <label className={supplierDetailLabel}>주소</label>
                                    <input type="text" value={selectedSupplier?.contactAddress || ""}
                                        onChange={(e) => updateSupplierField("contactAddress", e.target.value)}
                                        className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                        readOnly={!isFieldEditable()}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-x-4">
                                <button type="button"
                                    onClick={handleUpdate}
                                    className="my-6 px-6 py-2 bg-blue-500 text-white font-medium rounded-lg shadow-md hover:bg-blue-600">
                                    {isEditing ? "수정완료" : "수정"}
                                </button>
                                <button type="button"
                                    onClick={() => handleDelete(selectedSupplier.supplierId)}
                                    className="my-6 px-6 py-2 bg-rose-500 text-white font-medium rounded-lg shadow-md hover:bg-red-600">
                                    삭제
                                </button>
                            </div>
                        </>
                    ) : (
                        <p className="text-gray-500">공급업체를 선택해주세요.</p> // ✅ [추가] 선택된 항목 없을 때 메시지
                    )}
                </div>
            </div>
        </div>
    );
}