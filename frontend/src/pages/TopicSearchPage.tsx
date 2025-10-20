import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Input, 
  Button, 
  Select, 
  Table, 
  Tag, 
  Space, 
  Typography, 
  Row, 
  Col, 
  Pagination,
  message,
  Spin,
  Empty,
  Tooltip,
  Divider,
  Tabs,
  Switch,
  Modal
} from 'antd';
import { 
  SearchOutlined, 
  ReloadOutlined, 
  ExportOutlined,
  EyeOutlined,
  LikeOutlined,
  MessageOutlined,
  LinkOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { searchTopics, addToSearchHistory } from '../store/slices/topicSlice';
import { Topic } from '../services/topicService';
import { TopicSearchParams } from '../store/slices/topicSlice';
import { crawlerService, CrawlResult } from '../services/crawlerService';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const TopicSearchPage: React.FC = () => {
  const dispatch = useDispatch();
  const { topics, isLoading, searchHistory, total, error } = useSelector((state: RootState) => state.topic);
  
  // 添加错误处理
  React.useEffect(() => {
    if (error) {
      message.error(`搜索失败: ${error}`);
    }
  }, [error]);
  
  const [searchParams, setSearchParams] = useState<TopicSearchParams>({
    keyword: '',
    platforms: ['zhihu'],
    sort: 'hot',
    page: 1,
    limit: 20
  });
  
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });

  // URL爬取相关状态
  const [activeTab, setActiveTab] = useState('search');
  const [crawlUrl, setCrawlUrl] = useState('');
  const [batchUrls, setBatchUrls] = useState('');
  const [usePuppeteer, setUsePuppeteer] = useState(false);
  const [maxDepth, setMaxDepth] = useState(1);
  const [crawlResults, setCrawlResults] = useState<CrawlResult[]>([]);
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlModalVisible, setCrawlModalVisible] = useState(false);
  const [currentCrawlResult, setCurrentCrawlResult] = useState<CrawlResult | null>(null);

  useEffect(() => {
    // 如果有搜索历史，使用最近的搜索参数
    if (searchHistory.length > 0) {
      const lastSearch = searchHistory[searchHistory.length - 1];
      // 兼容旧格式的搜索历史
      const platforms = lastSearch.platforms || ((lastSearch as any).platform ? [(lastSearch as any).platform] : ['zhihu']);
      setSearchParams({
        ...lastSearch,
        platforms
      });
      setPagination({
        current: lastSearch.page || 1,
        pageSize: lastSearch.limit || 20,
        total: 0
      });
    }
  }, [searchHistory]);

  // 监听total变化，更新分页状态
  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      total
    }));
  }, [total]);
  
  const handleSearch = () => {
    console.log('handleSearch被调用');
    if (!searchParams.keyword.trim()) {
      message.warning('请输入搜索关键词');
      return;
    }

    // 重置分页为第一页
    const newParams = {
      ...searchParams,
      page: 1
    };
    console.log('准备搜索，参数:', newParams);
    setSearchParams(newParams);
    setPagination(prev => ({
      ...prev,
      current: 1
    }));
    
    // 添加到搜索历史
    dispatch(addToSearchHistory(newParams));
    
    // 执行搜索
    console.log('开始执行搜索...');
    dispatch(searchTopics(newParams) as any);
  };

  const handleReset = () => {
    setSearchParams({
      keyword: '',
      platforms: ['zhihu'],
      sort: 'hot',
      page: 1,
      limit: 20
    });
    setPagination({
      current: 1,
      pageSize: 20,
      total: 0
    });
  };

  const handlePageChange = (page: number, pageSize?: number) => {
    const newParams = {
      ...searchParams,
      page,
      limit: pageSize || 20
    };
    setSearchParams(newParams);
    setPagination(prev => ({
      ...prev,
      current: page,
      pageSize: pageSize || 20
    }));
    dispatch(searchTopics(newParams) as any);
  };

  const handleExport = () => {
    // 导出功能实现
    message.info('导出功能开发中...');
  };

  // URL爬取相关处理函数
  const handleSingleUrlCrawl = async () => {
    if (!crawlUrl.trim()) {
      message.warning('请输入要爬取的URL');
      return;
    }

    try {
      setIsCrawling(true);
      const result = await crawlerService.crawlUrl({
        url: crawlUrl,
        usePuppeteer,
        maxDepth
      });
      
      if (result.success) {
        message.success('URL爬取成功');
        setCrawlResults([result]);
      } else {
        message.error(`爬取失败: ${result.error}`);
      }
    } catch (error) {
      message.error('爬取过程中发生错误');
      console.error(error);
    } finally {
      setIsCrawling(false);
    }
  };

  const handleBatchUrlCrawl = async () => {
    if (!batchUrls.trim()) {
      message.warning('请输入要批量爬取的URL，每行一个');
      return;
    }

    const urls = batchUrls.split('\n').filter(url => url.trim());
    if (urls.length === 0) {
      message.warning('请输入有效的URL');
      return;
    }

    try {
      setIsCrawling(true);
      const response = await crawlerService.batchCrawlUrls({
        urls,
        usePuppeteer,
        maxDepth
      });
      
      message.success(`批量爬取完成，成功: ${response.successCount}，失败: ${response.failureCount}`);
      setCrawlResults(response.results);
    } catch (error) {
      message.error('批量爬取过程中发生错误');
      console.error(error);
    } finally {
      setIsCrawling(false);
    }
  };

  const showCrawlResultModal = (result: CrawlResult) => {
    setCurrentCrawlResult(result);
    setCrawlModalVisible(true);
  };

  const resetCrawlForm = () => {
    setCrawlUrl('');
    setBatchUrls('');
    setUsePuppeteer(false);
    setMaxDepth(1);
    setCrawlResults([]);
  };

  // 爬取结果表格列定义
  const crawlResultColumns = [
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      render: (text: string) => (
        <a href={text} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all' }}>
          {text}
        </a>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => (
        <div>{text || '无标题'}</div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'success',
      key: 'success',
      render: (success: boolean, record: CrawlResult) => (
        <Tag color={success ? 'green' : 'red'}>
          {success ? '成功' : '失败'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (record: CrawlResult) => (
        <Space>
          {record.success && (
            <Button 
              size="small" 
              icon={<EyeOutlined />} 
              onClick={() => showCrawlResultModal(record)}
            >
              查看详情
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Topic) => (
        <div>
          <a href={record.url} target="_blank" rel="noopener noreferrer">
            {text}
          </a>
          {record.platform === 'web' && record.summary && (
            <div style={{ marginTop: 4, color: '#666', fontSize: '12px' }}>
              {record.summary.length > 100 ? `${record.summary.substring(0, 100)}...` : record.summary}
            </div>
          )}
          <div style={{ marginTop: 4 }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.author}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: string) => {
        let color = 'blue';
        let text = platform;
        
        switch(platform) {
          case 'zhihu':
            color = 'blue';
            text = '知乎';
            break;
          case 'weibo':
            color = 'green';
            text = '微博';
            break;
          case 'xiaohongshu':
            color = 'red';
            text = '小红书';
            break;
          case 'douyin':
            color = 'black';
            text = '抖音';
            break;
          case 'web':
            color = 'purple';
            text = '全网';
            break;
          default:
            color = 'default';
            text = platform;
        }
        
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '互动数据',
      key: 'interaction',
      render: (record: Topic) => (
        <Space>
          <Tooltip title="点赞数">
            <span><LikeOutlined /> {record.likes}</span>
          </Tooltip>
          <Tooltip title="评论数">
            <span><MessageOutlined /> {record.comments}</span>
          </Tooltip>
          <Tooltip title="浏览数">
            <span><EyeOutlined /> {record.views}</span>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '发布时间',
      dataIndex: 'publishTime',
      key: 'publishTime',
      render: (time: string) => (
        <Text>{time}</Text>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>话题搜索与内容爬取</Title>
        <Text type="secondary">搜索全网热门话题，爬取指定URL内容，发现内容创作灵感</Text>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane 
          tab={
            <span>
              <SearchOutlined />
              话题搜索
            </span>
          } 
          key="search"
        >
          <Card style={{ marginBottom: 24 }}>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Text strong>搜索关键词：</Text>
                <TextArea
                  placeholder="输入您感兴趣的关键词，如：人工智能、创业、健康生活等"
                  value={searchParams.keyword}
                  onChange={(e) => setSearchParams({ ...searchParams, keyword: e.target.value })}
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  style={{ marginTop: 8 }}
                />
              </Col>
              <Col span={8}>
                <Text strong>平台：</Text>
                <Select
                  mode="multiple"
                  value={searchParams.platforms}
                  onChange={(value) => setSearchParams({ ...searchParams, platforms: value })}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  <Option key="web" value="web">全网搜索</Option>
                  <Option key="zhihu" value="zhihu">知乎</Option>
                  <Option key="weibo" value="weibo">微博</Option>
                  <Option key="xiaohongshu" value="xiaohongshu">小红书</Option>
                  <Option key="douyin" value="douyin">抖音</Option>
                </Select>
              </Col>
              <Col span={8}>
                <Text strong>排序方式：</Text>
                <Select
                  value={searchParams.sort}
                  onChange={(value) => setSearchParams({ ...searchParams, sort: value })}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  <Option key="hot" value="hot">热门</Option>
                  <Option key="new" value="new">最新</Option>
                  <Option key="comments" value="comments">评论最多</Option>
                  <Option key="likes" value="likes">点赞最多</Option>
                </Select>
              </Col>
              <Col span={8}>
                <Text strong>每页显示：</Text>
                <Select
                  value={searchParams.limit}
                  onChange={(value) => setSearchParams({ ...searchParams, limit: value })}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  <Option key="10" value={10}>10条</Option>
                  <Option key="20" value={20}>20条</Option>
                  <Option key="50" value={50}>50条</Option>
                  <Option key="100" value={100}>100条</Option>
                </Select>
              </Col>
              <Col span={24}>
                <Space>
                  <Button 
                    type="primary" 
                    icon={<SearchOutlined />} 
                    onClick={handleSearch}
                    loading={isLoading}
                  >
                    搜索
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={handleReset}>
                    重置
                  </Button>
                  <Button icon={<ExportOutlined />} onClick={handleExport}>
                    导出结果
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          <Card>
            <Spin spinning={isLoading}>
              {topics && topics.length > 0 ? (
                <>
                  <Table
                    dataSource={topics}
                    columns={columns}
                    rowKey="id"
                    pagination={false}
                  />
                  <Divider />
                  <div style={{ textAlign: 'right', marginTop: 16 }}>
                    <Pagination
                      current={pagination.current}
                      pageSize={pagination.pageSize}
                      total={pagination.total}
                      onChange={handlePageChange}
                      showSizeChanger
                      showQuickJumper
                      showTotal={(total) => `共 ${total} 条结果`}
                    />
                  </div>
                </>
              ) : (
                <Empty description="暂无搜索结果，请尝试其他关键词" />
              )}
            </Spin>
          </Card>
        </Tabs.TabPane>
        
        <Tabs.TabPane 
          tab={
            <span>
              <LinkOutlined />
              URL爬取
            </span>
          } 
          key="crawl"
        >
          <Card style={{ marginBottom: 24 }}>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Text strong>爬取选项：</Text>
                <div style={{ marginTop: 8 }}>
                  <Space>
                    <span>使用无头浏览器：</span>
                    <Switch 
                      checked={usePuppeteer} 
                      onChange={setUsePuppeteer} 
                      checkedChildren="是" 
                      unCheckedChildren="否" 
                    />
                    <span style={{ marginLeft: 16 }}>爬取深度：</span>
                    <Select 
                      value={maxDepth} 
                      onChange={setMaxDepth} 
                      style={{ width: 80 }}
                    >
                      <Option value={1}>1</Option>
                      <Option value={2}>2</Option>
                      <Option value={3}>3</Option>
                    </Select>
                  </Space>
                </div>
              </Col>
              <Col span={24}>
                <Text strong>单个URL爬取：</Text>
                <Input
                  placeholder="输入要爬取的URL，如：https://example.com/article"
                  value={crawlUrl}
                  onChange={(e) => setCrawlUrl(e.target.value)}
                  style={{ marginTop: 8 }}
                  addonAfter={
                    <Button 
                      type="primary" 
                      icon={<LinkOutlined />} 
                      onClick={handleSingleUrlCrawl}
                      loading={isCrawling}
                      size="small"
                    >
                      爬取
                    </Button>
                  }
                />
              </Col>
              <Col span={24}>
                <Text strong>批量URL爬取：</Text>
                <TextArea
                  placeholder="输入要批量爬取的URL，每行一个URL"
                  value={batchUrls}
                  onChange={(e) => setBatchUrls(e.target.value)}
                  autoSize={{ minRows: 4, maxRows: 8 }}
                  style={{ marginTop: 8 }}
                />
                <div style={{ marginTop: 8 }}>
                  <Space>
                    <Button 
                      type="primary" 
                      icon={<GlobalOutlined />} 
                      onClick={handleBatchUrlCrawl}
                      loading={isCrawling}
                    >
                      批量爬取
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={resetCrawlForm}>
                      重置
                    </Button>
                  </Space>
                </div>
              </Col>
            </Row>
          </Card>

          <Card>
            <Spin spinning={isCrawling}>
              {crawlResults.length > 0 ? (
                <Table
                  dataSource={crawlResults}
                  columns={crawlResultColumns}
                  rowKey="url"
                  pagination={false}
                />
              ) : (
                <Empty description="暂无爬取结果，请输入URL进行爬取" />
              )}
            </Spin>
          </Card>
        </Tabs.TabPane>
      </Tabs>

      {/* 爬取结果详情模态框 */}
      <Modal
        title="爬取结果详情"
        visible={crawlModalVisible}
        onCancel={() => setCrawlModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setCrawlModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {currentCrawlResult && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>URL：</Text>
              <a href={currentCrawlResult.url} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all' }}>
                {currentCrawlResult.url}
              </a>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>标题：</Text>
              <Text>{currentCrawlResult.title || '无标题'}</Text>
            </div>
            {currentCrawlResult.author && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>作者：</Text>
                <Text>{currentCrawlResult.author}</Text>
              </div>
            )}
            {currentCrawlResult.publishTime && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>发布时间：</Text>
                <Text>{currentCrawlResult.publishTime}</Text>
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <Text strong>内容：</Text>
              <div style={{ 
                marginTop: 8, 
                padding: 12, 
                background: '#f5f5f5', 
                borderRadius: 4,
                maxHeight: 300,
                overflow: 'auto'
              }}>
                <Text>{currentCrawlResult.content}</Text>
              </div>
            </div>
            {currentCrawlResult.images && currentCrawlResult.images.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>图片链接：</Text>
                <div style={{ marginTop: 8 }}>
                  {currentCrawlResult.images.map((img, index) => (
                    <div key={index} style={{ marginBottom: 4 }}>
                      <a href={img} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all' }}>
                        {img}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {currentCrawlResult.links && currentCrawlResult.links.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>页面链接：</Text>
                <div style={{ marginTop: 8 }}>
                  {currentCrawlResult.links.map((link, index) => (
                    <div key={index} style={{ marginBottom: 4 }}>
                      <a href={link} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all' }}>
                        {link}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TopicSearchPage;