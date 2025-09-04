"use client"

import { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, X, ImageIcon } from "lucide-react"

interface FileUploadProps {
  onFileSelect: (file: File) => void
  selectedFile: File | null
  onRemoveFile: () => void
}

export function FileUpload({ onFileSelect, selectedFile, onRemoveFile }: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)

  // ファイルが選択されたときにプレビューを生成
  useEffect(() => {
    console.log('FileUpload useEffect - selectedFile:', selectedFile?.name, 'preview:', !!preview)
    if (selectedFile) {
      const reader = new FileReader()
      reader.onload = (e) => {
        console.log('FileReader onload - preview created')
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      setPreview(null)
    }
  }, [selectedFile])

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        onFileSelect(file)
      }
    },
    [onFileSelect],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
    },
    maxFiles: 1,
  })

  const handleRemove = () => {
    onRemoveFile()
    setPreview(null)
  }

  // ファイルが選択され、プレビューが利用可能な場合
  if (selectedFile && preview) {
    return (
      <Card className="relative p-4 bg-card border-border">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <img
              src={preview}
              alt="Selected illustration"
              className="max-w-full max-h-96 object-contain rounded-lg border border-border shadow-lg"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
              onClick={handleRemove}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="text-center">
            <h3 className="font-medium text-foreground">{selectedFile.name}</h3>
            <p className="text-sm text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            <p className="text-xs text-muted-foreground mt-1">
              線画が準備できました。色を指定して着色を開始してください。
            </p>
          </div>
        </div>
      </Card>
    )
  }

  // ファイルが選択されているが、プレビューがまだ読み込み中の場合
  if (selectedFile && !preview) {
    return (
      <Card className="p-4 bg-card border-border">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-pulse">
            <div className="w-64 h-64 bg-muted rounded-lg border border-border"></div>
          </div>
          <div className="text-center">
            <h3 className="font-medium text-foreground">{selectedFile.name}</h3>
            <p className="text-sm text-muted-foreground">読み込み中...</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-dashed border-border bg-card">
      <div
        {...getRootProps()}
        className={`p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? "bg-accent/10 border-accent" : "hover:bg-muted/50"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-primary/10">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-foreground">
              {isDragActive ? "ファイルをドロップしてください" : "イラストをアップロード"}
            </h3>
            <p className="text-sm text-muted-foreground">線画のイラストファイルを選択またはドラッグ&ドロップ</p>
            <p className="text-xs text-muted-foreground">JPG, PNG, GIF, WEBP, SVG (最大15MB)</p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            ファイルを選択
          </Button>
        </div>
      </div>
    </Card>
  )
}
