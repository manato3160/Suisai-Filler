"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileUpload } from "@/components/file-upload"
import { PropertiesPanel } from "@/components/properties-panel"
import { File, FolderOpen, Save, Undo, Redo, Download, Share2, Settings, Sparkles } from "lucide-react"
import { difyClient } from "@/lib/dify-api"
import { saveImageAsFile, generateFilename } from "@/lib/utils"

export default function IllustrationColoringApp() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [hairColor, setHairColor] = useState("")
  const [skinColor, setSkinColor] = useState("")
  const [clothesColor, setClothesColor] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setResult(null) // 新しいファイルが選択されたら結果をクリア
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setResult(null)
  }

  const handleColorize = async () => {
    if (!selectedFile) {
      alert("イラストファイルをアップロードしてください。");
      return
    }
    if (!hairColor && !skinColor && !clothesColor) {
        alert("少なくとも1つの色を指定してください。");
        return;
    }

    // ファイルサイズのチェック（15MB制限）
    const maxFileSize = 15 * 1024 * 1024; // 15MB
    if (selectedFile.size > maxFileSize) {
      alert(`ファイルサイズが大きすぎます。15MB以下のファイルを選択してください。\n現在のファイルサイズ: ${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    // ファイル形式のチェック
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(selectedFile.type)) {
      alert(`サポートされていないファイル形式です。以下の形式を選択してください:\nJPG, PNG, GIF, WEBP, SVG`);
      return;
    }

    setIsProcessing(true)
    setResult(null)

    try {
      const inputs = {
        images: selectedFile, // ファイルオブジェクトを直接含める
        hair_color: hairColor || "",
        skin_color: skinColor || "",
        clothes_color: clothesColor || "",
      };
      
      const response = await difyClient.executeWorkflow(inputs);
      
      console.log('Workflow response:', response);

      // Difyワークフローの終了ノードの出力を取得
      // 新しいレスポンス形式では、data.outputs.textに結果が含まれる
      const output = response.data?.outputs?.text;

      if (response.data?.status === 'succeeded' && output) {
        // Markdown形式の画像URLからURL部分を抽出するための正規表現
        const markdownUrlRegex = /!\[.*?\]\((.*?)\)/;
        const match = output.match(markdownUrlRegex);

        if (match && match[1]) {
          // 正規表現に一致した場合、抽出したURLを設定
          const imageUrl = match[1];
          console.log('Extracted Image URL:', imageUrl);
          setResult(imageUrl);
        } else if (output.startsWith('http')) {
          // 念のため、純粋なURLが返ってきた場合のフォールバック
          setResult(output);
        } else {
          // Base64形式が返ってきた場合のフォールバック
          setResult(`data:image/jpeg;base64,${output}`);
        }
      } else {
        const errorMessage = response.data?.error || 'ワークフローは成功しましたが、有効な出力が得られませんでした。';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('AI処理エラー:', error);
      
      // 詳細なエラー情報をログに出力
      if (error.originalError) {
        console.error('Original error:', error.originalError);
      }
      if (error.responseData) {
        console.error('Response data:', error.responseData);
      }
      if (error.status) {
        console.error('HTTP status:', error.status);
      }
      
      // ユーザーフレンドリーなエラーメッセージを表示
      let userMessage = error.message || 'AI処理中にエラーが発生しました';
      
      // プロキシルートからのエラー詳細を確認
      if (error.response?.data?.details) {
        console.error('Error details from proxy:', error.response.data.details);
        userMessage += `\n\n詳細: ${JSON.stringify(error.response.data.details, null, 2)}`;
      }
      
      // 特定のエラーパターンに応じた詳細なメッセージ
      if (error.message.includes('リクエストエラー (400)')) {
        userMessage = `入力データに問題があります: ${error.message}`;
      } else if (error.message.includes('APIキーが無効')) {
        userMessage = 'APIキーの設定を確認してください。環境変数ファイルを確認してください。';
      } else if (error.message.includes('ワークフローが見つかりません')) {
        userMessage = 'ワークフローIDの設定を確認してください。';
      } else if (error.message.includes('ファイルサイズが大きすぎます')) {
        userMessage = 'アップロードするファイルのサイズを小さくしてください。';
      } else if (error.message.includes('入力エラー (422)')) {
        userMessage = `入力データの形式が正しくありません: ${error.message}`;
      } else if (error.message.includes('サーバーエラー')) {
        userMessage = 'Difyサーバーで問題が発生しています。しばらく待ってから再試行してください。';
      } else if (error.message.includes('環境変数が正しく設定されていません')) {
        userMessage = '環境変数の設定を確認してください。.env.localファイルを確認してください。';
      } else if (error.message.includes('すべてのDify APIエンドポイントでエラーが発生しました')) {
        userMessage = 'Dify APIのエンドポイントに問題があります。APIの設定を確認してください。';
      }
      
      alert(`AI処理中にエラーが発生しました:\n\n${userMessage}`);
    } finally {
      setIsProcessing(false);
    }
  }

  const canColorize = Boolean(selectedFile && (hairColor || skinColor || clothesColor))

  // ダウンロード処理関数
  const handleDownload = async () => {
    if (!result) {
      alert('保存する画像がありません。');
      return;
    }

    try {
      // 元のファイル名を考慮したファイル名を生成
      let baseFilename = 'colored-illustration';
      if (selectedFile) {
        const originalName = selectedFile.name.split('.')[0]; // 拡張子を除く
        // 長すぎるファイル名は短縮
        if (originalName.length <= 20) {
          baseFilename = `${originalName}-colored`;
        }
      }
      
      const filename = generateFilename(result, baseFilename);
      const savedFilename = await saveImageAsFile(result, filename);
      
      // 成功メッセージを表示
      alert(`画像を保存しました！\nファイル名: ${savedFilename}\n\n画像は「ダウンロード」フォルダに保存されています。`);
    } catch (error: any) {
      console.error('保存エラー:', error);
      alert(`画像の保存に失敗しました: ${error.message}`);
    }
  }

  // 共有処理関数（将来の実装用）
  const handleShare = () => {
    if (!result) {
      alert('共有する画像がありません。');
      return;
    }

    // クリップボードに画像URLをコピー
    if (navigator.clipboard) {
      navigator.clipboard.writeText(result).then(() => {
        alert('画像URLをクリップボードにコピーしました。');
      }).catch(() => {
        alert('クリップボードへのコピーに失敗しました。');
      });
    } else {
      // フォールバック: 手動でURLを選択
      const textArea = document.createElement('textarea');
      textArea.value = result;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('画像URLをクリップボードにコピーしました。');
    }
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      <header className="h-12 bg-card border-b border-border flex items-center px-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-accent">
              <Sparkles className="h-4 w-4 text-accent-foreground" />
            </div>
            <span className="text-sm font-medium text-card-foreground">Suisai Filler</span>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-card-foreground hover:bg-accent/20">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-3">
            <Card className="h-full bg-background border-border">
              <CardContent className="h-full p-4">
                <div className="h-full bg-muted rounded border-2 border-dashed border-border flex items-center justify-center">
                  {!selectedFile ? (
                    <div className="max-w-md">
                      <FileUpload
                        onFileSelect={handleFileSelect}
                        selectedFile={selectedFile}
                        onRemoveFile={handleRemoveFile}
                      />
                    </div>
                  ) : result ? (
                    <div className="relative max-w-full max-h-full">
                      <img
                        src={result}
                        alt="着色済みイラスト"
                        className="max-w-full max-h-full object-contain rounded"
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="bg-card/80 backdrop-blur-sm hover:bg-card/90"
                          onClick={handleDownload}
                          title="画像を保存"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="bg-card/80 backdrop-blur-sm hover:bg-card/90"
                          onClick={handleShare}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full max-w-4xl mx-auto">
                      <FileUpload
                        onFileSelect={handleFileSelect}
                        selectedFile={selectedFile}
                        onRemoveFile={handleRemoveFile}
                      />
                      <div className="text-center mt-4 space-y-2">
                        <p className="text-foreground font-medium">イラストが読み込まれました</p>
                        <p className="text-muted-foreground text-sm">右パネルで色を設定してAI着色を開始してください</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <PropertiesPanel
          hairColor={hairColor}
          skinColor={skinColor}
          clothesColor={clothesColor}
          onHairColorChange={setHairColor}
          onSkinColorChange={setSkinColor}
          onClothesColorChange={setClothesColor}
          onColorize={handleColorize}
          isProcessing={isProcessing}
          canColorize={canColorize}
        />
      </div>
    </div>
  )
}
