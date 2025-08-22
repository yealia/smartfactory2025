export default function BodyGrid({columns, data=[]}){

  return (
    <div className="rounded-2xl overflow-hidden shadow">
      <table className="w-full">
        <thead className="bg-white ">
          <tr className="divide-x-2 border-b-4">
            {columns.map((col, i) => (
              <th key={i} className="px-4 py-2 text-left">
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
              <tr key={rowIndex} className="divide-x-2 hover:bg-white">
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="px-4 py-2">
                    {row[col.accessor]} {/* ← 여기서 매핑 */}
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