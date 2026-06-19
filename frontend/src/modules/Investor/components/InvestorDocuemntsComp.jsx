

import React, { useEffect, useState } from 'react';
import { useDeleteMemberDocumentMutation, useUploadMemberDocumentMutation } from '../../member/api/member.rtk.api.js';
import { PermissionGuard } from '@shared/components/PermissionGuard';
import { backendBaseUrl } from '@shared/constants/constants';

const MemberDocumentsComp = ({ memberData, setAllMembers }) => {
    const [deleteMemberDocument] = useDeleteMemberDocumentMutation();
    let [uploadMemberDocument] = useUploadMemberDocumentMutation()

    const [selectedFiles, setSelectedFiles] = useState([]); // Array of File objects
    const [isUploading, setIsUploading] = useState(false);
    let [memberDocuemntImages, setMemberDocumentImages] = useState([])
    const [previewImage, setPreviewImage] = useState(null);

    const closePreview = () => setPreviewImage(null);

    useEffect(() => {
        setMemberDocumentImages(memberData?.documents)
    }, [memberData])

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

            // Matches 'memberDocId' in your controller
            formData.append("memberDocId", memberData._id);

            // Append each file to the 'documents' key (must match multer upload.array('documents'))
            selectedFiles.forEach((file) => {
                formData.append("documents", file);
            });



            await uploadMemberDocument(formData).unwrap()


            setSelectedFiles([]);

        } catch (error) {
            console.error("Upload error:", error);
        } finally {
            setIsUploading(false);
        }
    };








    const handleDelete = async (fileName) => {
        await deleteMemberDocument({ memberDocId: memberData._id, fileName: fileName }).unwrap()
    };




    return (
        <section className="bg-surface p-8 rounded-[2.5rem] border border-edge/60 shadow-sm relative overflow-hidden">
            {/* Header Area */}
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div>
                    <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Media Assets</h3>
                    <div className="h-0.5 w-8 bg-primary-muted mt-1 rounded-full" />
                </div>

                <PermissionGuard permission={"member-documents-create"}>
                    <div className="flex gap-3">
                        <label className="cursor-pointer px-5 py-2.5 bg-surface-muted border border-edge text-ink-muted text-[11px] font-bold rounded-xl hover:bg-surface hover:border-edge-brand/50 transition-all flex items-center gap-2">
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
                                className="px-5 py-2.5 bg-primary text-primary-foreground text-[11px] font-bold rounded-xl hover:bg-primary shadow-lg shadow-sm transition-all disabled:bg-text-subtle"
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
                    <div key={`new-${index}`} className="relative aspect-square rounded-3xl overflow-hidden border-2 border-dashed border-edge-brand bg-primary-muted/30">
                        <img
                            src={URL.createObjectURL(file)}
                            alt="Preview"
                            className="w-full h-full object-cover opacity-60"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="bg-surface/80 app-backdrop px-2 py-1 rounded-lg text-[10px] font-black text-primary uppercase">New</span>
                        </div>
                        <button
                            onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))}
                            className="absolute top-2 right-2 w-6 h-6 bg-surface rounded-full shadow-md text-ink-subtle hover:text-danger flex items-center justify-center text-xs"
                        >✕</button>
                    </div>
                ))}
            </div>

            {/* SECOND DIV: Existing Images */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 border-t border-edge pt-8">
                {memberDocuemntImages?.map((imgName, index) => (
                    <div key={index} className="group relative aspect-square rounded-3xl  border border-edge bg-surface-muted shadow-sm cursor-pointer">
                        {/* Main Image Clickable for Preview */}
                        <img
                            src={`http://localhost:4000/uploads/${imgName}`}
                            alt="Member document"
                            onClick={() => setPreviewImage(`http://localhost:4000/uploads/${imgName}`)}
                            className="w-full h-full object-cover transition-transform  duration-500 group-hover:scale-105"
                        />

                        {/* Hover Delete Button (Top Right) */}
                        <PermissionGuard permission={"member-documents-delete"}></PermissionGuard>

                        {/* Bottom Label (Optional, shown on hover) */}
                        <div className="absolute bottom-0 left-0 right-0 rounded-b-2xl p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <span className="text-[8px] text-primary-foreground font-medium truncate block px-2">
                                {imgName}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* 3. FULL SCREEN PREVIEW MODAL */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-[999] app-overlay flex items-center justify-center p-4 md:p-12 app-enter"
                    onClick={closePreview}
                >
                    <button
                        className="absolute top-8 right-8 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                        onClick={closePreview}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <img
                        src={previewImage}
                        className="max-w-[80vw] h-[80vh] rounded-2xl shadow-2xl object-contain app-enter"
                        alt="Large preview"
                    />
                </div>
            )}
        </section>
    );
};

export default MemberDocumentsComp;