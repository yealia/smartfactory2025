import { Children } from "react";
import SearchLayout from "../layouts/SearchLayout";
import SearchTextBox from "../components/search/SearchTextBox";
import BodyGrid from "../layouts/BodyGrid";
import CardView from "../layouts/CardView";
import { useEffect, useState } from "react";
import axios from "axios";

export default function CustomerRegister(){
    const [customers, setCustomers] = useState([]);
    // 자재 목록 불러오기
    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        const res = await axios.get("http://localhost:8081/api/customers");
        setCustomers(res.data);
    };

    //컬럼정의 
    const columns = [
        { header: "No", accessor: "id" },
        { header: "고객ID", accessor: "customerId" },
        { header: "고객명", accessor: "customerNm" },
        { header: "등록날짜", accessor: "contractDate" },
    ];

    return(
        <div>
            <h2 className="font-bold mb-4">고객 등록</h2>
            <SearchLayout>
                <SearchTextBox label="고객명"/>      
            </SearchLayout>

            {/*그리드*/}
            <div className="flex space-x-4">
                <div className="border-red-100 w-[40%]">
                    <BodyGrid columns={columns} data={customers} className=""/>
                </div>
                <div className="w-[70%]">
                    <CardView/>
                </div>
            </div>
            
        </div>
    );
}