import React from "react";

function SearchDropdown() {
   return (
    <select className="rounded w-40 text-black">
          <option value="">전체</option>
          <option value="">원자재</option>
          <option value="">부품</option>
          <option value="">소모품</option>
    </select>
  );
}

export default SearchDropdown;