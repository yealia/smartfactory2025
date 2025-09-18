/*
메뉴명 : 고객 등록 
*/
import { useEffect, useState } from "react";
import axios from "axios";
import SearchLayout from "../layouts/SearchLayout";
import SearchTextBox from "../components/search/SearchTextBox";
import SearchDatePicker from "../components/search/SearchDatePicker";
import BodyGrid from "../layouts/BodyGrid";
import SearchButton from "../components/search/SearchButton";
import InsertButton from "../components/search/InsertButton";
import SaveButton from "../components/search/SaveButton";

const API_BASE = "http://localhost:8081/api/customers";

const customerDetailLabel = "block text-sm font-medium text-gray-700 mb-1";
const detailTextBox = "w-full rounded-lg border border-sky-500 shadow-sm px-4 py-2";

export default function CustomerRegister() {
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [searchCustomerNm, setSearchCustomerNm] = useState("");
    const [searchContractDate, setSearchContractDate] = useState("");

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            const { data } = await axios.get(API_BASE, {
                params: {
                    customerNm: searchCustomerNm || undefined,
                    contractDate: searchContractDate || undefined,
                }
            });
            setCustomers(data);
            if (data.length > 0) {
                setSelectedCustomer(data[0]);
            } else {
                setSelectedCustomer(null);
            }
        } catch (err) {
            console.error("고객 목록 조회 실패", err);
        }
    };

    const handleInsert = () => {
        const newCustomer = {
            isNew: true,
            customerId: "",
            customerNm: "",
            businessRegistration: "",
            contractDate: new Date().toISOString().slice(0, 10),
            countryCode: "KR",
            status: "ACTIVE",
            contactPerson: "",
            contactPhone: "",
            contactEmail: "",
            contactAddress: "",
            remark: "",
        };
        setIsEditing(true);
        setCustomers(prev => [...prev, newCustomer]);
        setSelectedCustomer(newCustomer);
    };

    const updateCustomerField = (field, value) => {
        const updatedCustomer = { ...selectedCustomer, [field]: value };
        setSelectedCustomer(updatedCustomer);

        setCustomers(prev =>
            prev.map(c =>
                (c.isNew && c.customerNm === selectedCustomer.customerNm) || (c.customerId === selectedCustomer.customerId)
                ? updatedCustomer : c
            )
        );
    };

    const handleUpdateClick = async () => {
        if (!selectedCustomer || selectedCustomer.isNew) {
            alert("수정할 기존 고객을 선택해주세요.");
            return;
        }

        if (!isEditing) {
            setIsEditing(true);
            return;
        }

        try {
            await axios.put(`${API_BASE}/${selectedCustomer.customerId}`, selectedCustomer);
            alert("고객 정보가 성공적으로 수정되었습니다.");
            setIsEditing(false);
            loadCustomers();
        } catch (err) {
            console.error("수정 실패:", err);
            alert("수정 중 오류가 발생했습니다.");
        }
    };

    const handleSaveNew = async () => {
        const newCustomers = customers.filter(c => c.isNew);

        if (newCustomers.length === 0) {
            alert("저장할 신규 항목이 없습니다.");
            return;
        }

        if (!newCustomers[0].customerId || !newCustomers[0].customerNm || !newCustomers[0].businessRegistration) {
            alert("고객ID, 고객명, 사업자등록번호는 필수입니다.");
            return;
        }

        try {
            await axios.post(`${API_BASE}/saveAll`, newCustomers);
            alert("신규 고객이 저장되었습니다.");
            loadCustomers();
        } catch (err) {
            console.error("신규 저장 실패:", err);
            alert("신규 저장 중 오류가 발생했습니다.");
        }
    };

    const handleDelete = async () => {
        if (!selectedCustomer || !selectedCustomer.customerId) {
            alert("삭제할 고객을 선택해주세요.");
            return;
        }

        const { customerId, customerNm } = selectedCustomer;

        if (!window.confirm(`고객 '${customerNm}' (ID: ${customerId})을(를) 정말 삭제하시겠습니까?`)) {
            return;
        }

        try {
            await axios.delete(`${API_BASE}/${customerId}`);
            alert("삭제되었습니다.");
            loadCustomers();
        } catch (err) {
            console.error("삭제 오류", err);
            alert("삭제 중 오류가 발생했습니다. (관련 데이터가 있을 수 있습니다)");
        }
    };

    const handleRowClick = (row) => {
        setSelectedCustomer(row);
        setIsEditing(false);
    }

    const columns = [
        { header: "고객ID", accessor: "customerId" },
        { header: "고객명", accessor: "customerNm" },
        { header: "등록날짜", accessor: "contractDate" },
    ];

    const isFieldEditable = () => selectedCustomer?.isNew || isEditing;

    return (
        <div>
            <h2 className="font-bold text-xl mb-4">고객 등록</h2>
            <SearchLayout>
                <SearchTextBox
                    label="고객명"
                    value={searchCustomerNm}
                    onChange={(e) => setSearchCustomerNm(e.target.value)}
                />
                <SearchDatePicker
                    label="등록날짜"
                    value={searchContractDate}
                    onChange={(e) => setSearchContractDate(e.target.value)}
                />
                <SearchButton onClick={loadCustomers} />
                <InsertButton onClick={handleInsert} />
                <SaveButton onClick={handleSaveNew} />
            </SearchLayout>

            <div className="flex flex-col md:flex-row gap-4 mt-4">
                <div className="w-full md:w-[35%] overflow-x-auto">
                    <BodyGrid
                        columns={columns}
                        data={customers}
                        onRowClick={handleRowClick}
                        selectedId={selectedCustomer?.customerId}
                    />
                </div>
                <div className="border w-full md:w-[65%] rounded-2xl overflow-hidden shadow p-6 bg-white">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">고객 상세정보</h3>
                        {selectedCustomer && !selectedCustomer.isNew && (
                             <div className="flex gap-x-2">
                                <button type="button" onClick={handleUpdateClick} className="px-4 py-2 bg-blue-500 text-white font-medium rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400">
                                    {isEditing ? "수정 완료" : "수정"}
                                </button>
                                <button type="button" onClick={handleDelete} className="px-4 py-2 bg-rose-500 text-white font-medium rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400">
                                    삭제
                                </button>
                            </div>
                        )}
                    </div>

                    {selectedCustomer ? (
                        <div className="grid grid-cols-3 gap-6">
                            <div>
                                <label className={customerDetailLabel}>고객ID</label>
                                <input type="text" value={selectedCustomer.customerId || ""}
                                    onChange={(e) => updateCustomerField("customerId", e.target.value)}
                                    className={`${detailTextBox} ${!selectedCustomer.isNew ? "bg-gray-100" : "bg-white"}`}
                                    readOnly={!selectedCustomer.isNew}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className={customerDetailLabel}>고객명</label>
                                <input type="text" value={selectedCustomer.customerNm || ""}
                                    onChange={(e) => updateCustomerField("customerNm", e.target.value)}
                                    className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                    readOnly={!isFieldEditable()}
                                />
                            </div>
                            <div>
                                <label className={customerDetailLabel}>사업자등록번호</label>
                                <input type="text" value={selectedCustomer.businessRegistration || ""}
                                    onChange={(e) => updateCustomerField("businessRegistration", e.target.value)}
                                    className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                    readOnly={!isFieldEditable()}
                                />
                            </div>
                            <div>
                                <label className={customerDetailLabel}>등록날짜</label>
                                <input type="date" value={selectedCustomer.contractDate || ""}
                                    onChange={(e) => updateCustomerField("contractDate", e.target.value)}
                                    className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                    readOnly={!isFieldEditable()}
                                />
                            </div>
                            <div>
                                <label className={customerDetailLabel}>상태</label>
                                <select value={selectedCustomer.status || "ACTIVE"}
                                    onChange={(e) => updateCustomerField("status", e.target.value)}
                                    className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                    disabled={!isFieldEditable()}
                                >
                                    <option value="ACTIVE">ACTIVE</option>
                                    <option value="INACTIVE">INACTIVE</option>
                                </select>
                            </div>
                            <div className="col-span-1">
                                <label className={customerDetailLabel}>담당자명</label>
                                <input type="text" value={selectedCustomer.contactPerson || ""}
                                    onChange={(e) => updateCustomerField("contactPerson", e.target.value)}
                                    className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                    readOnly={!isFieldEditable()}
                                />
                            </div>
                            <div className="col-span-1">
                                <label className={customerDetailLabel}>연락처</label>
                                <input type="text" value={selectedCustomer.contactPhone || ""}
                                    onChange={(e) => updateCustomerField("contactPhone", e.target.value)}
                                    className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                    readOnly={!isFieldEditable()}
                                />
                            </div>
                            <div className="col-span-3">
                                <label className={customerDetailLabel}>E-mail</label>
                                <input type="email" value={selectedCustomer.contactEmail || ""}
                                    onChange={(e) => updateCustomerField("contactEmail", e.target.value)}
                                    className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                    readOnly={!isFieldEditable()}
                                />
                            </div>
                            <div className="col-span-3">
                                <label className={customerDetailLabel}>주소</label>
                                <input type="text" value={selectedCustomer.contactAddress || ""}
                                    onChange={(e) => updateCustomerField("contactAddress", e.target.value)}
                                    className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                    readOnly={!isFieldEditable()}
                                />
                            </div>
                            <div className="col-span-3">
                                <label className={customerDetailLabel}>비고</label>
                                <textarea value={selectedCustomer.remark || ""}
                                    onChange={(e) => updateCustomerField("remark", e.target.value)}
                                    className={`${detailTextBox} ${!isFieldEditable() ? "bg-gray-100" : "bg-white"}`}
                                    readOnly={!isFieldEditable()}
                                    rows={3}
                                />
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500">고객을 선택하거나 '행추가' 버튼으로 신규 고객을 등록하세요.</p>
                    )}
                </div>
            </div>
        </div>
    );
}