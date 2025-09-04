import axios from 'axios';

export interface DifyMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface DifyResponse {
  answer: string;
  conversation_id: string;
  message_id: string;
}

export class DifyAPIClient {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    // 環境変数から設定を取得
    this.apiUrl = process.env.NEXT_PUBLIC_DIFY_API_URL || process.env.DIFY_API_URL || 'https://api.dify.ai/v1';
    this.apiKey = process.env.NEXT_PUBLIC_DIFY_API_KEY || process.env.DIFY_API_KEY || '';
    
    console.log('Dify API Client initialized:', {
      apiUrl: this.apiUrl,
      hasApiKey: !!this.apiKey,
      apiKeyLength: this.apiKey ? this.apiKey.length : 0,
      envVars: {
        NEXT_PUBLIC_DIFY_API_URL: process.env.NEXT_PUBLIC_DIFY_API_URL,
        DIFY_API_URL: process.env.DIFY_API_URL,
        NEXT_PUBLIC_DIFY_API_KEY: process.env.NEXT_PUBLIC_DIFY_API_KEY,
        DIFY_API_KEY: process.env.DIFY_API_KEY
      }
    });
  }

  async chatCompletion(
    messages: DifyMessage[],
    conversationId?: string
  ): Promise<DifyResponse> {
    try {
      if (!this.apiKey) {
        throw new Error('DIFY_API_KEYが設定されていません。環境変数を確認してください。');
      }

      console.log('Sending request to Dify API:', {
        url: `${this.apiUrl}/chat-messages`,
        message: messages[messages.length - 1].content,
        conversationId
      });

      // Dify APIの正しいリクエスト形式
      const requestBody: any = {
        inputs: {},
        query: messages[messages.length - 1].content,
        response_mode: 'blocking',
        user: 'user'
      };

      // conversation_idが存在する場合のみ追加
      if (conversationId) {
        requestBody.conversation_id = conversationId;
      }

      // 複数のエンドポイントを試行
      const endpoints = [
        '/chat-messages',
        '/messages',
        '/completion-messages'
      ];

      let lastError: any = null;

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${this.apiUrl}${endpoint}`);
          
          // APIキーの形式を確認
          const authHeader = this.apiKey.startsWith('Bearer ') 
            ? this.apiKey 
            : `Bearer ${this.apiKey}`;
          
          const response = await axios.post(
            `${this.apiUrl}${endpoint}`,
            requestBody,
            {
              headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
              }
            }
          );

          console.log('Dify API response:', response.data);
          return response.data;
        } catch (error: any) {
          console.log(`Endpoint ${endpoint} failed:`, error.response?.status, error.response?.data);
          lastError = error;
          
          // 404エラーの場合は次のエンドポイントを試行
          if (error.response?.status === 404) {
            continue;
          }
          
          // その他のエラーは即座にスロー
          throw error;
        }
      }

      // すべてのエンドポイントが失敗した場合
      throw lastError;
    } catch (error: any) {
      console.error('Dify API Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method
        }
      });

      if (error.response?.status === 400) {
        const errorDetails = error.response?.data?.message || error.response?.data?.error || 'リクエストの形式が正しくありません';
        throw new Error(`APIリクエストエラー (400): ${errorDetails}`);
      } else if (error.response?.status === 401) {
        throw new Error('APIキーが無効です。DIFY_API_KEYを確認してください。');
      } else if (error.response?.status === 404) {
        throw new Error('APIエンドポイントが見つかりません。NEXT_PUBLIC_DIFY_API_URLを確認してください。');
      } else if (error.response?.status >= 500) {
        throw new Error('Difyサーバーエラーが発生しました。しばらく待ってから再試行してください。');
      } else {
        throw new Error(`API呼び出しエラー: ${error.message}`);
      }
    }
  }

  async generateImage(prompt: string): Promise<string> {
    try {
      if (!this.apiKey) {
        throw new Error('DIFY_API_KEYが設定されていません。環境変数を確認してください。');
      }

      console.log('Generating image with prompt:', prompt);

      const response = await axios.post(
        `${this.apiUrl}/text-to-image`,
        {
          prompt: prompt,
          size: '1024x1024',
          quality: 'standard',
          style: 'vivid'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Image generation response:', response.data);
      return response.data.url;
    } catch (error: any) {
      console.error('Dify Image Generation Error:', error);
      throw new Error(`画像生成エラー: ${error.message}`);
    }
  }

  // ワークフロー実行用のメソッド
  async executeWorkflow(
    workflowId: string,
    inputs: Record<string, any>
  ): Promise<any> {
    try {
      if (!this.apiKey) {
        throw new Error('DIFY_API_KEYが設定されていません。環境変数を確認してください。');
      }

      console.log('Executing workflow:', { workflowId, inputs });

      // Difyのワークフロー実行用の複数のエンドポイントを試行
      const workflowEndpoints = [
        `/workflows/${workflowId}/runs`,           // 標準的なワークフロー実行
        `/workflows/${workflowId}/execute`,       // ワークフロー実行（代替）
        `/workflow/${workflowId}/run`,            // 単数形ワークフロー
        `/workflow/${workflowId}/execute`,        // 単数形ワークフロー実行
        `/api/workflows/${workflowId}/runs`,      // APIプレフィックス付き
        `/api/workflows/${workflowId}/execute`,   // APIプレフィックス付き実行
        `/v1/workflows/${workflowId}/runs`,      // バージョン付き
        `/v1/workflows/${workflowId}/execute`    // バージョン付き実行
      ];

      let lastWorkflowError: any = null;

      for (const endpoint of workflowEndpoints) {
        try {
          console.log(`Trying workflow endpoint: ${this.apiUrl}${endpoint}`);
          
          // APIキーの形式を確認
          const authHeader = this.apiKey.startsWith('Bearer ') 
            ? this.apiKey 
            : `Bearer ${this.apiKey}`;

          const response = await axios.post(
            `${this.apiUrl}${endpoint}`,
            {
              inputs: inputs
            },
            {
              headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
              }
            }
          );

          console.log('Workflow execution response:', response.data);
          return response.data;
        } catch (error: any) {
          console.log(`Workflow endpoint ${endpoint} failed:`, error.response?.status, error.response?.data);
          lastWorkflowError = error;
          
          // 404エラーの場合は次のエンドポイントを試行
          if (error.response?.status === 404) {
            continue;
          }
          
          // その他のエラーは即座にスロー
          throw error;
        }
      }

      // すべてのエンドポイントが失敗した場合
      throw lastWorkflowError;
    } catch (error: any) {
      console.error('Workflow execution error:', error);
      
      if (error.response?.status === 400) {
        const errorDetails = error.response?.data?.message || error.response?.data?.error || 'ワークフローリクエストの形式が正しくありません';
        throw new Error(`ワークフロー実行エラー (400): ${errorDetails}`);
      } else if (error.response?.status === 401) {
        throw new Error('ワークフロー実行の認証に失敗しました。APIキーを確認してください。');
      } else if (error.response?.status === 404) {
        throw new Error('ワークフローが見つかりません。ワークフローIDを確認してください。');
      } else if (error.response?.status >= 500) {
        throw new Error('ワークフロー実行中にサーバーエラーが発生しました。');
      } else {
        throw new Error(`ワークフロー実行エラー: ${error.message}`);
      }
    }
  }
}

// シングルトンインスタンス
export const difyClient = new DifyAPIClient(); 