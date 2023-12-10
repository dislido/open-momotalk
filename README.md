# open-momotalk
momotalk!
__本项目是从dislido.cn独立出来的项目,目前没有进行过独立部署测试,可能遗漏某些东西导致无法成功部署__

## 部署
需要准备:
- 阿里云OSS
  - 在bucket的 数据安全-跨域设置 中添加跨域规则:
    ```
    来源:
      *
    允许 Methods:
      GET POST HEAD
    允许 Headers:
      *
    暴露 Headers:
      x-oss-meta-thumbnail
      x-oss-request-id
      ETag
    ```
- 数据库, 默认使用mysql, 可以根据需要改用其他数据库
- 服务器参考配置:
  - CPU&内存 1核(vCPU) 2 GiB (如果你不在服务器上编译可以用1G内存)
  - Alibaba Cloud Linux 3.2104 LTS 64位

### 项目配置
在项目中全局搜索`@init`,安装提示信息进行配置

### 本地开发
`npm run dev`

### 初次启动
初始化数据库 `npx prisma migrate dev --name init`

### 在服务器上部署
```bash
git clone git@github.com:dislido/open-momotalk.git
cd open-momotalk
npm i
npm run deploy
```

### 更新并重启
```bash
cd open-momotalk
git pull
npm run restart
```

### 其他问题
- 本地开发页面报momotalk.webmanifest 404: 执行`npm run build&&npm run clean`

## 使用
### 如何建群
因为权限系统没完成,目前没在页面中添加此功能, 可以`npx prisma studio` 直接在数据库里添加,
或者使用`server/services/momotalk/group.ts`中的`createGroup`自行实现

## 兼容性
Chrome/Edge>=112
Safari>=17
Firefox>=117
