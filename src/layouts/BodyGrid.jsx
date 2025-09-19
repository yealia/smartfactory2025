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
import React from "react";

export default function BodyGrid({
  columns,
  data = [],
  onRowClick,
  onCellChange,
  readOnly,
  tree = false,
  level = 0, // 들여쓰기 레벨

  // 정렬기능 추가
  sortConfig,
  onHeaderClick,
  selectedId, // selectedId prop 추가 (선택된 행 강조용)
  onRowDoubleClick, // onRowDoubleClick prop 추가
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
                key={col.accessor}
                className="p-3 text-sm font-semibold tracking-wide text-left cursor-pointer hover:bg-gray-100"
                onClick={() => onHeaderClick?.(col.accessor)} // 헤더 클릭 시 onHeaderClick 함수 호출
              >
                {col.header}

                {sortConfig?.key === col.accessor && (
                  <span>
                    {sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.length === 0 ?
            (
              <tr>
                <td colSpan={columns.length + 1} className="text-center py-4 text-gray-500">
                  데이터가 없습니다.
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                // 🔽 Fragment에 key 부여
                <React.Fragment key={row._key || rowIndex}>
                  <tr
                    onClick={() => onRowClick?.(row)}
                    className={`
                    divide-x-2
                    hover:bg-gray-50
                    ${selectedId === (row.projectId || row._key) ? 'bg-blue-100' // 행 선택 시 파란색
                      : (tree && expandedRows[row._key] ? "bg-purple-200" : "") // 트리 확장 시 보라색
                    }
                  `}
                  >
                    <td className="px-4 py-2 text-center">
                      {rowIndex + 1}
                    </td>

                    {columns.map((col) => (
                      // 🔽 colIndex 대신 accessor 사용 → key 충돌 방지
                      <td key={col.accessor} className={`px-4 py-2 ${tree && col.accessor === columns[0].accessor ? `pl-${level * 4}` : ""}`}>
                        {level > 0 && col.accessor === columns[0].accessor ? (
                          <>▶</>
                        ) : readOnly ? (
                          row[col.accessor] || ""
                        ) : (
                          <input
                            type="text"
                            value={row[col.accessor] || ""}
                            onChange={(e) => onCellChange?.(rowIndex, col.accessor, e.target.value)}
                            className="w-full bg-transparent outline-none border-none p-0 m-0"
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                </React.Fragment>
              ))
            )}
        </tbody>
      </table>
    </div >
  );
}

