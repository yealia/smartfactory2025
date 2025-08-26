export default function InsertButton({onClick}){
    return (
        <button onClick={onClick}
                className="px-6 py-2 bg-blue-500 text-white font-medium rounded-lg 
                 shadow-md hover:bg-blue-600 focus:outline-none 
                 focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 
                 transition duration-200 whitespace-nowrap">추가</button>
    );
}