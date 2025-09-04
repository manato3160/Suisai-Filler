import axios from 'axios';

// Difyからのレスポンスの型定義（より正確に）
export interface DifyWorkflowResponse {
  workflow_run_id: string;
  task_id: string;
  data: {
    id: string;
    workflow_id: string;
    status: string;
    outputs: {
      // outputのキーはDifyの終了ノードで定義した変数名に依存
      // 今回は 'text' となっているが、画像の場合はファイルIDやURLの可能性がある
      text?: string; 
      [key: string]: any;
    };
    error: string | null;
    elapsed_time: number;
    total_tokens: number;
    total_steps: number;
    created_at: number;
    finished_at: number;
  };
}

export class DifyAPIClient {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_DIFY_API_URL || 'https://api.dify.ai/v1';
    this.apiKey = process.env.NEXT_PUBLIC_DIFY_API_KEY || '';
    
    if (!this.apiKey) {
      console.error("Dify APIキーが設定されていません。 .env.local ファイルを確認してください。");
    }
  }
  
  // ワークフロー実行用のメソッドを修正
  async executeWorkflow(
    inputs: Record<string, any>
  ): Promise<DifyWorkflowResponse> {
    if (!this.apiKey) {
      throw new Error('Dify APIキーが設定されていません。');
    }

    // プロキシルートを使用してCORS問題を回避
    const proxyEndpoint = '/api/dify';

    try {
      console.log('Sending request via proxy:', {
        endpoint: proxyEndpoint,
        inputs: inputs,
        hasFile: !!inputs.images
      });

      // FormDataを作成してファイルとJSONデータを送信
      const formData = new FormData();
      
      // ファイル以外の入力データをJSON文字列として追加
      const nonFileInputs: Record<string, any> = {};
      for (const [key, value] of Object.entries(inputs)) {
        if (key !== 'images') {
          nonFileInputs[key] = value;
        }
      }
      
      formData.append('inputs', JSON.stringify(nonFileInputs));
      
      // ファイルが存在する場合は追加
      if (inputs.images && inputs.images instanceof File) {
        formData.append('images', inputs.images, inputs.images.name);
      }

      const response = await axios.post<DifyWorkflowResponse>(
        proxyEndpoint,
        formData,
        {
          timeout: 60000, // 60秒
        }
      );
      
      console.log('Dify workflow response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Dify ワークフロー実行エラー:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          data: error.config?.data
        },
        request: {
          headers: error.request?.headers,
          data: error.request?.data
        }
      });

      // より詳細なエラーメッセージを生成
      let errorMessage = 'ワークフローの実行中にエラーが発生しました。';
      
      if (error.response?.status === 400) {
        const errorDetails = error.response?.data?.error || error.response?.data?.message || 'リクエストの形式が正しくありません';
        errorMessage = `リクエストエラー (400): ${errorDetails}`;
      } else if (error.response?.status === 401) {
        errorMessage = 'APIキーが無効です。認証に失敗しました。';
      } else if (error.response?.status === 403) {
        errorMessage = 'アクセスが拒否されました。権限を確認してください。';
      } else if (error.response?.status === 404) {
        errorMessage = 'ワークフローが見つかりません。ワークフローIDを確認してください。';
      } else if (error.response?.status === 413) {
        errorMessage = 'ファイルサイズが大きすぎます。';
      } else if (error.response?.status === 422) {
        const errorDetails = error.response?.data?.error || error.response?.data?.message || '入力データの検証に失敗しました';
        errorMessage = `入力エラー (422): ${errorDetails}`;
      } else if (error.response?.status >= 500) {
        errorMessage = 'Difyサーバーでエラーが発生しました。しばらく待ってから再試行してください。';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'リクエストがタイムアウトしました。';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'ネットワークエラーが発生しました。接続を確認してください。';
      } else if (error.message) {
        errorMessage = `エラー: ${error.message}`;
      }

      // デバッグ情報も含めたエラーオブジェクトを作成
      const detailedError = new Error(errorMessage);
      (detailedError as any).originalError = error;
      (detailedError as any).responseData = error.response?.data;
      (detailedError as any).status = error.response?.status;
      
      throw detailedError;
    }
  }
}

// シングルトンインスタンス
export const difyClient = new DifyAPIClient(); 