import React, { useState, useEffect } from 'react';
import axios from 'axios';

// API 요청
const API_BASE_URL = 'http://localhost:8083/api/proxy/drone-images';

function DroneImage() {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 컴포넌트가 처음 화면에 나타날 때 서버에서 이미지 목록을 불러옵니다.
    useEffect(() => {
        const fetchImages = async () => {
            try {
                // 1. 서버의 이미지 '목록' API를 호출합니다.
                const response = await axios.get(`${API_BASE_URL}`);
                setImages(response.data); // 받아온 이미지 정보들을 state에 저장
            } catch (err) {
                console.error("이미지 목록을 불러오는 데 실패했습니다.", err);
                setError("이미지를 불러올 수 없습니다. 서버 연결을 확인해주세요.");
            } finally {
                setLoading(false); // 로딩 상태 종료
            }
        };

        fetchImages();
    }, []); // 빈 배열을 전달하여 최초 1회만 실행되도록 합니다.

    if (loading) {
        return <div className="text-center p-10">로딩 중...</div>;
    }

    if (error) {
        return <div className="text-center p-10 text-red-500">{error}</div>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl font-bold mb-6">드론 촬영 이미지</h1>
            {images.length === 0 ? (
                <p>업로드된 이미지가 없습니다.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {images.map((image) => (
                        <div key={image.id} className="border rounded-lg shadow-md overflow-hidden">
                            {/* 2. 각 이미지의 id를 사용해 이미지 조회 URL을 img 태그의 src로 지정합니다. */}
                            <img
                                src={`${API_BASE_URL}/${image.id}`}
                                alt={image.originalFilename}
                                className="w-full h-48 object-cover"
                            />
                            <div className="p-3">
                                <p className="text-sm truncate" title={image.originalFilename}>
                                    {image.originalFilename}
                                </p>
                                <p className="text-xs text-gray-500">ID: {image.id}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default DroneImage;