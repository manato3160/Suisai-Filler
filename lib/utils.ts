import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 画像ダウンロード用のユーティリティ関数
export async function downloadImage(imageUrl: string, filename: string = 'colored-illustration') {
  try {
    // URLから画像を取得
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('画像の取得に失敗しました');
    }

    // Blobとして取得
    const blob = await response.blob();
    
    // ファイル拡張子を決定
    let extension = 'png';
    if (imageUrl.startsWith('data:image/')) {
      const match = imageUrl.match(/data:image\/([^;]+)/);
      if (match) {
        extension = match[1];
      }
    } else if (imageUrl.includes('.')) {
      extension = imageUrl.split('.').pop() || 'png';
    }

    // ファイル名に拡張子を追加
    const fullFilename = `${filename}.${extension}`;

    // ダウンロードリンクを作成
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fullFilename;
    
    // リンクをクリックしてダウンロード開始
    document.body.appendChild(link);
    link.click();
    
    // クリーンアップ
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log(`画像をダウンロードしました: ${fullFilename}`);
  } catch (error) {
    console.error('ダウンロードエラー:', error);
    throw new Error('画像のダウンロードに失敗しました');
  }
}

// Base64画像をBlobに変換
export function base64ToBlob(base64: string, mimeType: string = 'image/png'): Blob {
  const byteCharacters = atob(base64.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

// 画像URLから適切なファイル名を生成
export function generateFilename(imageUrl: string, baseFilename: string = 'colored-illustration'): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  
  if (imageUrl.startsWith('data:image/')) {
    return `${baseFilename}-${timestamp}`;
  }
  
  // URLからファイル名を抽出
  try {
    const url = new URL(imageUrl);
    const pathname = url.pathname;
    const filename = pathname.split('/').pop();
    
    if (filename && filename.includes('.')) {
      const nameWithoutExt = filename.split('.')[0];
      // UUIDのような長い文字列は短縮
      if (nameWithoutExt.length > 20) {
        return `${baseFilename}-${timestamp}`;
      }
      return `${nameWithoutExt}-colored-${timestamp}`;
    }
  } catch (e) {
    // URL解析に失敗した場合
  }
  
  return `${baseFilename}-${timestamp}`;
}

// 画像を適切な形式で保存
export async function saveImageAsFile(imageUrl: string, filename: string = 'colored-illustration') {
  try {
    let blob: Blob;
    let mimeType: string;
    
    if (imageUrl.startsWith('data:image/')) {
      // Base64画像の場合
      const match = imageUrl.match(/data:image\/([^;]+);base64,(.+)/);
      if (match) {
        mimeType = `image/${match[1]}`;
        const base64Data = match[2];
        blob = base64ToBlob(imageUrl, mimeType);
      } else {
        throw new Error('無効なBase64画像形式です');
      }
    } else {
      // URL画像の場合
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('画像の取得に失敗しました');
      }
      blob = await response.blob();
      mimeType = response.headers.get('content-type') || 'image/png';
    }
    
    // ファイル拡張子を決定
    let extension = 'png';
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
      extension = 'jpg';
    } else if (mimeType.includes('webp')) {
      extension = 'webp';
    } else if (mimeType.includes('gif')) {
      extension = 'gif';
    } else if (mimeType.includes('svg')) {
      extension = 'svg';
    }
    
    // ファイル名に拡張子を追加
    const fullFilename = `${filename}.${extension}`;
    
    // ファイルとして保存
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fullFilename;
    
    // リンクをクリックしてダウンロード開始
    document.body.appendChild(link);
    link.click();
    
    // クリーンアップ
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log(`画像を保存しました: ${fullFilename}`);
    return fullFilename;
  } catch (error) {
    console.error('画像保存エラー:', error);
    throw new Error('画像の保存に失敗しました');
  }
}
