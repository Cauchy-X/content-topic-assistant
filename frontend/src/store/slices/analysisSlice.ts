import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { analysisService, ContentAnalysis, TopicSuggestion, ContentOutline } from '../../services/analysisService';

// 定义请求参数类型
interface ContentAnalysisRequest {
  content: string | any[];
  platform?: string;
}

interface TopicSuggestionRequest {
  keywords: string[];
  platform: string;
  count?: number;
  model?: 'deepseek' | 'doubao';
  useCrawler?: boolean;
}

interface OutlineRequest {
  topic: string;
  platform: string;
  style?: string;
}

export interface AnalysisState {
  analysis: ContentAnalysis | null;
  suggestions: TopicSuggestion[];
  outline: ContentOutline | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AnalysisState = {
  analysis: null,
  suggestions: [],
  outline: null,
  isLoading: false,
  error: null,
};

// 异步分析内容
export const analyzeContent = createAsyncThunk(
  'analysis/analyzeContent',
  async (params: ContentAnalysisRequest, { rejectWithValue }) => {
    try {
      // 根据params.content的类型决定如何调用analyzeContent
      if (Array.isArray(params.content)) {
        // 如果是数组，假设第一个元素是searchId，第二个是contentItems
        const [searchId, contentItems] = params.content;
        const response = await analysisService.analyzeContent(searchId, contentItems);
        return response;
      } else {
        // 如果是字符串，创建默认的searchId和contentItems
        const searchId = 'default-search-id';
        const contentItems = [{ content: params.content, platform: params.platform || 'default' }];
        const response = await analysisService.analyzeContent(searchId, contentItems);
        return response;
      }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '未知错误');
    }
  }
);

// 生成选题建议
export const generateSuggestions = createAsyncThunk(
  'analysis/generateSuggestions',
  async (params: TopicSuggestionRequest, { rejectWithValue }) => {
    try {
      const response = await analysisService.generateSuggestions(params);
      console.log('API响应:', response); // 添加调试日志
      // 检查响应结构，确保返回正确的数据
      if (response.success && response.data) {
        return response.data;
      } else if (Array.isArray(response)) {
        // 如果直接返回数组，也处理
        return response;
      } else {
        console.warn('响应格式不正确:', response);
        return [];
      }
    } catch (error) {
      console.error('生成选题建议失败:', error);
      return rejectWithValue(error instanceof Error ? error.message : '未知错误');
    }
  }
);

// 生成内容大纲
export const generateOutline = createAsyncThunk(
  'analysis/generateOutline',
  async (params: OutlineRequest, { rejectWithValue }) => {
    try {
      // 暂时返回空对象，因为generateOutline方法尚未实现
      const response = { success: true, data: null };
      return response.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '未知错误');
    }
  }
);

const analysisSlice = createSlice({
  name: 'analysis',
  initialState,
  reducers: {
    clearAnalysis: (state) => {
      state.analysis = null;
    },
    clearSuggestions: (state) => {
      state.suggestions = [];
    },
    clearOutline: (state) => {
      state.outline = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 分析内容
      .addCase(analyzeContent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(analyzeContent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.analysis = action.payload;
      })
      .addCase(analyzeContent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // 生成选题建议
      .addCase(generateSuggestions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateSuggestions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.suggestions = action.payload;
      })
      .addCase(generateSuggestions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // 生成内容大纲
      .addCase(generateOutline.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateOutline.fulfilled, (state, action) => {
        state.isLoading = false;
        state.outline = action.payload;
      })
      .addCase(generateOutline.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearAnalysis, 
  clearSuggestions, 
  clearOutline,
  clearError 
} = analysisSlice.actions;
export default analysisSlice.reducer;