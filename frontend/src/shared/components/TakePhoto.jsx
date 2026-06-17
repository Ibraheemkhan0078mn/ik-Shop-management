import React, { useEffect, useRef, useState } from "react";

export default function TakePhoto({ onChange, img }) {
  let [tempImg, setTempImg] = useState(null)
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // ---------- SYSTEM FILE PICK ----------
  const openFilePicker = () => {
    fileInputRef.current.click();
  };

  const handleFilePick = (e) => {
    const file = e.target.files?.[0];
    if (file) onChange(file);
    setTempImg(URL.createObjectURL(file))
    e.target.value = ""; // reset input
  };

  // ---------- CAMERA ----------
  const openCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    streamRef.current = stream;
    setIsCameraOpen(true);
  };

  useEffect(() => {
    if (isCameraOpen && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraOpen]);

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    canvas.getContext("2d").drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      const file = new File([blob], "live-photo.jpg", {
        type: "image/jpeg",
      });
      onChange(file);
      setTempImg(URL.createObjectURL(file))
    }, "image/jpeg");

    streamRef.current.getTracks().forEach((t) => t.stop());
    setIsCameraOpen(false);
  };

  return (
    <div className="flex flex-col items-center gap-5 my-5 ">


      {
        !isCameraOpen &&
        <div className=" border border-gray-200 shadow-md  overflow-hidden ">
          <img src={tempImg ? tempImg : img && `http://localhost:3000/uploads/${img}`} alt="" className="object-fit min-w-50 min-h-30 max-w-50 h-full w-full " />
        </div>
      }





      <div className="flex flex-col items-center gap-2">
        {/* hidden system file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFilePick}
        />

        {!isCameraOpen ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={openFilePicker}
              className="px-3 py-2 bg-zinc-800 text-white text-xs rounded-lg hover:bg-zinc-700"
            >
              Upload from Files
            </button>

            <button
              type="button"
              onClick={openCamera}
              className="px-3 py-2 bg-green-700 text-white text-xs rounded-lg hover:bg-green-600"
            >
              Take Live Picture
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              className="w-48 h-36 border rounded-lg"
            />
            <button
              type="button"
              onClick={capturePhoto}
              className="px-3 py-2 bg-blue-700 text-white text-xs rounded-lg hover:bg-blue-600"
            >
              Capture
            </button>
          </>
        )}
      </div>
    </div>
  );
}
