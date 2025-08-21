export default function SearchTextBox({label}) {
  return (
    <div className="p-1 flex items-center gap-2">
      <span className="whitespace-nowrap">{label}</span>
      <input type="text" className="border rounded text-black w-40 px-2 py-1"/>
    </div>
  );
}