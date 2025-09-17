
import { useState, useEffect } from "react";
import BodyGrid from "../layouts/BodyGrid";
import SearchLayout from "../layouts/SearchLayout";
import SearchButton from "../components/search/SearchButton";
import axios from "axios";

export default function InventoryMovement() {
    const [movements, setmovements] = useState([]);

    const API_BASE = "http://localhost:8081/api/movement"; //백엔드 api 주소 


    // 테이블 컬럼 정의
    const columns = [
        { header: "이력ID", accessor: "movementId" },
        { header: "발생일시", accessor: "occurredAt" },
        { header: "이력유형", accessor: "movementType" },
        { header: "자재ID", accessor: "materialId" },
        { header: "수량", accessor: "qty" },
        { header: "출고창고", accessor: "warehouseFrom" },
        { header: "입고창고", accessor: "warehouseTo" },
        { header: "출고위치", accessor: "locationFrom" },
        { header: "입고위치", accessor: "locationTo" },
        { header: "출처유형", accessor: "sourceType" },
        { header: "발주ID", accessor: "purchaseOrderId" },
        { header: "상세ID", accessor: "orderDetailId" },
        { header: "검사ID", accessor: "qcId" },
        { header: "처리자", accessor: "userId" },
        { header: "비고", accessor: "remark" },
        { header: "멱등키", accessor: "idempotencyKey" },
    ];
    //전체 조회
    useEffect(() => {
        loadMovement();
    }, [])
    // 전체 BOM 목록 불러오기
    const loadMovement = async () => {
        try {
            const { data } = await axios.get(API_BASE, {
                params: {
                }
            });
            setmovements(data); //상태에 저장
            console.log(data);
            //console.log(data[0].vesselId);
        } catch (err) {
            console.log("공급업체 목록 조회 실패", err);
        }
    };
    const onRowClick = () => {

    }
    const onCellChange = () => {

    }
    return (
        <div className="w-screen h-screen p-4 bg-gray-50 space-y-4">
            <div className="flex">
                <h2 className="text-xl font-semibold">재고 원장</h2>
                <SearchLayout>
                    <SearchButton onClick={loadMovement} />
                </SearchLayout>
            </div>

            {/* {err && (
                <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-red-700">
                    {err}
                </div>
            )} */}
            
            <BodyGrid className=""
                columns={columns}
                data={movements}
                readOnly={true}     // 조회 전용. 수정하려면 false로 바꾸고 저장 로직 추가
                tree={false}
                onRowClick={onRowClick}
                onCellChange={onCellChange}
            />
        </div>
    );
}