# Doubao API 配置说明

## 问题说明
当前Doubao API调用失败，错误信息显示模型或端点不存在。这是因为Doubao API需要使用火山方舟的推理接入点ID，而不是简单的模型名称。

## 解决方案

### 1. 获取火山方舟推理接入点ID

1. 访问[火山引擎控制台](https://console.volcengine.com/ark)
2. 登录您的火山引擎账号
3. 在左侧导航栏中选择"推理"或"在线推理"
4. 点击"创建推理接入点"
5. 选择您想要使用的Doubao模型（如doubao-pro-4k）
6. 创建完成后，在推理接入点列表中找到您创建的接入点
7. 接入点ID格式通常为：`ep-xxxxxxxxxx-xxxxx`

### 2. 更新配置

1. 打开 `.env` 文件
2. 将 `DOUBAO_MODEL_ID` 的值更新为您的推理接入点ID
   ```
   DOUBAO_MODEL_ID=ep-20240603113425-wjggw  # 替换为您的实际接入点ID
   ```

### 3. 重启服务

更新配置后，需要重启后端服务以加载新的环境变量：
```bash
cd backend
npm run dev
```

## 注意事项

- 确保您的火山引擎账号已开通相应的Doubao模型服务
- 确保您的API密钥有访问该模型的权限
- 推理接入点ID是唯一的，请使用您自己创建的接入点ID

## 测试

配置完成后，可以运行测试脚本验证API是否正常工作：
```bash
cd backend
node test-doubao-api.js
```

## 当前状态

- ✅ DeepSeek API 已配置并测试成功
- ✅ Doubao API 已配置并测试成功

## 配置详情

1. **API密钥**: 已配置在.env文件中的DOUBAO_API_KEY
2. **推理接入点ID**: 已配置为 `ep-20251017205648-vz8xf`
3. **服务状态**: 后端服务已在端口5001上运行

## 测试结果

Doubao API测试已成功通过，返回了关于AI分类、核心技术、应用场景及现状挑战的文本内容。

## 系统行为

1. 系统现在可以使用DeepSeek和Doubao两个API进行内容分析
2. 优先使用DeepSeek API，当DeepSeek API调用失败时，会自动尝试Doubao API
3. 两个API都已正确配置并可以使用

## 注意事项

1. 请确保推理接入点ID是有效的，如果更换了推理接入点，需要更新.env文件中的DOUBAO_MODEL_ID
2. 如果API密钥过期或更换，需要更新.env文件中的DOUBAO_API_KEY
3. 更新配置后需要重启后端服务才能生效