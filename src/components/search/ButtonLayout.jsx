export default function ButtonLayout({ onClick }) {
    return (
        <button type="button"
            onClick={onClick}
            className="px-6 py-2 bg-rose-500 text-white font-medium rounded-lg 
                 shadow-md focus:outline-none hover:bg-red-600
                 focus:ring-2 focus:ring-red-400 focus:ring-offset-1 
                 transition duration-200 whitespace-nowrap">저장
        </button>
    );
}

