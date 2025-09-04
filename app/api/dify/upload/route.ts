import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('File upload route called');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const user = formData.get('user') as string;

    if (!file || !user) {
      return NextResponse.json(
        { error: 'ファイルまたはユーザーIDが提供されていません' },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_DIFY_API_KEY || process.env.DIFY_API_KEY;
    const apiUrl = process.env.NEXT_PUBLIC_DIFY_API_URL || process.env.DIFY_API_URL;

    if (!apiKey || !apiUrl) {
      return NextResponse.json(
        { error: '環境変数が正しく設定されていません' },
        { status: 500 }
      );
    }

    console.log('Uploading file to Dify:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      user: user
    });

    // DifyのファイルアップロードAPIに転送
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('user', user);

    const difyResponse = await fetch(`${apiUrl}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: uploadFormData,
    });

    if (!difyResponse.ok) {
      const errorData = await difyResponse.text();
      console.error('Dify file upload error:', {
        status: difyResponse.status,
        statusText: difyResponse.statusText,
        data: errorData
      });
      
      return NextResponse.json(
        { error: `Dify file upload error: ${difyResponse.status} ${difyResponse.statusText}` },
        { status: difyResponse.status }
      );
    }

    const responseData = await difyResponse.json();
    console.log('File upload successful:', responseData);
    
    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('File upload error:', {
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      { error: `File upload error: ${error.message}` },
      { status: 500 }
    );
  }
}

// OPTIONSリクエスト（preflight）に対応
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 