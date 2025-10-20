-- PostgreSQL数据库初始化脚本
-- 创建内容主题助手项目所需的表结构

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    subscription_plan VARCHAR(20) DEFAULT 'free',
    subscription_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建搜索任务表
CREATE TABLE IF NOT EXISTS search_tasks (
    id SERIAL PRIMARY KEY,
    keyword VARCHAR(255) NOT NULL,
    platforms JSONB NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建分析结果表
CREATE TABLE IF NOT EXISTS analysis_results (
    id SERIAL PRIMARY KEY,
    search_task_id INTEGER REFERENCES search_tasks(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    topic_directions JSONB,
    user_concerns JSONB,
    sentiment_analysis JSONB,
    topic_suggestions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_search_tasks_user_id ON search_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_search_tasks_keyword ON search_tasks(keyword);
CREATE INDEX IF NOT EXISTS idx_search_tasks_platforms ON search_tasks USING GIN(platforms);
CREATE INDEX IF NOT EXISTS idx_analysis_results_search_task_id ON analysis_results(search_task_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_user_id ON analysis_results(user_id);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有表创建更新时间触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_search_tasks_updated_at ON search_tasks;
CREATE TRIGGER update_search_tasks_updated_at BEFORE UPDATE ON search_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_analysis_results_updated_at ON analysis_results;
CREATE TRIGGER update_analysis_results_updated_at BEFORE UPDATE ON analysis_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入示例数据
INSERT INTO users (username, email, password_hash, role) VALUES 
('admin', 'admin@example.com', '$2b$10$example_hash', 'admin'),
('demo', 'demo@example.com', '$2b$10$example_hash', 'user')
ON CONFLICT (email) DO NOTHING;

-- 创建视图以简化常用查询
-- 用户搜索任务统计视图
CREATE OR REPLACE VIEW user_search_stats AS
SELECT 
    u.id as user_id,
    u.username,
    u.email,
    COUNT(st.id) as total_searches,
    COUNT(CASE WHEN st.status = 'completed' THEN 1 END) as completed_searches,
    COUNT(CASE WHEN st.status = 'pending' THEN 1 END) as pending_searches,
    MAX(st.created_at) as last_search_date
FROM users u
LEFT JOIN search_tasks st ON u.id = st.user_id
GROUP BY u.id, u.username, u.email;

-- 用户分析结果统计视图
CREATE OR REPLACE VIEW user_analysis_stats AS
SELECT 
    u.id as user_id,
    u.username,
    u.email,
    COUNT(ar.id) as total_analyses,
    MAX(ar.created_at) as last_analysis_date
FROM users u
LEFT JOIN analysis_results ar ON u.id = ar.user_id
GROUP BY u.id, u.username, u.email;