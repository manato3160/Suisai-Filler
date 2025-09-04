"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileUpload } from "@/components/file-upload"
import { PropertiesPanel } from "@/components/properties-panel"
import { File, FolderOpen, Save, Undo, Redo, Download, Share2, Settings, Sparkles } from "lucide-react"
import { difyClient } from "@/lib/dify-api"

export default function IllustrationColoringApp() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [hairColor, setHairColor] = useState("")
  const [skinColor, setSkinColor] = useState("")
  const [clothesColor, setClothesColor] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  // 環境変数のデバッグ情報を表示（開発環境のみ）
  const debugEnvVars = process.env.NODE_ENV === 'development' ? {
    DIFY_API_URL: process.env.DIFY_API_URL,
    DIFY_API_KEY: process.env.DIFY_API_KEY ? '***' + process.env.DIFY_API_KEY.slice(-4) : 'undefined',
    NEXT_PUBLIC_DIFY_API_URL: process.env.NEXT_PUBLIC_DIFY_API_URL,
    NEXT_PUBLIC_DIFY_API_KEY: process.env.NEXT_PUBLIC_DIFY_API_KEY ? '***' + process.env.NEXT_PUBLIC_DIFY_API_KEY.slice(-4) : 'undefined',
  } : null;

  const handleFileSelect = (file: File) => {
    console.log('File selected:', file.name, file.size, file.type)
    setSelectedFile(file)
    setResult(null)
  }

  const handleRemoveFile = () => {
    console.log('File removed')
    setSelectedFile(null)
    setResult(null)
  }

  const handleColorize = async () => {
    if (!selectedFile) return

    setIsProcessing(true)

    try {
      // 選択された色の名前を取得（Difyワークフロー準拠）
      const getColorName = (colorValue: string) => {
        // 髪の色・服の色（30色）
        const hairClothesColors: { [key: string]: string } = {
          "#FFFFFC": "胡粉色", "#FBFAF5": "生成り色", "#F8F4E6": "象牙色",
          "#FDE8D0": "薄卵色", "#FFF1CF": "鳥の子色", "#FEF4F4": "桜色",
          "#F4B3C2": "鴇色", "#F5B1AA": "珊瑚色", "#F5B199": "一斤染",
          "#F7B977": "杏色", "#F2C9AC": "洗柿", "#EDD3A1": "浅黄",
          "#E0EBAF": "若芽色", "#D8E698": "若菜色", "#C5C56A": "抹茶色",
          "#A8C97F": "柳色", "#839B5C": "松葉色", "#69821B": "苔色",
          "#EAF4FC": "月白", "#C1E4E9": "白藍", "#A2D7DD": "瓶覗",
          "#ABCED8": "秘色色", "#84B9CB": "浅縹", "#BBC8E6": "淡藤色",
          "#5654A2": "桔梗色", "#888E7E": "利休鼠", "#A3A3A2": "薄墨色",
          "#A58F86": "胡桃染", "#8C6450": "煎茶色", "#595857": "墨"
        };
        
        // 肌の色（5色）
        const skinColors: { [key: string]: string } = {
          "#FBFAF5": "生成り色", "#FCE2C4": "肌色", "#EFAB93": "宍色",
          "#EFCD9A": "丁子色", "#F1BF99": "人色"
        };
        
        // 色の種類を判定して適切な名前を返す
        if (hairClothesColors[colorValue]) return hairClothesColors[colorValue];
        if (skinColors[colorValue]) return skinColors[colorValue];
        
        return colorValue || "デフォルト";
      };

      // Dify APIを使用してAI着色のプロンプトを生成
      const colorPrompt = `以下の色設定でイラストを着色してください：
髪の色: ${getColorName(hairColor)}
肌の色: ${getColorName(skinColor)}
服の色: ${getColorName(clothesColor)}

この線画イラストを美しく着色してください。`;

      console.log('Sending color prompt to Dify:', colorPrompt);

      try {
        // まずワークフロー実行を試行
        const workflowId = process.env.NEXT_PUBLIC_DIFY_WORKFLOW_ID || 'default';
        console.log('Using workflow ID:', workflowId);
        
        const workflowResponse = await difyClient.executeWorkflow(
          workflowId,
          {
            prompt: colorPrompt,
            hairColor: getColorName(hairColor),
            skinColor: getColorName(skinColor),
            clothesColor: getColorName(clothesColor)
          }
        );
        
        console.log('Workflow response:', workflowResponse);
        setResult("/watercolor-illustration-of-anime-character-with-co.jpg");
      } catch (workflowError) {
        console.log('Workflow execution failed, trying chat completion:', workflowError);
        
        // ワークフローが失敗した場合はチャット補完を試行
        const response = await difyClient.chatCompletion([
          { role: 'user', content: colorPrompt }
        ]);

        console.log('Chat completion response:', response.answer);
        setResult("/watercolor-illustration-of-anime-character-with-co.jpg");
      }
      
      setIsProcessing(false);
    } catch (error: any) {
      console.error('AI処理エラー:', error);
      setIsProcessing(false);
      
      // より詳細なエラーメッセージを表示
      let errorMessage = 'AI処理中にエラーが発生しました。';
      
      if (error.message.includes('DIFY_API_KEY')) {
        errorMessage = 'Dify APIキーが設定されていません。環境変数DIFY_API_KEYを設定してください。';
      } else if (error.message.includes('APIキーが無効')) {
        errorMessage = 'Dify APIキーが無効です。正しいAPIキーを設定してください。';
      } else if (error.message.includes('APIエンドポイント')) {
        errorMessage = 'Dify APIエンドポイントが見つかりません。URLを確認してください。';
      } else if (error.message.includes('サーバーエラー')) {
        errorMessage = 'Difyサーバーでエラーが発生しました。しばらく待ってから再試行してください。';
      } else {
        errorMessage = `エラー: ${error.message}`;
      }
      
      alert(errorMessage);
    }
  }

  const canColorize = Boolean(selectedFile && (hairColor || skinColor || clothesColor))

  return (
    <div className="h-screen bg-background flex flex-col">
      <header className="h-12 bg-card border-b border-border flex items-center px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-accent">
              <Sparkles className="h-4 w-4 text-accent-foreground" />
            </div>
            <span className="text-sm font-medium text-card-foreground">イラスト色付け AI</span>
          </div>

          <div className="flex items-center gap-1 ml-8">
            <Button variant="ghost" size="sm" className="h-8 px-3 text-card-foreground hover:bg-accent/20">
              <File className="h-4 w-4 mr-1" />
              新規
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-3 text-card-foreground hover:bg-accent/20">
              <FolderOpen className="h-4 w-4 mr-1" />
              開く
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-3 text-card-foreground hover:bg-accent/20">
              <Save className="h-4 w-4 mr-1" />
              保存
            </Button>
          </div>

          <div className="flex items-center gap-1 ml-4">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-card-foreground hover:bg-accent/20">
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-card-foreground hover:bg-accent/20">
              <Redo className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {debugEnvVars && (
            <div className="text-xs text-muted-foreground mr-4">
              <div>API URL: {debugEnvVars.DIFY_API_URL || debugEnvVars.NEXT_PUBLIC_DIFY_API_URL || 'undefined'}</div>
              <div>API Key: {debugEnvVars.DIFY_API_KEY || debugEnvVars.NEXT_PUBLIC_DIFY_API_KEY || 'undefined'}</div>
            </div>
          )}
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
                        src={result || "/placeholder.svg"}
                        alt="Colored illustration"
                        className="max-w-full max-h-full object-contain rounded"
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Button size="sm" variant="secondary" className="bg-card/80 backdrop-blur-sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="secondary" className="bg-card/80 backdrop-blur-sm">
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
