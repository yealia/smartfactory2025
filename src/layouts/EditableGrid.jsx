export default function EditableGrid({ columns, data, onChange }) {
    return (
        <table className="w-full border">
            <thead>
                <tr>
                    {columns.map(col => (
                        <th key={col.accessor} className="border p-2">{col.header}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.map((row, rowIndex) => (
                    <tr key={row._key || rowIndex}>
                        {columns.map(col => (
                            <td key={col.accessor} className="border p-1">
                                <input
                                    className="w-full"
                                    value={row[col.accessor] || ""}
                                    onChange={(e) => onChange(row._key, col.accessor, e.target.value)}
                                />
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
