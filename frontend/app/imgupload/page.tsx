"use client";
import Image from "next/image";
import { ChangeEvent, FormEvent, useState } from "react";
import { useAuth } from "../context/store";

export default function Imageupload() {
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<{ filekey: string; url: string } | null>(
    null,
  );
  const [uploading, setUploading] = useState<boolean>(false);
  const { token, user } = useAuth();
  const handlechnagefile = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handlesubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setResult(null);
    setUploading(true);
    const currentuser = user?.sub || user?.id;
    try {
      const formdata = new FormData();

      formdata.append("image", file);
      formdata.append("userId", currentuser);
      const res = await fetch("http://localhost:1017/upload/imageupload", {
        method: "POST",

        body: formdata,
      });
      if (!res.ok) {
        throw new Error("res failed to send");
      }
      const resdata = await res.json();
      setResult(resdata);
    } catch (error) {
      console.log(error);
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md space-y-4 border border-gray-100 justify-center">
      <h2 className="text-xl font-bold text-gray-800">
        Upload Image to RustFS
      </h2>

      <form onSubmit={handlesubmit} className="space-y-4 justify-center">
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-indigo-500 transition">
          <input
            type="file"
            accept="image/*"
            onChange={handlechnagefile}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>

        {preview && (
          <div className="mt-4 flex justify-center">
            <img
              src={preview}
              alt="Preview"
              className="max-h-48 rounded-lg object-cover shadow"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={!file || uploading}
          className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg disabled:bg-gray-300 transition"
        >
          {uploading ? "Uploading..." : "Upload Image"}
        </button>
      </form>

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      {result && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200 text-sm text-green-800 space-y-1">
          <p className="font-semibold">Upload Successful! 🎉</p>
          <p>
            <span className="font-medium">File Key:</span> {result.filekey}
          </p>
          <p>
            <span className="font-medium">URL Reference:</span> {result.url}
          </p>
        </div>
      )}
    </div>
  );
}
