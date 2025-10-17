import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import DronFullshot from '../img/drone_fullshot.png';

// 각 공정별 배경 이미지 import
import PROC1BG from '../img/PROC1.png';
import PROC2BG from '../img/PROC2.png';
import PROC3BG from '../img/PROC3.png';
import PROC4BG from '../img/PROC4.png';
import PROC5BG from '../img/PROC5.png';
import PROC6BG from '../img/PROC6.png';

const API_BASE_URL = 'http://localhost:8083/api/proxy/drone-images';

const processes = [
    { id: 'PROC_CUT', name: '절단', bg: PROC1BG },
    { id: 'PROC_PROC', name: '가공', bg: PROC2BG },
    { id: 'PROC_ASSY', name: '조립', bg: PROC3BG },
    { id: 'PROC_PAINT', name: '용접', bg: PROC4BG },
    { id: 'PROC_LOAD', name: '도장', bg: PROC5BG },
    { id: 'PROC_LAUNCH', name: '출하', bg: PROC6BG },
];

function DroneImage() {
    // ... (useState, fetchImages 등 다른 로직은 그대로 유지) ...
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isGridModalOpen, setIsGridModalOpen] = useState(false);
    const [selectedProcess, setSelectedProcess] = useState(null);

    const fetchImages = useCallback(async () => {
        try {
            const response = await axios.get(API_BASE_URL);
            setImages(Array.isArray(response.data) ? response.data : []);
            setError(null);
        } catch (err) {
            console.error("이미지 목록을 불러오는 데 실패했습니다.", err);
            setError("이미지를 불러올 수 없습니다. 서버 연결을 확인해주세요.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchImages(); }, [fetchImages]);

    const openGridModal = (process) => {
        setSelectedProcess(process);
        setIsGridModalOpen(true);
    };

    const closeGridModal = () => {
        setIsGridModalOpen(false);
        setSelectedProcess(null);
    };

    const handleDelete = async (id) => {
        if (window.confirm(`정말로 이 이미지(ID: ${id})를 삭제하시겠습니까?`)) {
            try {
                await axios.delete(`${API_BASE_URL}/${id}`);
                setImages(images.filter(image => image.id !== id));
                alert('이미지가 성공적으로 삭제되었습니다.');
            } catch (err) {
                console.error("이미지 삭제에 실패했습니다.", err);
                alert('이미지 삭제 중 오류가 발생했습니다.');
            }
        }
    };

    if (loading) return <div className="text-center p-10">로딩 중...</div>;
    if (error) return <div className="text-center p-10 text-red-500">{error}</div>;

    return (
        <>
            <div className="pt-2 pb-4 sm:pt-3 sm:pb-6 lg:pt-4 lg:pb-8">
                
                
                <div className="relative w-full h-[70vh] shadow-lg">
                    <img src={DronFullshot} alt="Drone Fullshot View" className="absolute inset-0 w-full h-full z-0" />
                    
                    <div className="absolute inset-0 z-10 p-10 grid grid-cols-3 grid-rows-2 gap-8">
                        {processes.map((process) => (
                            <div
                                key={process.id}
                                onClick={() => openGridModal(process)}
                                style={{
                                    backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${process.bg})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                }}
                                // --- ✅ [수정] hover 시 테두리 색상과 굵기를 변경합니다. ---
                                className={`
                                    flex items-center justify-center rounded-2xl 
                                    border border-white/20 shadow-xl cursor-pointer
                                    transition-all duration-300 ease-in-out
                                    hover:scale-105 hover:-translate-y-1 hover:shadow-2xl 
                                    hover:border-white hover:border-2 hover:border-opacity-100 // ✅ 추가/수정된 부분
                                `}
                            >
                                <span className="text-4xl font-bold text-white tracking-wider drop-shadow-lg">
                                    {process.name}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* 모달 창 부분은 변경 없습니다. */}
                    {isGridModalOpen && selectedProcess && (
                         <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 rounded-lg" onClick={closeGridModal}>
                            <div className="bg-white rounded-xl shadow-2xl w-9/12 h-11/12 flex flex-col" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-between items-center p-4 border-b">
                                    <h2 className="text-2xl font-bold text-gray-800">{selectedProcess.name} 공정 사진</h2>
                                    <button onClick={closeGridModal} className="text-gray-500 hover:text-gray-800 text-3xl">&times;</button>
                                </div>
                                <div className="overflow-y-auto" style={{ height: 'calc(100% - 61px)' }}>
                                    <div className="px-10 py-8 grid grid-cols-3 gap-4">
                                        {images
                                            .filter(image => image.process_id === selectedProcess.id)
                                            .map(image => (
                                                <div key={image.id} className="group relative rounded-lg overflow-hidden cursor-pointer" onClick={() => setSelectedImage(image)}>
                                                    <img src={`${API_BASE_URL}/${image.id}`} alt={image.originalFilename} className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105" />
                                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all"></div>
                                                    <p className="absolute bottom-0 left-0 bg-black bg-opacity-50 text-white text-xs p-1 w-full truncate">{image.originalFilename}</p>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {selectedImage && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[1000]" onClick={() => setSelectedImage(null)}>
                    <img src={`${API_BASE_URL}/${selectedImage.id}`} alt={selectedImage.originalFilename} className="max-w-[90vw] max-h-[90vh] object-contain" onClick={(e) => e.stopPropagation()} />
                    <button className="absolute top-4 right-6 text-white text-4xl font-bold" onClick={() => setSelectedImage(null)}>&times;</button>
                </div>
            )}
        </>
    );
}

export default DroneImage;