import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { TopicSearchParams as ImportedTopicSearchParams } from '../../services/topicService';

export interface Topic {
  id: string;
  keyword: string;
  platform: string;
  title: string;
  content: string;
  author: string;
  publishTime: string;
  url: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  heat: number;
}

export interface TopicSearchParams {
  keyword: string;
  platforms: string[];
  sort?: string;
  page?: number;
  limit?: number;
  offset?: number;
}

export interface TopicState {
  topics: Topic[];
  currentTopic: Topic | null;
  searchHistory: ImportedTopicSearchParams[];
  isLoading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
}

const initialState: TopicState = {
  topics: [],
  currentTopic: null,
  searchHistory: [],
  isLoading: false,
  error: null,
  total: 0,
  hasMore: true,
};

// 异步搜索话题
export const searchTopics = createAsyncThunk(
  'topic/searchTopics',
  async (params: TopicSearchParams, { rejectWithValue }) => {
    try {
      console.log('topicSlice.searchTopics被调用，参数:', params);
      // 使用topicService进行搜索
      const { topicService } = await import('../../services/topicService');
      
      // 调用搜索API
      console.log('调用topicService.searchTopics...');
      const response = await topicService.searchTopics(params);
      console.log('搜索API响应:', response);
      return response;
    } catch (error) {
      console.error('搜索失败:', error);
      return rejectWithValue(error instanceof Error ? error.message : '未知错误');
    }
  }
);

// 获取话题详情
export const getTopicDetail = createAsyncThunk(
  'topic/getTopicDetail',
  async (topicId: string, { rejectWithValue }) => {
    try {
      // 这里将替换为实际的API调用
      const response = await fetch(`/api/topics/${topicId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('获取话题详情失败');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '未知错误');
    }
  }
);

const topicSlice = createSlice({
  name: 'topic',
  initialState,
  reducers: {
    addToSearchHistory: (state, action: PayloadAction<ImportedTopicSearchParams>) => {
      const params = action.payload;
      if (params.keyword) {
        // 检查是否已存在相同关键词的搜索记录
        const existingIndex = state.searchHistory.findIndex(
          item => item.keyword === params.keyword
        );
        
        if (existingIndex !== -1) {
          // 如果存在，移除旧记录
          state.searchHistory.splice(existingIndex, 1);
        }
        
        // 添加到开头
        state.searchHistory.unshift(params);
        
        // 最多保留10条搜索历史
        if (state.searchHistory.length > 10) {
          state.searchHistory = state.searchHistory.slice(0, 10);
        }
      }
    },
    clearSearchHistory: (state) => {
      state.searchHistory = [];
    },
    clearTopics: (state) => {
      state.topics = [];
      state.total = 0;
      state.hasMore = true;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 搜索话题
      .addCase(searchTopics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchTopics.fulfilled, (state, action) => {
        state.isLoading = false;
        // 添加对返回数据的检查，确保即使数据结构不完整也不会导致错误
        state.topics = Array.isArray(action.payload?.topics) ? action.payload.topics : [];
        state.total = typeof action.payload?.total === 'number' ? action.payload.total : 0;
        state.hasMore = typeof action.payload?.hasMore === 'boolean' ? action.payload.hasMore : false;
      })
      .addCase(searchTopics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // 获取话题详情
      .addCase(getTopicDetail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getTopicDetail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentTopic = action.payload;
      })
      .addCase(getTopicDetail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  addToSearchHistory, 
  clearSearchHistory, 
  clearTopics,
  clearError 
} = topicSlice.actions;
export default topicSlice.reducer;