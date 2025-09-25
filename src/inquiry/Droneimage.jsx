import React, { useState, useEffect, useCallback  } from 'react';
import axios from 'axios';

// API 요청
const API_BASE_URL = 'http://localhost:8083/api/proxy/drone-images';

function DroneImage() {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 모달에 띄울 이미지를 관리하는 state
    const [selectedImage, setSelectedImage] = useState(null);

    // 컴포넌트가 처음 화면에 나타날 때 서버에서 이미지 목록을 불러옵니다.
    const fetchImages = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(API_BASE_URL);
            setImages(response.data);
            setError(null);
        } catch (err) {
            console.error("이미지 목록을 불러오는 데 실패했습니다.", err);
            setError("이미지를 불러올 수 없습니다. 서버 연결을 확인해주세요.");
        } finally {
            setLoading(false);
        }
    }, []); // 의존성 배열이 비어있으므로, 이 함수는 처음 한 번만 생성됩니다.

    // useEffect는 이제 fetchImages를 호출만 합니다.
    useEffect(() => {
        fetchImages();
    }, [fetchImages]);

    // 이미지 삭제를 처리하는 함수
    const handleDelete = async (id) => {
        if (window.confirm(`정말로 이 이미지(ID: ${id})를 삭제하시겠습니까?`)) {
            try {
                await axios.delete(`${API_BASE_URL}/${id}`);
                // 화면에서도 바로 삭제된 것처럼 보이게 state를 업데이트합니다.
                setImages(images.filter(image => image.id !== id));
                alert('이미지가 성공적으로 삭제되었습니다.');
            } catch (err) {
                console.error("이미지 삭제에 실패했습니다.", err);
                alert('이미지 삭제 중 오류가 발생했습니다.');
            }
        }
    };


    if (loading) {
        return <div className="text-center p-10">로딩 중...</div>;
    }

    if (error) {
        return <div className="text-center p-10 text-red-500">{error}</div>;
    }

    return (
        // 최상위에 Fragment(<>)를 사용하여 모달을 포함시킵니다.
        <>
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">드론 촬영 이미지</h1>
                    <button
                        onClick={fetchImages}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                    >
                        새로고침
                    </button>
                </div>
                    
                {images.length === 0 ? (
                    <p>업로드된 이미지가 없습니다.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {images.map((image) => (
                            // group, relative 클래스 추가 및 클릭 이벤트 핸들러 연결
                            <div 
                                key={image.id} 
                                className="group relative border rounded-lg shadow-md overflow-hidden cursor-pointer"
                                onClick={() => setSelectedImage(image)}
                            >
                                <img
                                    src={`${API_BASE_URL}/${image.id}`}
                                    alt={image.originalFilename}
                                    // 호버 시 확대 효과 및 트랜지션 효과 추가
                                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="p-3">
                                    <p className="text-sm truncate" title={image.originalFilename}>
                                        {image.originalFilename}
                                    </p>
                                    <p className="text-xs text-gray-500">ID: {image.id}</p>
                                </div>
                                
                                {/* 삭제 버튼 */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation(); // 모달이 열리는 것을 방지
                                        handleDelete(image.id);
                                    }}
                                    // ✅ Tailwind CSS로 스타일링 및 호버 효과 적용
                                    className="absolute top-2 right-2 w-7 h-7 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-opacity-75"
                                >
                                    &times; {/* 'x' 모양 문자 */}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 이미지 상세 보기를 위한 모달 UI */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50"
                    onClick={() => setSelectedImage(null)} // 뒷 배경 클릭 시 모달 닫기
                >
                    <img
                        src={`${API_BASE_URL}/${selectedImage.id}`}
                        alt={selectedImage.originalFilename}
                        className="max-w-[90vw] max-h-[90vh] object-contain"
                        onClick={(e) => e.stopPropagation()} // 이미지 클릭 시 모달이 닫히지 않도록 함
                    />
                    <button 
                        className="absolute top-4 right-6 text-white text-4xl font-bold"
                        onClick={() => setSelectedImage(null)}
                    >
                        &times;
                    </button>
                </div>
            )}
        </>
    );
}

export default DroneImage;