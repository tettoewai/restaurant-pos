"use client";
import { useDropzone } from "react-dropzone";

interface Props {
  onDrop: (files: File[]) => void;
  maxSize?: number;
}

function FileDropZone({ onDrop, maxSize = 3000000 }: Props) {
  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      maxSize,
    });

  return (
    <div
      {...getRootProps()}
      className="rounded-md border-2 border-dotted border-gray-400 w-full p-1 cursor-pointer h-14 flex items-center justify-center text-sm text-center"
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the files here ...</p>
      ) : (
        <p>Drag and drop some files here, or click to select files</p>
      )}
      {fileRejections.length > 0 && (
        <div className="text-primary">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name}>
              {errors.map((e) => (
                <p className="truncate" key={e.code}>
                  {e.message}
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FileDropZone;
