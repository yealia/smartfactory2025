export default function BodyGrid({columns, data=[], onRowClick, onCellChange}){

  

  return (
    <div className="rounded-2xl overflow-hidden shadow">
      <table className="table-auto">
        <thead className="bg-white ">
          <tr className="divide-x-2 border-b-4">
            {columns.map((col, i) => (
              <th key={i} className="px-4 py-2 text-left whitespace-nowrap whitespace-nowrap">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className= "divide-y">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-4 text-gray-500">
                데이터가 없습니다.
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={rowIndex} 
                onClick={()=>onRowClick?.(row)}
              className="divide-x-2 hover:bg-white">
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="px-4 py-2">
                    <input
                          type="text"
                          value={row[col.accessor] || ""}
                          onChange={(e) =>
                            onCellChange?.(rowIndex, col.accessor, e.target.value)
                          }
                          className="w-full bg-transparent outline-none border-none p-0 m-0"
                        />
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