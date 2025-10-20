import React, { useState } from 'react';
import { Card, Row, Col, Button, Input, Select, Steps, List, Space, message, Empty } from 'antd';
import { FileTextOutlined, PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Step } = Steps;

const ContentOutlinePage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('');
  const [outline, setOutline] = useState<any[]>([]);

  const categories = [
    { value: 'tech', label: '科技' },
    { value: 'business', label: '商业' },
    { value: 'education', label: '教育' },
    { value: 'entertainment', label: '娱乐' },
    { value: 'health', label: '健康' },
    { value: 'lifestyle', label: '生活方式' },
  ];

  const handleGenerateOutline = async () => {
    if (!title.trim()) {
      message.warning('请输入内容标题');
      return;
    }

    setLoading(true);
    try {
      // 这里应该调用API生成内容大纲
      // 模拟API调用
      setTimeout(() => {
        const mockOutline = [
          {
            id: 1,
            title: '引言',
            content: '介绍主题背景、意义和本文结构',
            subItems: [
              { id: 11, title: '研究背景', content: '相关领域的现状和发展' },
              { id: 12, title: '问题陈述', content: '明确要解决的核心问题' },
              { id: 13, title: '文章结构', content: '概述全文的组织结构' },
            ],
          },
          {
            id: 2,
            title: '主体部分',
            content: '详细阐述核心观点和论据',
            subItems: [
              { id: 21, title: '理论基础', content: '相关理论和概念介绍' },
              { id: 22, title: '现状分析', content: '当前情况的分析和评估' },
              { id: 23, title: '案例研究', content: '具体案例的分析和讨论' },
              { id: 24, title: '解决方案', content: '提出解决问题的方法和策略' },
            ],
          },
          {
            id: 3,
            title: '结论',
            content: '总结全文观点和展望未来',
            subItems: [
              { id: 31, title: '研究总结', content: '概括主要发现和结论' },
              { id: 32, title: '局限性分析', content: '讨论研究的不足之处' },
              { id: 33, title: '未来展望', content: '提出未来研究方向和建议' },
            ],
          },
          {
            id: 4,
            title: '参考文献',
            content: '列出引用的相关文献和资料',
            subItems: [],
          },
        ];
        setOutline(mockOutline);
        setLoading(false);
        message.success('内容大纲生成成功');
      }, 1500);
    } catch (error) {
      setLoading(false);
      message.error('生成内容大纲失败，请稍后重试');
    }
  };

  const addSubItem = (parentId: number) => {
    const newSubItem = {
      id: Date.now(),
      title: '新子项',
      content: '请编辑子项内容',
    };
    
    const updatedOutline = outline.map((item) => {
      if (item.id === parentId) {
        return {
          ...item,
          subItems: [...item.subItems, newSubItem],
        };
      }
      return item;
    });
    
    setOutline(updatedOutline);
    message.success('已添加新子项');
  };

  const deleteSubItem = (parentId: number, subItemId: number) => {
    const updatedOutline = outline.map((item) => {
      if (item.id === parentId) {
        return {
          ...item,
          subItems: item.subItems.filter((sub: any) => sub.id !== subItemId),
        };
      }
      return item;
    });
    
    setOutline(updatedOutline);
    message.success('已删除子项');
  };

  const addMainItem = () => {
    const newItem = {
      id: Date.now(),
      title: '新章节',
      content: '请编辑章节内容',
      subItems: [],
    };
    
    setOutline([...outline, newItem]);
    message.success('已添加新章节');
  };

  const deleteMainItem = (itemId: number) => {
    setOutline(outline.filter((item) => item.id !== itemId));
    message.success('已删除章节');
  };

  return (
    <div>
      <Card 
        title={
          <span>
            <FileTextOutlined style={{ marginRight: 8 }} />
            内容大纲
          </span>
        } 
        style={{ marginBottom: 24 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8 }}>内容标题</label>
              <Input
                placeholder="请输入内容标题"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8 }}>内容分类</label>
              <Select
                placeholder="选择内容分类"
                style={{ width: '100%' }}
                value={category}
                onChange={setCategory}
              >
                {categories.map((cat) => (
                  <Option key={cat.value} value={cat.value}>
                    {cat.label}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
          <Col xs={24} md={4}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8 }}>&nbsp;</label>
              <Button
                type="primary"
                loading={loading}
                onClick={handleGenerateOutline}
                style={{ width: '100%' }}
              >
                生成大纲
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      {outline.length > 0 ? (
        <Card title="大纲结构" extra={<Button type="primary" icon={<PlusOutlined />} onClick={addMainItem}>添加章节</Button>}>
          <Steps current={-1} direction="vertical" size="small">
            {outline.map((item, index) => (
              <Step
                key={item.id}
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{item.title}</span>
                    <Space>
                      <Button size="small" type="text" icon={<PlusOutlined />} onClick={() => addSubItem(item.id)} />
                      <Button size="small" type="text" icon={<DeleteOutlined />} onClick={() => deleteMainItem(item.id)} />
                    </Space>
                  </div>
                }
                description={
                  <div>
                    <p>{item.content}</p>
                    {item.subItems.length > 0 && (
                      <List
                        size="small"
                        dataSource={item.subItems}
                        renderItem={(subItem: any) => (
                          <List.Item
                            key={subItem.id}
                            actions={[
                              <Button size="small" type="text" icon={<EditOutlined />} />,
                              <Button size="small" type="text" icon={<DeleteOutlined />} onClick={() => deleteSubItem(item.id, subItem.id)} />
                            ]}
                          >
                            <List.Item.Meta
                              title={subItem.title}
                              description={subItem.content}
                            />
                          </List.Item>
                        )}
                      />
                    )}
                  </div>
                }
              />
            ))}
          </Steps>
        </Card>
      ) : (
        <Card>
          <Empty description="暂无大纲内容，请先生成大纲" />
        </Card>
      )}
    </div>
  );
};

export default ContentOutlinePage;