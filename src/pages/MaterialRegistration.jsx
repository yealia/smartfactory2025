/*
메뉴명 : 자재 등록 
*/
import { Children, use } from "react";
import SearchLayout from "../layouts/SearchLayout";
import SearchTextBox from "../components/search/SearchTextBox";
import SearchDatePicker from "../components/search/SearchDatePicker";
import BodyGrid from "../layouts/BodyGrid";
import { useEffect, useState } from "react";
import axios from "axios";
import SearchButton from "../components/search/SearchButton";
import InsertButton from "../components/search/InsertButton";
import SaveButton from "../components/search/SaveButton";


const API_BASE = "http://localhost:8081/api/materials"; //백엔드 api 주소 
const LABEL_STYLE = "block text-sm font-medium text-gray-700 mb-1";
const INPUT_STYLE = "w-full rounded-lg border border-sky-500 shadow-sm px-4 py-2";

/*자주 쓰는 스타일*/
const materialDetailLabel = "block text-sm font-medium text-gray-700 mb-1";
const detailTextBox = "w-full rounded-lg border border-sky-500 shadow-sm px-4 py-2";

export default function MaterialRegister() {
    //상태 관리
    //전체 자재 목록
    const [materials, setMaterials] = useState([]);
    //선택된 자재 1명
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    //수정 모드 여부
    const [isEditing, setIsEditing] = useState(false);
    //조회조건 자재명
    const [searchMaterialNm, setSearchMaterialNm] = useState("");
    //조회 조건 등록날짜
    const [searchContractDate, setSearchContractDate] = useState("");

    // 전체 조회 실행 
    useEffect(() => {
        loadMaterials();
        console.log("전체 조회");
    }, []);
    // 전체 자재 목록 불러오기
    const loadMaterials = async () => {
        console.log(searchMaterialNm);
        console.log(searchContractDate);
        try {
            const { data } = await axios.get(API_BASE, {
                params: {
                    //조회조건에 자재명이 있을 때만 값을 보냄
                    //materialNm: searchMaterialNm || "",
                    //조회조건에 날짜가 있을 때만 값을 보냄
                    //materialDate: searchMaterialDate || 
                    materialNm: searchMaterialNm || undefined,
                    contractDate: searchContractDate || undefined,
                }
            }); //조회->Get방식, api/materials
            setMaterials(data); //상태에 저장
            //첫번째 자재 자동 선택 되서 상세 내용 보이게(이거안하면 상세내용안보임)
            if (data.length > 0) setSelectedMaterial(data[0]);
        } catch (err) {
            console.log("자재 목록 조회 실패", err);
        }
    };
    //선택된 자재이 바뀌면 상세조회 실행
    useEffect(() => {
        if (selectedMaterial?.materialId && !selectedMaterial?.isNew) {
            loadMaterialDetail(selectedMaterial.materialId);
        }
    }, [selectedMaterial, isEditing]);
    // 특정 자재 상세 조회
    const loadMaterialDetail = async (materialId) => {
        try {
            //materialId를 받아서 파라미터로 던진다
            const { data } = await axios.get(`${API_BASE}/${materialId}`);
        } catch (err) {
            console.error("자재 상세 조회 실패:", err);
        }
    };

    //행추가(새로운 자재 추가)
    const handleInsert = () => {
        const newMaterial = {
            id: "",
            materialId: "",
            materialNm: "",
            contractDate: new Date().toISOString().slice(0, 10), //오늘 날짜 기본값
            contactPerson: "",
            contactPhone: "",
            contactEmail: "",
            contactAddress: "",
            isNew: true, //신규 행여부 true
        };
        handleUpdate(selectedMaterial.materialId); //자재 상세정보 입력가능하세
        setMaterials([...materials, newMaterial]); //기존목록 + 새행
        setSelectedMaterial(newMaterial); //방금 추가한 행을 상세정보에 표시
    };

    //셀값 변경 핸들러 
    const handleCellChange = (rowIndex, field, value) => {
        setMaterials((prev) => {
            const updated = [...prev];
            updated[rowIndex] = { ...updated[rowIndex], [field]: value };
            console.log(rowIndex);
            console.log(field);
            console.log(value);
            return updated;
        })
    }

    //상세정보 입력창에서 값 변경시 실행
    const updateMaterialField = (field, value) => {
        setSelectedMaterial((prev) => ({ ...prev, [field]: value, }));
        setMaterials((prev) =>
            prev.map((c) =>
                c.materialId === selectedMaterial.materialId ? { ...c, [field]: value } : c
            )
        );
    };

    //전체 저장(목록 전체를 백엔드로 전송)
    const handleSave = async () => {
        try {
            await axios.post(`${API_BASE}/saveAll`, materials);
            alert("저장되었습니다.");
            loadMaterials(); //저장되고 나서 전체 조회
            //저장 후 저장된 데이터 select할걸지 
        } catch (err) {
            console.log("저장 실패", err, materials);
            alert("저장오류");
        }
    };
    //자재 수정
    const handleUpdate = () => {
        if (!selectedMaterial?.isNew) {
            setIsEditing(true);
        }
    }
    //자재 삭제
    const handleDelete = async (materialId) => {
        if (!window.confirm(`${materialId}자재을 정말 삭제하겠습니까?`)) return;
        try {
            await axios.delete(`${API_BASE}/${materialId}`);
            alert("삭제되었습니다.");
            loadMaterials(); //다시 전체 조회
        } catch (err) {
            console.log("삭제 오류", err);
            alert("삭제 오류");
        }
    }

    //표에 보여줄 컬럼 정의
    const columns = [
        //{ header: "자재ID", accessor: "materialId" },
        { header: "자재명", accessor: "materialNm" },
        { header: "자재분류", accessor: "category" },
        { header: "단위", accessor: "unit" },
        { header: "등록날짜", accessor: "contractDate" },
    ];
    //수정가능한지 여부 
    const isFieldEditable = () => {
        return selectedMaterial?.isNew || isEditing; //추가나 수정일때만 true;
    }
    //화면 랜더링
    return (
        <div>
            <h2 className="font-bold mb-4">자재 등록</h2>
            <SearchLayout>
                <SearchTextBox label="자재명"
                    value={searchMaterialNm}
                    onChange={(e) => setSearchMaterialNm(e.target.value)}
                    readOnly={false}
                />
                {/*손손손 <SearchTextBox label="분류"
                    value={searchMaterialNm}
                    onChange={(e) => setSearchMaterialNm(e.target.value)}
                    readOnly={false}
                /> */}
                <SearchDatePicker label="등록날짜"
                    value={searchContractDate}
                    onChange={(e) => { setSearchContractDate(e.target.value) }}
                />
                <SearchButton onClick={loadMaterials} />
                <InsertButton onClick={handleInsert} />
                <SaveButton onClick={handleSave} />
            </SearchLayout>

            {/*그리드*/}
            <div className="flex flex-col md:flex-row gap-4">
                {/*md:w-[35%] : 화면이 768px이상일때 35%너비*/}
                <div className="w-full overflow-x-auto ">
                    <BodyGrid className=""
                        columns={columns} data={materials}
                        onRowClick={(row) => setSelectedMaterial(row)}
                        selectedId={selectedMaterial?.materialId}
                        onCellChange={handleCellChange}
                        readOnly={true} />
                </div>
                <div className="border w-full md:w-[65%] rounded-2xl overflow-hidden shadow p-6 bg-white">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">자재 상세정보</h3>
                    <div className="grid grid-cols-3 gap-6">
                        {/* 자재ID */}
                        <div>
                            <label className={materialDetailLabel}>자재ID</label>
                            <input type="text" value={selectedMaterial?.materialId || ""}
                                onChange={(e) => { updateMaterialField("materialId", e.target.value) }}
                                className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                readOnly={!isFieldEditable()}
                            />
                        </div>
                        {/* 자재명 */}
                        <div className="col-span-2">
                            <label className={materialDetailLabel}>자재명</label>
                            <input type="text" value={selectedMaterial?.materialNm || ""}
                                onChange={(e) => { updateMaterialField("materialNm", e.target.value) }}
                                className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                readOnly={!isFieldEditable()}
                            />
                        </div>
                        {/* 등록날짜 */}
                        <div>
                            <label className={materialDetailLabel}>자재분류</label>
                            <input type="text" value={selectedMaterial?.category || ""}
                                onChange={(e) => { updateMaterialField("category", e.target.value) }}
                                className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                readOnly={!isFieldEditable()}
                            />
                        </div>
                        {/* 단위 */}
                        <div className="col-span-1">
                            <label className={materialDetailLabel}>단위</label>
                            <input type="text" value={selectedMaterial?.unit || ""}
                                onChange={(e) => { updateMaterialField("unit", e.target.value) }}
                                className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                readOnly={!isFieldEditable()}
                            />
                        </div>
                        {/* 규격 */}
                        <div className="col-span-3">
                            <label className={materialDetailLabel}>규격</label>
                            <input type="text" value={selectedMaterial?.specification || ""}
                                onChange={(e) => { updateMaterialField("specification", e.target.value) }}
                                className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                readOnly={!isFieldEditable()}
                            />
                        </div>

                        {/* 기준단가 */}
                        <div className="col-span-2">
                            <label className={materialDetailLabel}>기준단가</label>
                            <input type="text" value={selectedMaterial?.unitPrice || ""}
                                onChange={(e) => { updateMaterialField("unitPrice", e.target.value) }}
                                className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                readOnly={!isFieldEditable()}
                            />
                        </div>
                        {/* 현재단가 */}
                        <div className="col-span-1">
                            <label className={materialDetailLabel}>현재단가</label>
                            <input type="text" value={selectedMaterial?.currentPrice || ""}
                                onChange={(e) => { updateMaterialField("currentPrice", e.target.value) }}
                                className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                readOnly={!isFieldEditable()}
                            />
                        </div>
                        {/* 최소재고 */}
                        <div className="col-span-1">
                            <label className={materialDetailLabel}>최소재고</label>
                            <input type="text" value={selectedMaterial?.minStockQuantity || ""}
                                onChange={(e) => { updateMaterialField("minStockQuantity", e.target.value) }}
                                className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                readOnly={!isFieldEditable()}
                            />
                        </div>
                        {/* 최대재고 */}
                        <div className="col-span-1">
                            <label className={materialDetailLabel}>최대재고</label>
                            <input type="text" value={selectedMaterial?.maxStockQuantity || ""}
                                onChange={(e) => { updateMaterialField("maxStockQuantity", e.target.value) }}
                                className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                readOnly={!isFieldEditable()}
                            />
                        </div>
                        {/* 현재고 */}
                        <div className="col-span-1">
                            <label className={materialDetailLabel}>현재고</label>
                            <input type="text" value={selectedMaterial?.currentStock || ""}
                                onChange={(e) => { updateMaterialField("currentStock", e.target.value) }}
                                className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                readOnly={!isFieldEditable()}
                            />
                        </div>
                        {/* 리드타임 */}
                        <div className="col-span-1">
                            <label className={materialDetailLabel}>리드타임</label>
                            <input type="text" value={selectedMaterial?.leadTime || ""}
                                onChange={(e) => { updateMaterialField("leadTime", e.target.value) }}
                                className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                readOnly={!isFieldEditable()}
                            />
                        </div>
                        {/* 공급업체 */}
                        <div className="col-span-2">
                            <label className={materialDetailLabel}>공급업체</label>
                            <input type="text" value={selectedMaterial?.supplierId || ""}
                                onChange={(e) => { updateMaterialField("supplierId", e.target.value) }}
                                className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                readOnly={!isFieldEditable()}
                            />
                        </div>
                        {/* 최근구매일 */}
                        <div className="col-span-1">
                            <label className={materialDetailLabel}>최근구매일</label>
                            <input type="text" value={selectedMaterial?.lastPurchaseDate || ""}
                                onChange={(e) => { updateMaterialField("lastPurchaseDate", e.target.value) }}
                                className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                readOnly={!isFieldEditable()}
                            />
                        </div>
                        {/* 비고 */}
                        <div className="col-span-3">
                            <label className={materialDetailLabel}>비고</label>
                            <input type="text" value={selectedMaterial?.remark || ""}
                                onChange={(e) => { updateMaterialField("remark", e.target.value) }}
                                className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                readOnly={!isFieldEditable()}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-x-4">
                        <button type="button"
                            onClick={() => handleUpdate(selectedMaterial.materialId)}
                            className="my-6 px-6 py-2 bg-rose-500 text-white font-medium rounded-lg 
                            shadow-md focus:outline-none hover:bg-red-600
                            focus:ring-2 focus:ring-red-400 focus:ring-offset-1 
                            transition duration-200 whitespace-nowrap">수정
                        </button>
                        <button type="button"
                            onClick={() => handleDelete(selectedMaterial.materialId)}
                            className="my-6 px-6 py-2 bg-rose-500 text-white font-medium rounded-lg 
                            shadow-md focus:outline-none hover:bg-red-600
                            focus:ring-2 focus:ring-red-400 focus:ring-offset-1 
                            transition duration-200 whitespace-nowrap">삭제
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}