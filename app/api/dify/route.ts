import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Proxy route called');
    
    // 環境変数を直接確認
    const envVars = {
      NEXT_PUBLIC_DIFY_API_URL: process.env.NEXT_PUBLIC_DIFY_API_URL,
      NEXT_PUBLIC_DIFY_API_KEY: process.env.NEXT_PUBLIC_DIFY_API_KEY,
      NEXT_PUBLIC_DIFY_WORKFLOW_ID: process.env.NEXT_PUBLIC_DIFY_WORKFLOW_ID,
      // サーバーサイド用の環境変数も確認
      DIFY_API_URL: process.env.DIFY_API_URL,
      DIFY_API_KEY: process.env.DIFY_API_KEY,
      DIFY_WORKFLOW_ID: process.env.DIFY_WORKFLOW_ID,
    };
    
    console.log('All environment variables:', envVars);
    
    const formData = await request.formData();
    
    // 環境変数の優先順位を設定
    const apiKey = process.env.NEXT_PUBLIC_DIFY_API_KEY || process.env.DIFY_API_KEY;
    const apiUrl = process.env.NEXT_PUBLIC_DIFY_API_URL || process.env.DIFY_API_URL;

    console.log('Selected environment variables:', {
      hasApiKey: !!apiKey,
      hasApiUrl: !!apiUrl,
      apiUrl: apiUrl,
      apiKeyPreview: apiKey ? `***${apiKey.slice(-4)}` : 'undefined'
    });

    if (!apiKey || !apiUrl) {
      console.error('Missing environment variables');
      return NextResponse.json(
        { 
          error: '環境変数が正しく設定されていません', 
          details: { 
            apiKey: !!apiKey, 
            apiUrl: !!apiUrl,
            allEnvVars: envVars
          } 
        },
        { status: 500 }
      );
    }

    // FormDataの内容をログ出力
    console.log('FormData contents:');
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`- ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
      } else {
        console.log(`- ${key}: ${value}`);
      }
    }

    // ファイルとJSONデータを処理
    const inputs: Record<string, any> = {};
    let uploadedFileId: string | null = null;
    let user = 'default-user';

    // inputsキーからJSONデータを取得
    const inputsJson = formData.get('inputs');
    if (inputsJson && typeof inputsJson === 'string') {
      try {
        const parsedInputs = JSON.parse(inputsJson);
        Object.assign(inputs, parsedInputs);
      } catch (e) {
        console.error('Failed to parse inputs JSON:', e);
      }
    }

    // ファイルが存在する場合は、先にアップロード
    const file = formData.get('images') as File;
    if (file) {
      console.log('File found, uploading to Dify first...');
      
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('user', user);

      try {
        const uploadResponse = await fetch(`${apiUrl}/files/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
          body: uploadFormData,
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          uploadedFileId = uploadResult.id;
          console.log('File uploaded successfully, ID:', uploadedFileId);
          
          // ファイルIDをinputsに追加
          inputs.images = [{
            transfer_method: "local_file",
            upload_file_id: uploadedFileId,
            type: "image"
          }];
        } else {
          console.error('File upload failed:', uploadResponse.status, uploadResponse.statusText);
          return NextResponse.json(
            { error: 'ファイルのアップロードに失敗しました' },
            { status: uploadResponse.status }
          );
        }
      } catch (uploadError: any) {
        console.error('File upload error:', uploadError);
        return NextResponse.json(
          { error: `ファイルアップロードエラー: ${uploadError.message}` },
          { status: 500 }
      );
      }
    }

    // Difyの正しいエンドポイントを使用
    const endpoint = `${apiUrl}/workflows/run`;
    console.log('Using correct Dify endpoint:', endpoint);

    // 正しいリクエストボディを作成
    const requestBody = {
      inputs: inputs,
      response_mode: "blocking",
      user: user
    };

    console.log('Sending request to Dify:', {
      endpoint: endpoint,
      requestBody: requestBody,
      hasFile: !!uploadedFileId
    });

    const difyResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Dify response:', {
      status: difyResponse.status,
      statusText: difyResponse.statusText,
      ok: difyResponse.ok
    });

    if (!difyResponse.ok) {
      const errorData = await difyResponse.text();
      console.error('Dify API error:', {
        status: difyResponse.status,
        statusText: difyResponse.statusText,
        data: errorData
      });
      
      return NextResponse.json(
        { error: `Dify API error: ${difyResponse.status} ${difyResponse.statusText}`, details: errorData },
        { status: difyResponse.status }
      );
    }

    const responseData = await difyResponse.json();
    console.log('Dify workflow execution successful:', responseData);
    
    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('Proxy error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { error: `Proxy error: ${error.message}`, details: error.stack },
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