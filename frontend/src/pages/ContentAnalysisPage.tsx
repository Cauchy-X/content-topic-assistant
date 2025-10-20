import React, { useState } from 'react';
import { 
  Card, 
  Button, 
  Select, 
  Input,
  Typography, 
  Row, 
  Col, 
  message,
  Spin,
  Empty,
  Tag,
  Space,
  Tabs,
  Statistic
} from 'antd';
import { 
  SearchOutlined, 
  BulbOutlined,
  FileTextOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { 
  analyzeContent, 
  generateSuggestions, 
  generateOutline,
  clearAnalysis
} from '../store/slices/analysisSlice';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const ContentAnalysisPage: React.FC = () => {
  const dispatch = useDispatch();
  const { 
    analysis, 
    suggestions, 
    outline,
    isLoading,
    error 
  } = useSelector((state: RootState) => state.analysis);
  
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState<'article' | 'video' | 'image' | 'mixed'>('article');
  const [analysisType, setAnalysisType] = useState('all');

  const handleAnalyze = () => {
    if (!content.trim()) {
      message.warning('请输入要分析的内容');
      return;
    }

    // 清除之前的分析结果
    dispatch(clearAnalysis());

    // 根据分析类型执行不同的操作
    if (analysisType === 'all' || analysisType === 'analysis') {
      // 模拟topicIds，实际应用中可能需要从内容中提取或让用户选择
      dispatch(analyzeContent({ content: content, platform: 'general' }) as any);
    }
    
    if (analysisType === 'all' || analysisType === 'suggestions') {
      dispatch(generateSuggestions({ 
        keywords: content.split(' ').filter(word => word.length > 2), // 简单提取关键词
        platform: 'general',
        count: 5
      }) as any);
    }
    
    if (analysisType === 'all' || analysisType === 'outline') {
      dispatch(generateOutline({
        topic: 'mock-topic-id',
        platform: 'general'
      }) as any);
    }
  };

  // 显示错误信息
  React.useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  const handleReset = () => {
    setContent('');
    dispatch(clearAnalysis());
  };

  const renderContentAnalysis = () => {
    if (!analysis) {
      return <Empty description="暂无分析结果" />;
    }

    return (
      <div>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card title="内容概览" size="small">
              <Paragraph>{analysis.summary}</Paragraph>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="关键词" size="small">
              <div>
                {analysis.keywords?.map((keyword, index) => (
                  <Tag key={`keyword-${keyword}-${index}`} color="blue" style={{ marginBottom: 8 }}>
                    {keyword}
                  </Tag>
                )) || <Text type="secondary">暂无关键词</Text>}
              </div>
            </Card>
          </Col>
          <Col span={12}>
            <Card type="inner" title="情感倾向">
              <div>
                <Text strong>情感: </Text>
                {analysis.sentiment ? (
                  <Tag color={analysis.sentiment.polarity === 'positive' ? 'green' : analysis.sentiment.polarity === 'negative' ? 'red' : 'blue'}>
                    {analysis.sentiment.polarity === 'positive' ? '积极' : analysis.sentiment.polarity === 'negative' ? '消极' : '中性'}
                  </Tag>
                ) : (
                  <Tag>未知</Tag>
                )}
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">评分: {analysis.sentiment?.score || '未知'}</Text>
                </div>
              </div>
            </Card>
          </Col>
          <Col span={24}>
            <Card title="可读性分析" size="small">
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic title="阅读难度" value={analysis.difficulty || '未知'} />
                </Col>
                <Col span={8}>
                  <Statistic title="阅读时间" value={analysis.readingTime || '未知'} suffix="分钟" />
                </Col>
                <Col span={8}>
                  <Statistic title="字数" value={analysis.wordCount || '未知'} />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  const renderTopicSuggestions = () => {
    if (!suggestions || suggestions.length === 0) {
      return <Empty description="暂无话题建议" />;
    }

    return (
      <div>
        {suggestions.map((suggestion, index) => (
          <Card 
            key={suggestion.id || index} 
            title={`建议 ${index + 1}: ${suggestion.title}`}
            size="small"
            style={{ marginBottom: 16 }}
          >
            <Paragraph>{suggestion.description}</Paragraph>
            <div>
              <Space wrap>
                {suggestion.category && <Tag color="blue">{suggestion.category}</Tag>}
                {suggestion.difficulty && <Tag color="green">难度: {suggestion.difficulty}</Tag>}
                {suggestion.heat && <Tag color="orange">热度: {suggestion.heat}</Tag>}
                {suggestion.competitionLevel && <Tag color="purple">竞争: {suggestion.competitionLevel}</Tag>}
              </Space>
            </div>
            {suggestion.keywords && suggestion.keywords.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <Text strong>关键词：</Text>
                <div style={{ marginTop: 8 }}>
                  {suggestion.keywords.map((keyword, idx) => (
                    <Tag key={`suggestion-keyword-${keyword}-${idx}`} color="cyan" style={{ marginBottom: 4 }}>
                      {keyword}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
            {suggestion.estimatedViews && (
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">预计浏览量: {suggestion.estimatedViews.toLocaleString()}</Text>
              </div>
            )}
          </Card>
        ))}
      </div>
    );
  };

  const renderContentOutline = () => {
    if (!outline) {
      return <Empty description="暂无内容大纲" />;
    }

    return (
      <div>
        <Card title="内容大纲" size="small">
          <div>
            {outline.sections.map((section, index) => (
              <div key={section.id} style={{ marginBottom: 16 }}>
                <Title level={4}>{index + 1}. {section.title}</Title>
                <Paragraph>{section.content}</Paragraph>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>内容分析</Title>
        <Text type="secondary">分析您的内容，获取关键词、情感倾向、话题建议和内容大纲</Text>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Text strong>内容类型：</Text>
            <Select
              value={contentType}
              onChange={(value) => setContentType(value)}
              style={{ width: 200, marginLeft: 8 }}
            >
              <Option value="article">文章</Option>
              <Option value="video">视频</Option>
              <Option value="image">图片</Option>
              <Option value="mixed">混合</Option>
            </Select>
          </Col>
          <Col span={24}>
            <Text strong>分析类型：</Text>
            <Select
              value={analysisType}
              onChange={(value) => setAnalysisType(value)}
              style={{ width: 200, marginLeft: 8 }}
            >
              <Option value="all">全部分析</Option>
              <Option value="analysis">内容分析</Option>
              <Option value="suggestions">话题建议</Option>
              <Option value="outline">内容大纲</Option>
            </Select>
          </Col>
          <Col span={24}>
            <Text strong>输入内容：</Text>
            <TextArea
              placeholder="输入您要分析的内容，可以是文章、视频脚本或社交媒体帖子..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              autoSize={{ minRows: 6, maxRows: 12 }}
              style={{ marginTop: 8 }}
            />
          </Col>
          <Col span={24}>
            <Space>
              <Button 
                type="primary" 
                icon={<SearchOutlined />} 
                onClick={handleAnalyze}
                loading={isLoading}
              >
                开始分析
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Spin spinning={isLoading}>
        <Tabs defaultActiveKey="analysis">
          <TabPane tab={<span><FileTextOutlined />内容分析</span>} key="analysis">
            {renderContentAnalysis()}
          </TabPane>
          <TabPane tab={<span><BulbOutlined />话题建议</span>} key="suggestions">
            {renderTopicSuggestions()}
          </TabPane>
          <TabPane tab={<span><FileTextOutlined />内容大纲</span>} key="outline">
            {renderContentOutline()}
          </TabPane>
        </Tabs>
      </Spin>
    </div>
  );
};

export default ContentAnalysisPage;