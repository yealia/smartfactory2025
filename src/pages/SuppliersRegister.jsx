/*
메뉴명 : 공급업체 등록 
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


const API_BASE = "http://localhost:8081/api/suppliers"; //백엔드 api 주소 
const LABEL_STYLE = "block text-sm font-medium text-gray-700 mb-1";
const INPUT_STYLE = "w-full rounded-lg border border-sky-500 shadow-sm px-4 py-2";

/*자주 쓰는 스타일*/
const supplierDetailLabel = "block text-sm font-medium text-gray-700 mb-1";
const detailTextBox = "w-full rounded-lg border border-sky-500 shadow-sm px-4 py-2";

export default function SupplierRegister() {
    //상태 관리
    //전체 공급업체 목록
    const [suppliers, setSuppliers] = useState([]);
    //선택된 공급업체 1명
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    //수정 모드 여부
    const [isEditing, setIsEditing] = useState(false);
    //조회조건 공급업체명
    const [searchSupplierNm, setSearchSupplierNm] = useState("");
    //조회 조건 등록날짜
    const [searchContactName, setsearchContactName] = useState("");

    // 전체 조회 실행 
    useEffect(() => {
        loadSuppliers();
        console.log("전체 조회");
    }, []);
    // 전체 공급업체 목록 불러오기
    const loadSuppliers = async () => {
        console.log(searchSupplierNm);
        try {
            const { data } = await axios.get(API_BASE, {
                params: {
                    //조회조건에 공급업체명이 있을 때만 값을 보냄
                    //supplierNm: searchSupplierNm || "",
                    //조회조건에 날짜가 있을 때만 값을 보냄
                    //supplierDate: searchSupplierDate || 
                    supplierNm: searchSupplierNm || undefined,
                    contactName: searchContactName || undefined,
                }
            }); //조회->Get방식, api/suppliers
            setSuppliers(data); //상태에 저장
            //첫번째 공급업체 자동 선택 되서 상세 내용 보이게(이거안하면 상세내용안보임)
            if (data.length > 0) setSelectedSupplier(data[0]);
        } catch (err) {
            console.log("공급업체 목록 조회 실패", err);
        }
    };
    //선택된 공급업체이 바뀌면 상세조회 실행
    useEffect(() => {
        if (selectedSupplier?.supplierId && !selectedSupplier?.isNew) {
            loadSupplierDetail(selectedSupplier.supplierId);
        }
    }, [selectedSupplier, isEditing]);
    // 특정 공급업체 상세 조회
    const loadSupplierDetail = async (supplierId) => {
        try {
            console.log("요청 보내는 supplierId:", supplierId);
            console.log(typeof supplierId);
            //supplierId를 받아서 파라미터로 던진다
            const { data } = await axios.get(`${API_BASE}/${supplierId}`);
        } catch (err) {

            console.error("공급업체 상세 조회 실패:", err);
        }
    };

    //행추가(새로운 공급업체 추가)
    const handleInsert = () => {
        const newSupplier = {
            id: "",
            supplierId: "",
            supplierNm: "",
            contractDate: new Date().toISOString().slice(0, 10), //오늘 날짜 기본값
            contactPerson: "",
            contactPhone: "",
            contactEmail: "",
            contactAddress: "",
            isNew: true, //신규 행여부 true
        };
        handleUpdate(selectedSupplier.supplierId); //공급업체 상세정보 입력가능하세
        setSuppliers([...suppliers, newSupplier]); //기존목록 + 새행
        setSelectedSupplier(newSupplier); //방금 추가한 행을 상세정보에 표시
    };

    //셀값 변경 핸들러 
    const handleCellChange = (rowIndex, field, value) => {
        setSuppliers((prev) => {
            const updated = [...prev];
            updated[rowIndex] = { ...updated[rowIndex], [field]: value };
            console.log(rowIndex);
            console.log(field);
            console.log(value);
            return updated;
        })
    }

    //상세정보 입력창에서 값 변경시 실행
    const updateSupplierField = (field, value) => {
        setSelectedSupplier((prev) => {
            const updated = { ...prev, [field]: value };

            // suppliers도 여기서 같이 갱신
            setSuppliers((prevSuppliers) =>
                prevSuppliers.map((c) =>
                    c.supplierId === updated.supplierId ? updated : c
                )
            );

            return updated;
        });
    };


    //전체 저장(목록 전체를 백엔드로 전송)
    const handleSave = async () => {
        try {
            await axios.post(`${API_BASE}/saveAll`, suppliers);
            alert("저장되었습니다.");
            loadSuppliers(); //저장되고 나서 전체 조회
            //저장 후 저장된 데이터 select할걸지 
        } catch (err) {
            console.log("저장 실패", err, suppliers);
            alert("저장오류");
        }
    };
    //공급업체 수정
    const handleUpdate = () => {
        if (!selectedSupplier?.isNew) {
            setIsEditing(true);
        }
    }
    //공급업체 삭제
    const handleDelete = async (supplierId) => {
        if (!window.confirm(`${supplierId}공급업체을 정말 삭제하겠습니까?`)) return;
        try {
            console.log(supplierId);
            await axios.delete(`${API_BASE}/${supplierId}`);
            alert("삭제되었습니다.");
            loadSuppliers(); //다시 전체 조회
        } catch (err) {
            console.log("삭제 오류", err);
            alert("삭제 오류");
        }
    }

    //표에 보여줄 컬럼 정의
    const columns = [
        //{ header: "공급업체ID", accessor: "supplierId" },
        { header: "공급업체명", accessor: "supplierNm" },
        { header: "담당자", accessor: "contactPerson" },
        { header: "등록날짜", accessor: "contractDate" },
    ];
    //수정가능한지 여부 
    const isFieldEditable = () => {
        return selectedSupplier?.isNew || isEditing; //추가나 수정일때만 true;
    }
    //화면 랜더링
    return (
        <div>
            <h2 className="font-bold mb-4">공급업체 등록</h2>
            <SearchLayout>
                <SearchTextBox label="공급업체명"
                    value={searchSupplierNm}
                    onChange={(e) => setSearchSupplierNm(e.target.value)}
                    readOnly={false}
                />
                <SearchDatePicker label="등록날짜"
                    value={searchContactName}
                    onChange={(e) => { setsearchContactName(e.target.value) }}
                />
                <SearchButton onClick={loadSuppliers} />
                <InsertButton onClick={handleInsert} />
                <SaveButton onClick={handleSave} />
            </SearchLayout>

            {/*그리드*/}
            <div className="flex flex-col md:flex-row gap-4">
                {/*md:w-[35%] : 화면이 768px이상일때 35%너비*/}
                <div className="w-full overflow-x-auto ">
                    <BodyGrid className=""
                        columns={columns} data={suppliers}
                        onRowClick={(row) => setSelectedSupplier(row)}
                        selectedId={selectedSupplier?.supplierId}
                        onCellChange={handleCellChange}
                        readOnly={true} />
                </div>
                <div className="border w-full md:w-[65%] rounded-2xl overflow-hidden shadow p-6 bg-white">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">공급업체 상세정보</h3>
                    <div className="grid grid-cols-3 gap-6">
                        {/* 공급업체ID */}
                        {/* <div>
                            <label className={supplierDetailLabel}>공급업체ID</label>
                            <input type="text" value={selectedSupplier?.supplierId || ""}
                                onChange={(e) => { updateSupplierField("supplierId", e.target.value) }}
                                className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                readOnly={!isFieldEditable()}
                            />
                        </div> */}
                        {/* 공급업체명 */}
                        <div>
                            <label className={supplierDetailLabel}>공급업체명</label>
                            <input type="text" value={selectedSupplier?.supplierNm || ""}
                                onChange={(e) => { updateSupplierField("supplierNm", e.target.value) }}
                                className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                readOnly={!isFieldEditable()}
                            />
                        </div>
                        {/* 등록날짜 */}
                        <div>
                            <label className={supplierDetailLabel}>등록날짜</label>
                            <input type="text" value={selectedSupplier?.contractDate || ""}
                                onChange={(e) => { updateSupplierField("contractDate", e.target.value) }}
                                className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                readOnly={!isFieldEditable()}
                            />
                        </div>
                        {/* 담당자명 */}
                        <div className="col-span-1">
                            <label className={supplierDetailLabel}>담당자명</label>
                            <input type="text" value={selectedSupplier?.contactPerson || ""}
                                onChange={(e) => { updateSupplierField("contactPerson", e.target.value) }}
                                className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                readOnly={!isFieldEditable()}
                            />
                        </div>
                        {/* 연락처 */}
                        <div className="col-span-1">
                            <label className={supplierDetailLabel}>연락처</label>
                            <input type="text" value={selectedSupplier?.contactPhone || ""}
                                onChange={(e) => { updateSupplierField("contactPhone", e.target.value) }}
                                className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                readOnly={!isFieldEditable()}
                            />
                        </div>
                        {/* 이메일 */}
                        <div className="col-span-3">
                            <label className={supplierDetailLabel}>E-mail</label>
                            <input type="text" value={selectedSupplier?.contactEmail || ""}
                                onChange={(e) => { updateSupplierField("contactEmail", e.target.value) }}
                                className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                readOnly={!isFieldEditable()}
                            />
                        </div>
                        {/* 주소 */}
                        <div className="col-span-3">
                            <label className={supplierDetailLabel}>주소</label>
                            <input type="text" value={selectedSupplier?.contactAddress || ""}
                                onChange={(e) => { updateSupplierField("contactAddress", e.target.value) }}
                                className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                readOnly={!isFieldEditable()}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-x-4">
                        <button type="button"
                            onClick={() => handleUpdate(selectedSupplier.supplierId)}
                            className="my-6 px-6 py-2 bg-rose-500 text-white font-medium rounded-lg 
                            shadow-md focus:outline-none hover:bg-red-600
                            focus:ring-2 focus:ring-red-400 focus:ring-offset-1 
                            transition duration-200 whitespace-nowrap">수정
                        </button>
                        <button type="button"
                            onClick={() => handleDelete(selectedSupplier.supplierId)}
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