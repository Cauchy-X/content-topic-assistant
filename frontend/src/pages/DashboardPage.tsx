import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Typography, List, Avatar, Tag, Spin, Empty } from 'antd';
import { 
  UserOutlined, 
  SearchOutlined, 
  BarChartOutlined, 
  BulbOutlined,
  FireOutlined,
  EyeOutlined,
  LikeOutlined,
  MessageOutlined
} from '@ant-design/icons';
import { topicService, Topic } from '../services/topicService';

const { Title, Paragraph, Text } = Typography;

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [hotTopics, setHotTopics] = useState<Topic[]>([]);
  const [stats, setStats] = useState({
    totalSearches: 0,
    totalAnalyses: 0,
    totalSuggestions: 0,
    totalOutlines: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // 获取热门话题
        const topics = await topicService.getHotTopics('zhihu', 5);
        setHotTopics(topics);
        
        // 这里应该调用API获取用户统计数据
        // 暂时使用模拟数据
        setStats({
          totalSearches: 23,
          totalAnalyses: 15,
          totalSuggestions: 8,
          totalOutlines: 5,
        });
      } catch (error) {
        console.error('获取仪表盘数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>仪表盘</Title>
        <Paragraph type="secondary">
          欢迎使用内容选题助手！这里是您的数据概览。
        </Paragraph>
      </div>

      <Spin spinning={loading}>
        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总搜索次数"
                value={stats.totalSearches}
                prefix={<SearchOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="内容分析"
                value={stats.totalAnalyses}
                prefix={<BarChartOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="选题建议"
                value={stats.totalSuggestions}
                prefix={<BulbOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="内容大纲"
                value={stats.totalOutlines}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 热门话题 */}
        <Card title="知乎热门话题" extra={<FireOutlined />}>
          {hotTopics.length > 0 ? (
            <List
              dataSource={hotTopics}
              renderItem={(item) => (
                <List.Item key={item.id}>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} src={item.author} />}
                    title={
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        {item.title}
                      </a>
                    }
                    description={
                      <div>
                        <Text type="secondary">{item.author}</Text>
                        <div style={{ marginTop: 4 }}>
                          <Tag color="blue">{item.platform}</Tag>
                          <span style={{ marginLeft: 8 }}>
                            <EyeOutlined /> {item.likes}
                          </span>
                          <span style={{ marginLeft: 8 }}>
                            <LikeOutlined /> {item.comments}
                          </span>
                          <span style={{ marginLeft: 8 }}>
                            <MessageOutlined /> {item.shares}
                          </span>
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无热门话题" />
          )}
        </Card>
      </Spin>
    </div>
  );
};

export default DashboardPage;