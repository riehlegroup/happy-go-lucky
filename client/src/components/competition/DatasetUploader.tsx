import React, { useRef } from "react";
import { Label } from "../ui/label";
import { DatasetType, DatasetMetadata } from "@/types/competition.models";
import { Button } from "../ui/button";


interface DatasetUploaderProps {
    label: string;
    type: DatasetType;
    existingMetadata?: DatasetMetadata | null;
    selectedFile?: File | null;
    onFileSelect: (file: File | null) => void;
    onDownload: () => void;
    disabled?: boolean;
}

export const DatasetUploader: React.FC<DatasetUploaderProps> = ({ 
    label, 
    existingMetadata, 
    selectedFile, 
    onFileSelect, 
    onDownload, 
    disabled = false,
 }) => {
    const fileInputRef = useRef<HTMLInputElement | null>(null);

   return (
    <div className="space-y-2">
        <div>
        <Label>{label}</Label>
        {existingMetadata && !selectedFile && onDownload && (
            <Button onClick={onDownload} disabled={disabled}>
                Download current file
            </Button>
        )}
        </div>

    {/* hidden file input only shown in case of no existing file */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
        className="hidden"
      />

      {/* case 1: new file selected -> waiting for submit */}
      {selectedFile ? (
        <div className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
          <div className="truncate">
            <span className="font-semibold">Pending upload:</span> {selectedFile.name}
          </div>
          <Button onClick={() => onFileSelect(null)}>
            Cancel
          </Button>
        </div>
      ) : existingMetadata ? (
        /* case 2: file is already uploaded on server -> display metadata and replace option */
        <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700">
          <div className="flex items-center gap-2 truncate">
            <span className="font-bold text-emerald-600">✓</span>
            <span className="truncate font-medium">{existingMetadata.filename}</span>
            <span className="truncate font-medium">{existingMetadata.updatedAt}</span>
          </div>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            >
            Replace
          </Button>
        </div>
      ) : (
        /* case 3: no file selected or uploaded -> show upload button */
        <Button       
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          + Choose {label} (.csv)
        </Button>
      )}


    </div>
    
    );
}