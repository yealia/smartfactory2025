/*
트리 모드 지원 BodyGrid
props:
  - columns: [{ header: "자재명", accessor: "materialNm" }, ...]
  - data: 계층형 데이터 (children 포함 가능)
  - tree: boolean (트리 모드 여부)
  - onRowClick: 행 클릭 이벤트
  - onCellChange: 셀 수정 이벤트
  - readOnly: 읽기 전용 여부
*/

import { useState } from "react";

export default function BodyGrid({
  columns,
  data = [],
  onRowClick,
  onCellChange,
  readOnly,
  tree = false,
  level = 0, // 들여쓰기 레벨
}) {
  //각 row별 펼침 상태
  const [expandedRows, setExpandedRows] = useState({});
  //버튼 누른 행만 하위 펼쳐지게
  const toggleExpand = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="rounded-2xl overflow-hidden shadow">
      <table className="table-fixed w-full border-collapse">
        <thead className="bg-white">
          <tr className="divide-x-2 border-b-4">
            <th className="px-4 py-2 text-center w-12">No</th>
            {columns.map((col, i) => (
              <th
                key={i}
                className="px-4 py-2 text-left whitespace-nowrap"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + 1}
                className="text-center py-4 text-gray-500"
              >
                데이터가 없습니다.
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <>
                <tr
                  key={row._key || rowIndex}
                  onClick={() => onRowClick?.(row)}
                  className={`divide-x-2 ${tree && expandedRows[row._key] ? "bg-purple-200" : ""}`}>
                  {/* No or Expand Button */}
                  <td className="px-4 py-2 text-center">
                    {tree && row.children ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(row._key);
                        }}
                        className="text-blue-600 font-bold"
                      >
                        {expandedRows[row._key] ? "−" : "+"}
                      </button>
                    ) : (
                      rowIndex + 1
                    )}
                  </td>

                  {/* 데이터 셀 */}
                  {columns.map((col, colIndex) => (
                    <td
                      key={colIndex}
                      className={`px-4 py-2 ${tree && colIndex === 0 ? `pl-${level * 4}` : ""}`}
                    >
                      {colIndex === 0 && level > 0 ? (
                        <>▶</>
                      ) : readOnly ? (
                        row[col.accessor] || ""
                      ) : (
                        <input
                          type="text"
                          value={
                            row[col.accessor] || ""}
                          onChange={(e) =>
                            onCellChange?.(rowIndex, col.accessor, e.target.value)
                          }
                          className="w-full bg-transparent outline-none border-none p-0 m-0"
                        />
                      )}
                    </td>
                  ))}
                </tr>

                {/* 하위 children */}
                {tree &&
                  row.children &&
                  expandedRows[row._key] && (
                    <tr>
                      <td colSpan={columns.length + 1} className="p-0">
                        <BodyGrid
                          columns={columns}
                          data={row.children}
                          tree={true}
                          level={level + 1}
                          readOnly={readOnly}
                          onRowClick={onRowClick}
                          onCellChange={onCellChange}
                        />
                      </td>
                    </tr>
                  )}
              </>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
