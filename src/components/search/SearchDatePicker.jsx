export default function SearchDatePicker({ label, onChange, value }) {
  return (
    <div className="p-1 flex items-center gap-2">
      <span className="whitespace-nowrap">{label}</span>
      <input type="date"
        value={value || ""}
        onChange={onChange}
        className="border rounded text-black w-40 px-2 py-1"
      />
    </div>
  );
}
