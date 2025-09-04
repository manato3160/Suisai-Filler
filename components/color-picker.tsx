"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface ColorPickerProps {
  label: string
  value: string
  onChange: (value: string) => void
  colorType: "hair" | "skin" | "clothes"
}

// 髪の色・服の色 - 30色（Difyワークフロー準拠）
const HAIR_CLOTHES_COLORS = [
  { name: "胡粉色", value: "#FFFFFC", category: "white", description: "純白に近い、上質な米や塩の色" },
  { name: "生成り色", value: "#FBFAF5", category: "cream", description: "自然な風合いのクリーム色" },
  { name: "象牙色", value: "#F8F4E6", category: "ivory", description: "豆腐や出汁を思わせる優しい黄色" },
  { name: "薄卵色", value: "#FDE8D0", category: "egg", description: "だし巻き卵のような淡い黄色" },
  { name: "鳥の子色", value: "#FFF1CF", category: "cream", description: "湯葉や粟麩のような黄みがかったクリーム色" },
  { name: "桜色", value: "#FEF4F4", category: "pink", description: "桜でんぶや明石鯛のような、ごく淡いピンク" },
  { name: "鴇色", value: "#F4B3C2", category: "pink", description: "サーモンや甘酢生姜の優しいピンク" },
  { name: "珊瑚色", value: "#F5B1AA", category: "coral", description: "鮪の赤身や海老のような、柔らかな赤" },
  { name: "一斤染", value: "#F5B199", category: "pink", description: "紅葉鯛のような、少し黄みがかったピンク" },
  { name: "杏色", value: "#F7B977", category: "orange", description: "ウニや濃厚な卵黄の色" },
  { name: "洗柿", value: "#F2C9AC", category: "orange", description: "人参や柿なますのような、洗い柿の色" },
  { name: "浅黄", value: "#EDD3A1", category: "yellow", description: "栗の甘露煮や沢庵のような、落ち着いた黄色" },
  { name: "若芽色", value: "#E0EBAF", category: "green", description: "若布や浅漬けのような、明るい黄緑" },
  { name: "若菜色", value: "#D8E698", category: "green", description: "新鮮な菜の花の色" },
  { name: "抹茶色", value: "#C5C56A", category: "green", description: "抹茶やずんだの色" },
  { name: "柳色", value: "#A8C97F", category: "green", description: "紫蘇や木の芽などの薬味の色" },
  { name: "松葉色", value: "#839B5C", category: "green", description: "青々とした松の葉や、濃い野菜の色" },
  { name: "苔色", value: "#69821B", category: "green", description: "わさびや深い味わいを表現する緑" },
  { name: "月白", value: "#EAF4FC", category: "blue", description: "月明かりのような、ごくごく淡い青" },
  { name: "白藍", value: "#C1E4E9", category: "blue", description: "白磁の染付のような、澄んだ水色" },
  { name: "瓶覗", value: "#A2D7DD", category: "blue", description: "藍染で最も淡い、涼しげな青" },
  { name: "秘色色", value: "#ABCED8", category: "blue", description: "青磁の器を思わせる、神秘的な青緑" },
  { name: "浅縹", value: "#84B9CB", category: "blue", description: "落ち着いた藍色の器の色" },
  { name: "淡藤色", value: "#BBC8E6", category: "purple", description: "紫芋や食用菊のような、淡いアクセント" },
  { name: "桔梗色", value: "#5654A2", category: "purple", description: "ナスの漬物など、深みのある紫" },
  { name: "利休鼠", value: "#888E7E", category: "gray", description: "胡麻和えや、趣のある器の緑がかった鼠色" },
  { name: "薄墨色", value: "#A3A3A2", category: "gray", description: "すり胡麻や、影を表現する淡い墨色" },
  { name: "胡桃染", value: "#A58F86", category: "brown", description: "きのこや胡麻だれを思わせる柔らかな茶色" },
  { name: "煎茶色", value: "#8C6450", category: "brown", description: "ほうじ茶や、薄口醤油のような赤みのある茶色" },
  { name: "墨", value: "#595857", category: "black", description: "海苔や黒胡麻、漆器の深い黒" }
]

// 肌の色 - 5色（Difyワークフロー準拠）
const SKIN_COLORS = [
  { name: "生成り色", value: "#FBFAF5", category: "light", description: "ほんのりと黄みがかった、非常に明るい白" },
  { name: "肌色", value: "#FCE2C4", category: "natural", description: "日本の伝統色で「肌色」として定義されている、健康的で標準的な色" },
  { name: "宍色", value: "#EFAB93", category: "tan", description: "少し赤みが強く、血色の良さを感じさせる色" },
  { name: "丁子色", value: "#EFCD9A", category: "olive", description: "少し黄みがかった、落ち着いたオークル系の肌色" },
  { name: "人色", value: "#F1BF99", category: "dark", description: "やや日焼けしたような、少し濃いめの健康的な肌色" }
]

export function ColorPicker({ label, value, onChange, colorType }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  // 色タイプに応じて色の配列を選択
  const getColorArray = () => {
    switch (colorType) {
      case "hair":
      case "clothes":
        return HAIR_CLOTHES_COLORS
      case "skin":
        return SKIN_COLORS
      default:
        return HAIR_CLOTHES_COLORS
    }
  }

  const colors = getColorArray()
  const selectedColor = colors.find(color => color.value === value)
  const displayColor = value || "#ffffff"

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      
      {/* 選択された色の表示 */}
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-lg border-2 border-border shadow-sm"
          style={{ backgroundColor: displayColor }}
        />
        <div className="flex-1">
          <div className="text-sm font-medium text-foreground">
            {selectedColor ? selectedColor.name : "色が選択されていません"}
          </div>
          <div className="text-xs text-muted-foreground">
            {selectedColor ? selectedColor.description : "色を選択してください"}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 px-3 border-border hover:bg-accent"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? "閉じる" : "選択"}
        </Button>
      </div>

      {/* 色選択パネル */}
      {isOpen && (
        <div className="space-y-3">
          <div className="grid grid-cols-10 gap-2 max-h-60 overflow-y-auto">
            {colors.map((color) => (
              <button
                key={color.name}
                type="button"
                className={`group flex flex-col items-center gap-1 p-1 rounded-lg border-2 transition-all hover:scale-105 ${
                  value === color.value 
                    ? 'border-primary shadow-lg scale-105' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => {
                  onChange(color.value)
                  setIsOpen(false)
                }}
                title={color.description}
              >
                <div
                  className="w-8 h-8 rounded-full shadow-md group-hover:shadow-lg transition-shadow"
                  style={{ backgroundColor: color.value }}
                />
                <span className="text-xs text-foreground font-medium text-center leading-tight min-h-[1.75rem] flex items-center justify-center">
                  {color.name}
                </span>
              </button>
            ))}
          </div>
          
          {/* クリアボタン */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={() => {
              onChange("")
              setIsOpen(false)
            }}
          >
            色をクリア
          </Button>
        </div>
      )}
    </div>
  )
}
