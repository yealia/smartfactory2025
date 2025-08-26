import React from "react";

function SearchLayout({children}){
    const childArray = React.Children.toArray(children);

    const inputs = childArray.filter(child => child.type.name == "SearchTextBox" || child.type.name =="SearchDatePicker");
    const buttons = childArray.filter(child => child.type.name == "SearchButton" 
                              || child.type.name == "InsertButton" 
                              || child.type.name == "SaveButton"
                            );

  return (
    <div className="rounded-2xl overflow-hidden bg-white p-4 shadow-sm mb-10">
      <div className=" grid grid-cols-10 gap-4 items-center">
        {/* 왼쪽 70% 영역 */}
        <div className=" col-span-8 grid grid-cols-4 gap-4">
          {inputs}
        </div>

        {/* 오른쪽 30% 영역 */}
        <div className=" pl-4 h-full flex items-start justify-center gap-2">
          {buttons}
        </div>
      </div>
    </div>
  );    
}
export default SearchLayout;