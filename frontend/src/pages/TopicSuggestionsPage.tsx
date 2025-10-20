import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Select, Table, Tag, Spin, message, Switch } from 'antd';
import { FireOutlined, EyeOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useAppDispatch } from '../store/hooks';
import { generateSuggestions, clearSuggestions } from '../store/slices/analysisSlice';
import { TopicSuggestion } from '../services/analysisService';
import './TopicSuggestionsPage.css';

const { TextArea } = Input;
const { Option } = Select;

// 格式化选题建议显示
const formatSuggestions = (suggestions: any[]): TopicSuggestion[] => {
  return suggestions.map((suggestion, index) => {
    // 处理难度字段，确保统一为中文
    let difficulty = suggestion.difficulty;
    if (typeof difficulty === 'number') {
      difficulty = difficulty === 1 ? '初级' : 
                  difficulty === 2 ? '中级' : 
                  difficulty === 3 ? '高级' : '中级';
    } else if (typeof difficulty === 'string') {
      difficulty = difficulty === 'easy' ? '初级' : 
                  difficulty === 'medium' ? '中级' : 
                  difficulty === 'hard' ? '高级' : 
                  difficulty;
    } else {
      difficulty = '中级';
    }
    
    // 处理竞争程度字段
    let competitionLevel = suggestion.competitionLevel;
    if (typeof competitionLevel === 'string') {
      competitionLevel = competitionLevel === 'low' ? '低' : 
                        competitionLevel === 'medium' ? '中' : 
                        competitionLevel === 'high' ? '高' : 
                        competitionLevel === '中等' ? '中' : competitionLevel;
    }
    
    return {
      ...suggestion,
      // 确保有id字段，如果没有则使用索引
      id: suggestion.id || `suggestion-${index}`,
      // 确保difficulty字段是中文
      difficulty,
      // 确保competitionLevel字段是中文
      competitionLevel,
      // 确保有createdAt字段
      createdAt: suggestion.createdAt || new Date().toISOString()
    };
  });
};

const TopicSuggestionsPage: React.FC = () => {
  const [form] = Form.useForm();
  const [model, setModel] = useState<'deepseek' | 'doubao'>('deepseek');
  const [useCrawler, setUseCrawler] = useState(false); // 新增状态，控制是否使用爬虫数据
  
  // Redux状态管理
  const dispatch = useAppDispatch();
  const { suggestions, isLoading: loading, error } = useSelector((state: RootState) => state.analysis);
  
  // 监听错误和成功状态
  useEffect(() => {
    if (error) {
      console.error('Redux错误状态:', error);
      message.error(error);
    }
    if (suggestions.length > 0) {
      console.log('Redux建议数据:', suggestions);
      console.log('格式化后的建议数据:', formatSuggestions(suggestions));
      message.success(`成功生成${suggestions.length}条选题建议`);
    }
  }, [error, suggestions]);
  
  // 组件卸载时清除数据
  useEffect(() => {
    return () => {
      dispatch(clearSuggestions());
    };
  }, [dispatch]);

  // 处理生成选题建议
  const handleGenerateSuggestions = async (values: any) => {
    try {
      const { keywords, platform, count = 5 } = values;
      
      // 将关键词字符串转换为数组
      const keywordsArray = keywords.split(/[,，\s]+/).filter((k: string) => k.trim());
      
      if (keywordsArray.length === 0) {
        message.error('请输入至少一个关键词');
        return;
      }

      console.log('发送请求参数:', {
        keywords: keywordsArray,
        platform,
        count,
        model: values.model || model,
        useCrawler: values.useCrawler !== undefined ? values.useCrawler : useCrawler
      });

      // 使用Redux action生成选题建议
      const result = await dispatch(generateSuggestions({
        keywords: keywordsArray,
        platform,
        count,
        model: values.model || model, // 使用表单中的model值，如果没有则使用组件状态中的model
        useCrawler: values.useCrawler !== undefined ? values.useCrawler : useCrawler // 添加爬虫参数
      })).unwrap();
      
      console.log('API返回结果:', result);
    } catch (error: any) {
      console.error('生成选题建议失败:', error);
      message.error(error.message || '生成选题建议失败，请重试');
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: '35%',
      render: (text: string) => (
        <div style={{ 
          fontWeight: 600, 
          fontSize: '16px',
          color: '#1890ff',
          lineHeight: '1.4'
        }}>
          {text}
        </div>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: '8%',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: '8%',
      render: (text: string) => {
        let color = 'green';
        if (text === '中级') color = 'orange';
        if (text === '高级') color = 'red';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '热度',
      dataIndex: 'heat',
      key: 'heat',
      width: '8%',
      render: (value: number) => {
        // 如果没有热度值，显示默认值
        const displayValue = value || 0;
        return (
          <div>
            <FireOutlined style={{ color: displayValue > 80 ? '#ff4d4f' : displayValue > 60 ? '#fa8c16' : '#52c41a' }} />
            <span style={{ marginLeft: 8 }}>{displayValue}</span>
          </div>
        );
      },
      sorter: (a: TopicSuggestion, b: TopicSuggestion) => (a.heat || 0) - (b.heat || 0),
    },
    {
      title: '竞争程度',
      dataIndex: 'competitionLevel',
      key: 'competitionLevel',
      width: '8%',
      render: (text: string) => {
        let color = 'green';
        let displayText = '低';
        if (text === 'medium') {
          color = 'orange';
          displayText = '中';
        }
        if (text === 'high') {
          color = 'red';
          displayText = '高';
        }
        return <Tag color={color}>{displayText}</Tag>;
      },
    },
    {
      title: '预估浏览量',
      dataIndex: 'estimatedViews',
      key: 'estimatedViews',
      width: '10%',
      render: (value: number) => {
        // 如果没有预估浏览量，显示默认值
        const displayValue = value || 0;
        return (
          <div>
            <EyeOutlined />
            <span style={{ marginLeft: 8 }}>{displayValue.toLocaleString()}</span>
          </div>
        );
      },
      sorter: (a: TopicSuggestion, b: TopicSuggestion) => (a.estimatedViews || 0) - (b.estimatedViews || 0),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: '18%',
      ellipsis: true,
      render: (text: string) => {
        if (!text) return '-';
        // 限制描述长度，最多显示60个字符
        const truncatedText = text.length > 60 ? `${text.substring(0, 60)}...` : text;
        return (
          <div style={{ 
            fontSize: '14px',
            color: '#666',
            lineHeight: '1.4'
          }}>
            {truncatedText}
          </div>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: '5%',
      render: (_: any, record: TopicSuggestion) => (
        <Button type="primary" size="small">
          选择此主题
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Card title="选题建议" style={{ marginBottom: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleGenerateSuggestions}
          initialValues={{
            platform: 'xiaohongshu',
            count: 5,
            model: 'deepseek',
            useCrawler: false,
          }}
        >
          <Form.Item
            label="关键词"
            name="keywords"
            rules={[{ required: true, message: '请输入关键词' }]}
            extra="多个关键词请用逗号或空格分隔"
          >
            <TextArea
              rows={2}
              placeholder="例如：人工智能, 机器学习, 深度学习"
            />
          </Form.Item>

          <Form.Item
            label="内容分类"
            name="platform"
            rules={[{ required: true, message: '请选择内容分类' }]}
          >
            <Select placeholder="请选择内容分类">
              <Option key="xiaohongshu" value="xiaohongshu">小红书</Option>
              <Option key="douyin" value="douyin">抖音</Option>
              <Option key="bilibili" value="bilibili">B站</Option>
              <Option key="zhihu" value="zhihu">知乎</Option>
              <Option key="weibo" value="weibo">微博</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="AI模型"
            name="model"
          >
            <Select value={model} onChange={setModel}>
              <Option key="deepseek" value="deepseek">DeepSeek</Option>
              <Option key="doubao" value="doubao">豆包</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="使用爬虫数据"
            name="useCrawler"
            valuePropName="checked"
            extra="开启后将使用爬虫数据生成更精准的选题建议"
          >
            <Switch 
              checked={useCrawler} 
              onChange={setUseCrawler}
              checkedChildren="是"
              unCheckedChildren="否"
            />
          </Form.Item>

          <Form.Item
            label="建议数量"
            name="count"
          >
            <Select defaultValue={5}>
              <Option key="3" value={3}>3条</Option>
              <Option key="5" value={5}>5条</Option>
              <Option key="10" value={10}>10条</Option>
              <Option key="15" value={15}>15条</Option>
              <Option key="20" value={20}>20条</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<ThunderboltOutlined />}
              size="large"
            >
              生成选题建议
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {suggestions.length > 0 && (
        <Card title="选题建议列表">
          <div className="topic-suggestions-table">
            <Table
              dataSource={formatSuggestions(suggestions)}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              size="middle"
              rowClassName={() => 'custom-table-row'}
            />
          </div>
        </Card>
      )}

      {loading && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>正在生成选题建议，请稍候...</div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TopicSuggestionsPage;