/*
그리드 컴포넌트(그리드 쓸때 가지고 가서 셋팅해서 사용.)
각 셀에 글자 셋팅 가능함. 
props : 부모 컴포넌트가 내려주는 값들.
<tr> : 표의 한줄(행)
<th> : 표의 제목 칸
<td> : 표의 내용 칸
*/
export default function BodyGrid({ columns, data = [], onRowClick, onCellChange, readOnly }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow">
      {/*테이블 생성*/}
      <table className="table-fixed w-full border-collapse" readOnly={readOnly}>
        {/*thead : 표의 머리 부분*/}
        <thead className="bg-white ">
          {/*tr : Table Row 표의 한줄*/}
          <tr className="divide-x-2 border-b-4">
            {/*헤더 랜더링
              map : 배열 안의 값들을 반복하면서 새로운 결과를 만들어줌.
                    columns 배열 반복해서 <th>태그를 여러개 만듬
                    => 즉, "고객ID", "고객명" 같은 표의 제목 줄을 자동으로 생성
            */}
            <th className="px-4 py-2 text-center">No</th>
            {columns.map((col, i) => (
              /*th : Table Header 표의 제목 한칸*/
              <th key={i} className="px-4 py-2 text-left whitespace-nowrap whitespace-nowrap">
                {col.header} {/*화면에 보일 컬럼명*/}
              </th>
            ))}
          </tr>
        </thead>
        {/*tbody : 표의 본문 부분*/}
        <tbody className="divide-y">
          {/*표의 데이터가 없을 경우*/}
          {data.length === 0 ? (
            <tr>
              {/*td : Table Data 표의 내용 한 칸*/}
              <td colSpan={columns.length} className="text-center py-4 text-gray-500">
                데이터가 없습니다.
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => ( /*데이터 배열을 반복해서 행<tr>을 여러개 만듦.*/
              <tr key={rowIndex} onClick={() => onRowClick?.(row)} className="divide-x-2 hover:bg-white">
                {/*NO컬럼 자동 증가 번호(의미는 없으나 시각적으로 몇개의 데이터가 있는지)*/}
                <td className="px-4 py-2 text-center">{rowIndex + 1}</td>
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="px-4 py-2">
                    {readOnly ? (
                      row[col.accessor] || ""
                    ) : (
                      <input
                        type="text"
                        value={row[col.accessor] || ""} //현재 행의 해당 값 표시
                        onChange={(e) => //사용자가 입력하면 부모에게 알림, OnCellChange 실행
                          onCellChange?.(rowIndex, col.accessor, e.target.value)
                        }
                        className="w-full bg-transparent outline-none border-none p-0 m-0"
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}