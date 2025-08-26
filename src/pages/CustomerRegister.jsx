import { Children, use } from "react";
import SearchLayout from "../layouts/SearchLayout";
import SearchTextBox from "../components/search/SearchTextBox";
import SearchDatePicker from "../components/search/SearchDatePicker";

import BodyGrid from "../layouts/BodyGrid";
import CardView from "../layouts/CardView";
import { useEffect, useState } from "react";
import axios from "axios";
import SearchButton from "../components/search/SearchButton";
import InsertButton from "../components/search/InsertButton";
import SaveButton from "../components/search/SaveButton";


const API_BASE = "http://localhost:8081/api/customers";
const LABEL_STYLE = "block text-sm font-medium text-gray-700 mb-1";
const INPUT_STYLE = "w-full rounded-lg border border-sky-500 shadow-sm px-4 py-2";

const customerDetailLabel = "block text-sm font-medium text-gray-700 mb-1";

export default function CustomerRegister(){
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isEditing, setIsEditing] = useState(false);


    // 자재 목록 불러오기
    useEffect(() => {
        loadCustomers();
        console.log("전체 조회");
    }, []);

    const loadCustomers = async () => {
        try{
            const{data} = await axios.get(API_BASE);
            setCustomers(data);
            if(data.length > 0) setSelectedCustomer(data[0]);    
        }catch(err){
            console.log("고객 목록 조회 실패",err);
        }
    };
    // 디테일 조회
    const loadCustomerDetail = async (customerId) => {
        try {
            const { data}  = await axios.get(`${API_BASE}/${customerId}`);
            setSelectedCustomer(data);  // 상세 데이터 상태 세팅
        } catch (err) {
            console.error("고객 상세 조회 실패:", err);
        }
    };

    //행 선택 시 상세 조회
    useEffect(() => {
        if (selectedCustomer?.customerId && !selectedCustomer?.isNew) {
            loadCustomerDetail(selectedCustomer.customerId);
        }
    }, [selectedCustomer, isEditing]);

    //행추가
    const handleInsert = () => {
        const newCustomer = {
        id: "",                     
        customerId: "",    
        customerNm: "",
        contractDate: new Date().toISOString().slice(0, 10),
        contactPerson: "",
        contactPhone: "",
        contactEmail: "",
        contactAddress: "",
        isNew : true,
        };
        setCustomers([...customers, newCustomer]);
        setSelectedCustomer(newCustomer);
    };

    //셀값 변경 핸들러 
    const handleCellChange = (rowIndex, field, value) => {
        setCustomers((prev) => {
            const updated = [...prev];
            updated[rowIndex] = {...updated[rowIndex],[field]:value};
            return updated;
        })
    }

    //값 업데이트시 행도 업데이트 
    // CustomerRegister.jsx
    const updateCustomerField = (field, value) => {
        setSelectedCustomer((prev) => ({...prev, [field]: value,}));
        setCustomers((prev) => 
            prev.map((c) =>
            c.id === selectedCustomer.id ? { ...c, [field]: value } : c
            )
        );
    };

    //전체 저장
    const handleSave = async () => {
        try {
            await axios.post(`${API_BASE}/saveAll`, customers);
            alert("저장되었습니다.");
            loadCustomers();
        } catch (err) {
            console.log("저장 실패", err, customers);
            alert("저장오류");
        }
    };
    //수정


    //삭제
    const handleDelete = async(customerId) => {
        if(!window.confirm("정말 삭제?")) return;
        try{
            await axios.delete(`${API_BASE}/${customerId}`);
            alert("삭제되었습니다.");
            loadCustomers();
        }catch(err){
            console.log("삭제 오류",err);
            alert("삭제 오류");
        }
    }

    //컬럼정의 
    const columns = [
        { header: "No", accessor: "id" },
        { header: "고객ID", accessor: "customerId" },
        { header: "고객명", accessor: "customerNm" },
        { header: "등록날짜", accessor: "contractDate" },
    ];

    const detailTextBox = "w-full rounded-lg border border-sky-500 shadow-sm px-4 py-2";
    return(
        <div>
            <h2 className="font-bold mb-4">고객 등록</h2>
            <SearchLayout>
                <SearchTextBox label="고객명"/> 
                <SearchDatePicker label="등록날짜"/>    
                <SearchButton onClick={loadCustomers}/>  
                <InsertButton onClick={handleInsert}/>
                <SaveButton onClick={handleSave}/>
            </SearchLayout>

            {/*그리드*/}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-[30%] overflow-x-auto ">
                    <BodyGrid columns={columns} data={customers} className=""
                            onRowClick={(row)=>setSelectedCustomer(row)}
                            selectedId={selectedCustomer?.id}
                            onCellChange={handleCellChange}/>       
                </div>
                <div className="border w-full md:w-[70%] rounded-2xl overflow-hidden shadow p-6 bg-white">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">고객 상세정보</h3>
                    <div className="grid grid-cols-3 gap-6">
                        {/* 고객ID */}
                        <div>
                            <label className={customerDetailLabel}>고객ID</label>
                            <input type="text" value={selectedCustomer?.customerId || ""}
                                onChange={(e) => { updateCustomerField("customerId",e.target.value)}}
                                className={detailTextBox}
                            />
                        </div>
                        {/* 고객명 */}
                        <div>
                            <label className={customerDetailLabel}>고객명</label>
                            <input type="text" value={selectedCustomer?.customerNm || ""}
                                onChange={(e) => { updateCustomerField("customerNm",e.target.value)}}
                                className={detailTextBox}
                            />
                        </div>
                        {/* 등록날짜 */}
                        <div>
                            <label className={customerDetailLabel}>등록날짜</label>
                            <input type="text" value={selectedCustomer?.contractDate || ""}
                                onChange={(e) => { updateCustomerField("contractDate",e.target.value)}}
                                className={detailTextBox}
                            />
                        </div>
                        {/* 담당자명 */}
                        <div className="col-span-1">
                            <label className={customerDetailLabel}>담당자명</label>
                            <input type="text" value={selectedCustomer?.contactPerson || ""}
                                onChange={(e) => { updateCustomerField("contactPerson",e.target.value)}}
                                className={detailTextBox}
                            />
                        </div>
                        {/* 연락처 */}
                        <div className="col-span-1">
                            <label className={customerDetailLabel}>연락처</label>
                            <input type="text" value={selectedCustomer?.contactPhone || ""}
                                onChange={(e) => { updateCustomerField("contactPhone",e.target.value)}}
                                className={detailTextBox}
                            />
                        </div>
                        {/* 이메일 */}
                        <div className="col-span-3">
                            <label className={customerDetailLabel}>E-mail</label>
                            <input type="text" value={selectedCustomer?.contactEmail || ""}
                                onChange={(e) => { updateCustomerField("contactEmail",e.target.value)}}
                                className={detailTextBox}
                            />
                        </div>
                        {/* 주소 */}
                        <div className="col-span-3">
                            <label className={customerDetailLabel}>주소</label>
                            <input type="text" value={selectedCustomer?.contactAddress || ""}
                                onChange={(e) => { updateCustomerField("contactAddress",e.target.value)}}
                                className={detailTextBox}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-x-4">
                        <button type="button"
                            className="my-6 px-6 py-2 bg-rose-500 text-white font-medium rounded-lg 
                            shadow-md focus:outline-none hover:bg-red-600
                            focus:ring-2 focus:ring-red-400 focus:ring-offset-1 
                            transition duration-200 whitespace-nowrap">수정
                        </button>
                        <button type="button"
                            onClick={()=>handleDelete(selectedCustomer.customerId)}
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