/*
메뉴명 : 고객 등록 
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


const API_BASE = "http://localhost:8081/api/customers"; //백엔드 api 주소 
const LABEL_STYLE = "block text-sm font-medium text-gray-700 mb-1";
const INPUT_STYLE = "w-full rounded-lg border border-sky-500 shadow-sm px-4 py-2";

/*자주 쓰는 스타일*/
const customerDetailLabel = "block text-sm font-medium text-gray-700 mb-1";
const detailTextBox = "w-full rounded-lg border border-sky-500 shadow-sm px-4 py-2";

export default function CustomerRegister() {
    //상태 관리
    //전체 고객 목록
    const [customers, setCustomers] = useState([]);
    //선택된 고객 1명
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    //수정 모드 여부
    const [isEditing, setIsEditing] = useState(false);
    //조회조건 고객명
    const [searchCustomerNm, setSearchCustomerNm] = useState("");
    //조회 조건 등록날짜
    const [searchContractDate, setSearchContractDate] = useState("");

    // 전체 조회 실행 
    useEffect(() => {
        loadCustomers();
        console.log("전체 조회");
    }, []);
    // 전체 고객 목록 불러오기
    const loadCustomers = async () => {
        console.log(searchCustomerNm);
        console.log(searchContractDate);
        try {
            const { data } = await axios.get(API_BASE, {
                params: {
                    //조회조건에 고객명이 있을 때만 값을 보냄
                    //customerNm: searchCustomerNm || "",
                    //조회조건에 날짜가 있을 때만 값을 보냄
                    //customerDate: searchCustomerDate || 
                    customerNm: searchCustomerNm || undefined,
                    contractDate: searchContractDate || undefined,
                }
            }); //조회->Get방식, api/customers
            setCustomers(data); //상태에 저장
            //첫번째 고객 자동 선택 되서 상세 내용 보이게(이거안하면 상세내용안보임)
            if (data.length > 0) setSelectedCustomer(data[0]);
        } catch (err) {
            console.log("고객 목록 조회 실패", err);
        }
    };
    //선택된 고객이 바뀌면 상세조회 실행
    useEffect(() => {
        if (selectedCustomer?.customerId && !selectedCustomer?.isNew) {
            loadCustomerDetail(selectedCustomer.customerId);
        }
    }, [selectedCustomer, isEditing]);
    // 특정 고객 상세 조회
    const loadCustomerDetail = async (customerId) => {
        try {
            //customerId를 받아서 파라미터로 던진다
            const { data } = await axios.get(`${API_BASE}/${customerId}`);
        } catch (err) {
            console.error("고객 상세 조회 실패:", err);
        }
    };

    //행추가(새로운 고객 추가)
    const handleInsert = () => {
        const newCustomer = {
            id: "",
            customerId: "",
            customerNm: "",
            contractDate: new Date().toISOString().slice(0, 10), //오늘 날짜 기본값
            contactPerson: "",
            contactPhone: "",
            contactEmail: "",
            contactAddress: "",
            isNew: true, //신규 행여부 true
        };
        handleUpdate(selectedCustomer.customerId); //고객 상세정보 입력가능하세
        setCustomers([...customers, newCustomer]); //기존목록 + 새행
        setSelectedCustomer(newCustomer); //방금 추가한 행을 상세정보에 표시
    };

    //셀값 변경 핸들러 
    const handleCellChange = (rowIndex, field, value) => {
        setCustomers((prev) => {
            const updated = [...prev];
            updated[rowIndex] = { ...updated[rowIndex], [field]: value };
            console.log(rowIndex);
            console.log(field);
            console.log(value);
            return updated;
        })
    }

    //상세정보 입력창에서 값 변경시 실행
    const updateCustomerField = (field, value) => {
        setSelectedCustomer((prev) => ({ ...prev, [field]: value, }));
        setCustomers((prev) =>
            prev.map((c) =>
                c.customerId === selectedCustomer.customerId ? { ...c, [field]: value } : c
            )
        );
    };

    //전체 저장(목록 전체를 백엔드로 전송)
    const handleSave = async () => {
        try {
            await axios.post(`${API_BASE}/saveAll`, customers);
            alert("저장되었습니다.");
            loadCustomers(); //저장되고 나서 전체 조회
            //저장 후 저장된 데이터 select할걸지 
        } catch (err) {
            console.log("저장 실패", err, customers);
            alert("저장오류");
        }
    };
    //고객 수정
    const handleUpdate = () => {
        if (!selectedCustomer?.isNew) {
            setIsEditing(true);
        }
    }
    //고객 삭제
    const handleDelete = async (customerId) => {
        if (!window.confirm(`${customerId}고객을 정말 삭제하겠습니까?`)) return;
        try {
            await axios.delete(`${API_BASE}/${customerId}`);
            alert("삭제되었습니다.");
            loadCustomers(); //다시 전체 조회
        } catch (err) {
            console.log("삭제 오류", err);
            alert("삭제 오류");
        }
    }

    //표에 보여줄 컬럼 정의
    const columns = [
        { header: "고객ID", accessor: "customerId" },
        { header: "고객명", accessor: "customerNm" },
        { header: "등록날짜", accessor: "contractDate" },
    ];
    //수정가능한지 여부 
    const isFieldEditable = () => {
        return selectedCustomer?.isNew || isEditing; //추가나 수정일때만 true;
    }
    //화면 랜더링
    return (
        <div>
            <h2 className="font-bold mb-4">고객 등록</h2>
            <SearchLayout>
                <SearchTextBox label="고객명"
                    value={searchCustomerNm}
                    onChange={(e) => setSearchCustomerNm(e.target.value)}
                    readOnly={false}
                />
                <SearchDatePicker label="등록날짜"
                    value={searchContractDate}
                    onChange={(e) => { setSearchContractDate(e.target.value) }}
                />
                <SearchButton onClick={loadCustomers} />
                <InsertButton onClick={handleInsert} />
                <SaveButton onClick={handleSave} />
            </SearchLayout>

            {/*그리드*/}
            <div className="flex flex-col md:flex-row gap-4">
                {/*md:w-[35%] : 화면이 768px이상일때 35%너비*/}
                <div className="w-full overflow-x-auto ">
                    <BodyGrid className=""
                        columns={columns} data={customers}
                        onRowClick={(row) => setSelectedCustomer(row)}
                        selectedId={selectedCustomer?.customerId}
                        onCellChange={handleCellChange}
                        readOnly={true} />
                </div>
                <div className="border w-full md:w-[65%] rounded-2xl overflow-hidden shadow p-6 bg-white">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">고객 상세정보</h3>
                    <div className="grid grid-cols-3 gap-6">
                        {/* 고객ID */}
                        <div>
                            <label className={customerDetailLabel}>고객ID</label>
                            <input type="text" value={selectedCustomer?.customerId || ""}
                                onChange={(e) => { updateCustomerField("customerId", e.target.value) }}
                                className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                readOnly={!isFieldEditable()}
                            />
                        </div>
                        {/* 고객명 */}
                        <div>
                            <label className={customerDetailLabel}>고객명</label>
                            <input type="text" value={selectedCustomer?.customerNm || ""}
                                onChange={(e) => { updateCustomerField("customerNm", e.target.value) }}
                                className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                readOnly={!isFieldEditable()}
                            />
                        </div>
                        {/* 등록날짜 */}
                        <div>
                            <label className={customerDetailLabel}>등록날짜</label>
                            <input type="text" value={selectedCustomer?.contractDate || ""}
                                onChange={(e) => { updateCustomerField("contractDate", e.target.value) }}
                                className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                readOnly={!isFieldEditable()}
                            />
                        </div>
                        {/* 담당자명 */}
                        <div className="col-span-1">
                            <label className={customerDetailLabel}>담당자명</label>
                            <input type="text" value={selectedCustomer?.contactPerson || ""}
                                onChange={(e) => { updateCustomerField("contactPerson", e.target.value) }}
                                className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                readOnly={!isFieldEditable()}
                            />
                        </div>
                        {/* 연락처 */}
                        <div className="col-span-1">
                            <label className={customerDetailLabel}>연락처</label>
                            <input type="text" value={selectedCustomer?.contactPhone || ""}
                                onChange={(e) => { updateCustomerField("contactPhone", e.target.value) }}
                                className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                readOnly={!isFieldEditable()}
                            />
                        </div>
                        {/* 이메일 */}
                        <div className="col-span-3">
                            <label className={customerDetailLabel}>E-mail</label>
                            <input type="text" value={selectedCustomer?.contactEmail || ""}
                                onChange={(e) => { updateCustomerField("contactEmail", e.target.value) }}
                                className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                readOnly={!isFieldEditable()}
                            />
                        </div>
                        {/* 주소 */}
                        <div className="col-span-3">
                            <label className={customerDetailLabel}>주소</label>
                            <input type="text" value={selectedCustomer?.contactAddress || ""}
                                onChange={(e) => { updateCustomerField("contactAddress", e.target.value) }}
                                className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                readOnly={!isFieldEditable()}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-x-4">
                        <button type="button"
                            onClick={() => handleUpdate(selectedCustomer.customerId)}
                            className="my-6 px-6 py-2 bg-rose-500 text-white font-medium rounded-lg 
                            shadow-md focus:outline-none hover:bg-red-600
                            focus:ring-2 focus:ring-red-400 focus:ring-offset-1 
                            transition duration-200 whitespace-nowrap">수정
                        </button>
                        <button type="button"
                            onClick={() => handleDelete(selectedCustomer.customerId)}
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