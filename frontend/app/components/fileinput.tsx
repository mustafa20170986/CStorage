"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";

export default function VideoInput() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isuploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [resolution, setResolution] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [videosrc, setVideosrc] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [uploadprogress, setUploadprogress] = useState<number>(0);

  // Corrected type to HTMLInputElement
  const fileinputref = useRef<HTMLInputElement>(null);
  const videoref = useRef<HTMLVideoElement>(null);

  const MAX_SIZE = 100 * 1024 * 1024;
  const MIME_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

  const handleFilevalidation = (selectedFile: File) => {
    setUploadprogress(0);
    setError(null);

    if (selectedFile.size > MAX_SIZE) {
      setError("File size limit exceeded (Max 100MB)");
      return;
    }
    if (!MIME_TYPES.includes(selectedFile.type)) {
      setError("Video type is not supported");
      return;
    }
    setFile(selectedFile);
    const preview = URL.createObjectURL(selectedFile);
    setVideosrc(preview);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFilevalidation(e.target.files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFilevalidation(e.dataTransfer.files[0]);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleVideometaData = () => {
    if (videoref.current) {
      setDuration(videoref.current.duration);
      setResolution({
        width: videoref.current.videoWidth,
        height: videoref.current.videoHeight,
      });
    }
  };

  const handleRemove = () => {
    setFile(null);
    setVideosrc(null);
    setDuration(null);
    setResolution(null);
    setError(null);
    setUploadprogress(0);
    setIsUploading(false);
    if (fileinputref.current) {
      fileinputref.current.value = "";
    }
  };

  const handleUploadSubmit = async () => {
    if (!file) return;
    setIsUploading(true);
    setUploadprogress(0);

    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
    const totalParts = Math.ceil(file.size / CHUNK_SIZE);

    try {
      const initpart = await fetch("http://localhost:1017/upload/init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: file.name,
          filetype: file.type,
          filesize: file.size,
        }),
      });

      if (!initpart.ok) {
        throw new Error("Failed to initialize multipart upload");
      }

      const initdata = await initpart.json();
      const filekey = initdata.filekey || initdata.data?.filekey;
      const uploadid = initdata.uploadId || initdata.data?.uploadId;
      console.log("filekey and uid", filekey, uploadid);
      const presigned = await fetch(
        "http://localhost:1017/upload/getpresigned",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filekey: filekey,
            uploadId: uploadid,
            totalparts: totalParts,
          }),
        },
      );

      if (!presigned.ok) {
        throw new Error("Presigned URL generation failed");
      }

      const presigneddata = await presigned.json();
      const partsurl: { partnumber: number; presignedurl: string }[] =
        presigneddata.parts || presigneddata.data?.parts || [];

      const uploadparts: { partnumber: number; etag: string }[] = [];
      let uploadbyte = 0;

      for (let i = 0; i < totalParts; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);
        const partnumber = i + 1;
        const targeturl = partsurl.find(
          (p) => p.partnumber === partnumber,
        )?.presignedurl;

        if (!targeturl) {
          throw new Error(`Target URL not found for part ${partnumber}`);
        }

        const chunkres = await fetch(targeturl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
          body: chunk,
        });

        if (!chunkres.ok) {
          const errortext = await chunkres.text();
          throw new Error(`Chunk upload failed: ${errortext}`);
        }

        const etag = chunkres.headers.get("etag") || "";
        uploadparts.push({
          partnumber: partnumber,
          etag: etag.replace(/"/g, ""),
        });

        uploadbyte += chunk.size;
        const progresscount = Math.round((uploadbyte / file.size) * 100);
        setUploadprogress(progresscount);
      }

      const completemulti = await fetch(
        "http://localhost:1017/upload/complete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filekey,
            uploadid,
            parts: uploadparts,
          }),
        },
      );

      if (!completemulti.ok) {
        throw new Error("Failed to complete upload");
      }

      setIsUploading(false);
      setUploadprogress(100);
    } catch (err: any) {
      setError(err.message || "Upload failed");
      setIsUploading(false);
      console.error(err);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800">
      <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">
        Upload Video
      </h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
        Select or drag and drop your video file. Supported formats: MP4, MOV,
        WEBM (Max 100MB).
      </p>

      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDragDrop}
          onClick={() => fileinputref.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
            isDragging
              ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
              : "border-zinc-300 dark:border-zinc-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-zinc-50 dark:bg-zinc-800/50"
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Drag and drop your video here, or{" "}
              <span className="text-indigo-600 dark:text-indigo-400 underline">
                browse
              </span>
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              MP4, MOV, or WEBM up to 100MB
            </p>
          </div>
          <input
            ref={fileinputref}
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
            <video
              ref={videoref}
              src={videosrc!}
              controls
              onLoadedMetadata={handleVideometaData}
              className="w-full h-full object-contain"
            />
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700/60 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                File Name:
              </span>
              <span className="text-zinc-800 dark:text-zinc-200 truncate max-w-[250px]">
                {file.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                Size:
              </span>
              <span className="text-zinc-800 dark:text-zinc-200">
                {formatFileSize(file.size)}
              </span>
            </div>
            {duration && (
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                  Duration:
                </span>
                <span className="text-zinc-800 dark:text-zinc-200">
                  {formatDuration(duration)}
                </span>
              </div>
            )}
            {resolution && (
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                  Resolution:
                </span>
                <span className="text-zinc-800 dark:text-zinc-200">
                  {resolution.width} x {resolution.height}
                </span>
              </div>
            )}
          </div>

          {isuploading && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Uploading...</span>
                <span>{uploadprogress}%</span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full transition-all duration-200"
                  style={{ width: `${uploadprogress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleRemove}
              disabled={isuploading}
              className="flex-1 py-2.5 px-4 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition disabled:opacity-50"
            >
              Choose Different File
            </button>
            <button
              onClick={handleUploadSubmit}
              disabled={isuploading || uploadprogress === 100}
              className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isuploading
                ? "Uploading..."
                : uploadprogress === 100
                  ? "Uploaded Successfully!"
                  : "Upload Video"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
          <svg
            className="w-5 h-5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
