import apiClient, { ApiResponse } from './apiClient';

export interface CrawlUrlParams {
  url: string;
  usePuppeteer?: boolean;
  maxDepth?: number;
}

export interface BatchCrawlParams {
  urls: string[];
  usePuppeteer?: boolean;
  maxDepth?: number;
}

export interface CrawlResult {
  url: string;
  title: string;
  content: string;
  author?: string;
  publishTime?: string;
  images?: string[];
  links?: string[];
  success: boolean;
  error?: string;
}

export interface BatchCrawlResponse {
  results: CrawlResult[];
  total: number;
  successCount: number;
  failureCount: number;
}

export const crawlerService = {
  // 爬取单个URL
  crawlUrl: async (params: CrawlUrlParams): Promise<CrawlResult> => {
    const response = await apiClient.post<ApiResponse<CrawlResult>>('/api/crawl', params);
    return response.data.data;
  },

  // 批量爬取URL
  batchCrawlUrls: async (params: BatchCrawlParams): Promise<BatchCrawlResponse> => {
    const response = await apiClient.post<ApiResponse<BatchCrawlResponse>>('/api/batch-crawl', params);
    return response.data.data;
  },
};