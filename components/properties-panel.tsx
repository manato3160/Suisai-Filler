"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ColorPicker } from "@/components/color-picker"
import { Sparkles } from "lucide-react"

interface PropertiesPanelProps {
  hairColor: string
  skinColor: string
  clothesColor: string
  onHairColorChange: (color: string) => void
  onSkinColorChange: (color: string) => void
  onClothesColorChange: (color: string) => void
  onColorize: () => void
  isProcessing: boolean
  canColorize: boolean
}

export function PropertiesPanel({
  hairColor,
  skinColor,
  clothesColor,
  onHairColorChange,
  onSkinColorChange,
  onClothesColorChange,
  onColorize,
  isProcessing,
  canColorize,
}: PropertiesPanelProps) {
  return (
    <div className="w-[40rem] bg-card border-l border-border flex flex-col">
      {/* Color Properties */}
      <Card className="m-2 bg-card border-border flex-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-card-foreground">色の設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ColorPicker
            label="髪の色"
            value={hairColor}
            onChange={onHairColorChange}
            colorType="hair"
          />
          <ColorPicker
            label="肌の色"
            value={skinColor}
            onChange={onSkinColorChange}
            colorType="skin"
          />
          <ColorPicker
            label="服の色"
            value={clothesColor}
            onChange={onClothesColorChange}
            colorType="clothes"
          />
          
          {/* AI着色ボタン */}
          <div className="pt-4">
            <Button
              onClick={onColorize}
              disabled={!canColorize || isProcessing}
              className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium text-lg shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3" />
                  処理中...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  AI着色開始
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
