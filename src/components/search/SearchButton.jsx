export default function SearchButton({ onClick }) {
    return (
        <button type="button"
            onClick={onClick}
            className="px-6 py-2 bg-blue-500 text-white font-medium rounded-lg 
                 shadow-md hover:bg-blue-600 focus:outline-none 
                 focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 
                 transition duration-200 whitespace-nowrap">조회</button>
    );
}

