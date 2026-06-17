

import React, { useEffect, useState } from 'react';
import { useDeleteTeacherDocument, useUploadTeacherDocument } from '../api/teacherDocuments.api';
import { PermissionGuard } from '@shared/components/PermissionGuard';

const TeacherDocumentsComp = ({ teacherData, setAllTeachers }) => {
    const deleteTeacherDocsMutaion = useDeleteTeacherDocument();
    let uploadTeacherDocsMutation = useUploadTeacherDocument()

    const [selectedFiles, setSelectedFiles] = useState([]); // Array of File objects
    const [isUploading, setIsUploading] = useState(false);
    let [teacherDocuemntImages, setTeacherDocumentImages] = useState([])
    const [previewImage, setPreviewImage] = useState(null);

    const closePreview = () => setPreviewImage(null);

    useEffect(() => {
        setTeacherDocumentImages(teacherData?.documents)
    }, [teacherData])

    // 1. Handle selection of files
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(prev => [...prev, ...files]);
    };

    // 2. Upload Logic
    const handleUpload = async () => {
        if (selectedFiles.length === 0) return;

        try {
            setIsUploading(true);
            const formData = new FormData();

            // Matches 'teacherDocId' in your controller
            formData.append("teacherDocId", teacherData._id);

            // Append each file to the 'documents' key (must match multer upload.array('documents'))
            selectedFiles.forEach((file) => {
                formData.append("documents", file);
            });



            await uploadTeacherDocsMutation.mutateAsync(formData)


            setSelectedFiles([]);

        } catch (error) {
            console.error("Upload error:", error);
        } finally {
            setIsUploading(false);
        }
    };








    const handleDelete = async (fileName) => {
        await deleteTeacherDocsMutaion.mutateAsync({ teacherDocId: teacherData._id, fileName: fileName })
    };




    return (
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm relative overflow-hidden">
            {/* Header Area */}
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div>
                    <h3 className="text-[11px] font-black text-cyan-600 uppercase tracking-[0.2em]">Media Assets</h3>
                    <div className="h-0.5 w-8 bg-cyan-500 mt-1 rounded-full" />
                </div>

                <PermissionGuard permission={"teacher-documents-create"}>
                    <div className="flex gap-3">
                        <label className="cursor-pointer px-5 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-bold rounded-xl hover:bg-white hover:border-cyan-500/50 transition-all flex items-center gap-2">
                            <input
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleFileChange}
                                accept="image/*"
                            />
                            <span>＋ SELECT IMAGES</span>
                        </label>

                        {selectedFiles.length > 0 && (
                            <button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="px-5 py-2.5 bg-cyan-600 text-white text-[11px] font-bold rounded-xl hover:bg-cyan-700 shadow-lg shadow-cyan-200 transition-all disabled:bg-slate-400"
                            >
                                {isUploading ? "UPLOADING..." : `UPLOAD ${selectedFiles.length} ASSETS`}
                            </button>
                        )}
                    </div>
                </PermissionGuard>
            </div>

            {/* Content Area - Previews of NEW files */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                {selectedFiles.map((file, index) => (
                    <div key={`new-${index}`} className="relative aspect-square rounded-3xl overflow-hidden border-2 border-dashed border-cyan-200 bg-cyan-50/30">
                        <img
                            src={URL.createObjectURL(file)}
                            alt="Preview"
                            className="w-full h-full object-cover opacity-60"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="bg-white/80 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-black text-cyan-600 uppercase">New</span>
                        </div>
                        <button
                            onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))}
                            className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full shadow-md text-slate-400 hover:text-red-500 flex items-center justify-center text-xs"
                        >✕</button>
                    </div>
                ))}
            </div>

            {/* SECOND DIV: Existing Images */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 border-t border-slate-100 pt-8">
                {teacherDocuemntImages?.map((imgName, index) => (
                    <div key={index} className="group relative aspect-square rounded-3xl  border border-slate-100 bg-slate-50 shadow-sm cursor-pointer">
                        {/* Main Image Clickable for Preview */}
                        <img
                            src={`http:///uploads/${imgName}`}
                            alt="Teacher document"
                            onClick={() => setPreviewImage(`http:///uploads/${imgName}`)}
                            className="w-full h-full object-cover transition-transform  duration-500 group-hover:scale-105"
                        />

                        {/* Hover Delete Button (Top Right) */}
                        <PermissionGuard permission={"teacher-documents-delete"}></PermissionGuard>

                        {/* Bottom Label (Optional, shown on hover) */}
                        <div className="absolute bottom-0 left-0 right-0 rounded-b-2xl p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <span className="text-[8px] text-white font-medium truncate block px-2">
                                {imgName}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* 3. FULL SCREEN PREVIEW MODAL */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-[999] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300"
                    onClick={closePreview}
                >
                    <button
                        className="absolute top-8 right-8 text-white/70 hover:text-white transition-colors"
                        onClick={closePreview}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <img
                        src={previewImage}
                        className="max-w-[80vw] h-[80vh] rounded-2xl shadow-2xl object-contain animate-in zoom-in-95 duration-300"
                        alt="Large preview"
                    />
                </div>
            )}
        </section>
    );
};

export default TeacherDocumentsComp;