# 梦幻高级工具箱

一个基于 React + TypeScript 的梦幻西游游戏工具箱，包含召唤兽属性模拟器、装备计算器、灵饰分析和宝石计算器等功能。

## 🚀 快速开始

### 本地开发环境

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd mhxy-toolbox
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

4. **访问应用**
   打开浏览器访问 [http://localhost:5173](http://localhost:5173)

### 生产环境构建

1. **构建项目**
   ```bash
   npm run build
   ```

2. **预览生产版本**
   ```bash
   npm run preview
   ```

## 🐳 Docker 容器化部署

### 前置要求
- Docker 20.10 或更高版本
- Docker Compose 2.0 或更高版本（可选）

### 方法一：直接构建和运行

1. **构建镜像**
   ```bash
   docker build -t mhxy-toolbox .
   ```

2. **启动容器**
   ```bash
   docker run -d \
     --name mhxy-toolbox-app \
     -p 8080:80 \
     --restart unless-stopped \
     mhxy-toolbox
   ```

3. **访问应用**
   打开浏览器访问 [http://localhost:8080](http://localhost:8080)

### 方法二：使用 Docker Compose（推荐）

1. **创建 docker-compose.yml 文件**（可选）
   ```bash
   cat > docker-compose.yml << EOF
   version: '3.8'
   services:
     mhxy-toolbox:
       build: .
       container_name: mhxy-toolbox-app
       ports:
         - "8080:80"
       restart: unless-stopped
       environment:
         - NODE_ENV=production
   EOF
   ```

2. **启动服务**
   ```bash
   docker-compose up -d
   ```

### Docker 命令参考

- **查看容器状态**
  ```bash
  docker ps
  ```

- **查看容器日志**
  ```bash
  docker logs mhxy-toolbox-app
  ```

- **停止容器**
  ```bash
  docker stop mhxy-toolbox-app
  ```

- **删除容器**
  ```bash
  docker rm mhxy-toolbox-app
  ```

- **重新构建并启动**
  ```bash
  docker-compose up -d --build
  ```

## 📦 镜像说明

- **基础镜像**：Node.js 18 (Alpine) 用于构建，Nginx Alpine 用于部署
- **多阶段构建**：减小最终镜像大小
- **优化配置**：启用 gzip 压缩、静态资源缓存、安全头设置
- **默认端口**：80 容器内端口，映射到主机的 8080 端口

## 🔧 自定义配置

### 自定义端口映射

如果需要使用其他端口：
```bash
docker run -d -p <主机端口>:80 --name mhxy-toolbox-app mhxy-toolbox
```

例如使用 3000 端口：
```bash
docker run -d -p 3000:80 --name mhxy-toolbox-app mhxy-toolbox
```

### 挂载配置文件（可选）

如果需要自定义 Nginx 配置：
```bash
docker run -d \
  -p 8080:80 \
  -v <本地配置路径>:/etc/nginx/conf.d/custom.conf \
  --name mhxy-toolbox-app \
  mhxy-toolbox
  ```

### 环境变量

可以通过环境变量配置应用行为：
```bash
docker run -d \
  -p 8080:80 \
  -e NODE_ENV=production \
  --name mhxy-toolbox-app \
  mhxy-toolbox
```

## 🐳 高级部署

### 使用 Docker Swarm

1. **初始化 Swarm**（如果尚未初始化）
   ```bash
   docker swarm init
   ```

2. **部署服务**
   ```bash
   docker service create \
     --name mhxy-toolbox \
     --publish published=8080,target=80 \
     --replicas=3 \
     mhxy-toolbox
   ```

### 使用 Kubernetes

创建 deployment.yaml：
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mhxy-toolbox
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mhxy-toolbox
  template:
    metadata:
      labels:
        app: mhxy-toolbox
    spec:
      containers:
      - name: mhxy-toolbox
        image: mhxy-toolbox:latest
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: mhxy-toolbox-service
spec:
  selector:
    app: mhxy-toolbox
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
  type: LoadBalancer
```

部署：
```bash
kubectl apply -f deployment.yaml
```

## 🛠️ 开发说明

### 项目结构

```
mhxy-toolbox/
├── src/                 # 源代码目录（当前未使用）
├── components/          # 组件目录
├── features/            # 功能模块目录
├── index.tsx           # 主应用文件（单文件架构）
├── index.html          # HTML 模板
├── index.css           # 全局样式
├── package.json         # 项目配置
├── Dockerfile          # Docker 构建配置
├── docker-compose.yml  # Docker Compose 配置（可选）
└── README.md           # 项目说明
```

### 构建优化

项目已包含以下优化：
- **Tree-shaking**：自动移除未使用的代码
- **代码压缩**：减小最终文件大小
- **资源缓存**：通过 Nginx 配置实现静态资源缓存
- **Gzip 压缩**：减少传输文件大小

### 功能列表

- **召唤兽属性模拟器** - 精准计算召唤兽各项属性
- **召唤兽装备计算器** - 计算装备加成和性价比
- **灵饰价值分析** - 分析灵饰主副属性收益
- **宝石全景计算器** - 支持多种宝石类型的价格计算

## 📄 许可证

[MIT License](LICENSE)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**注意**：本项目仅供学习交流使用，请遵守相关游戏规定和服务条款。