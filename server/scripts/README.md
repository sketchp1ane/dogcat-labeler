# 📋 数据库管理脚本

这个目录包含了猫狗标注平台的核心数据库管理脚本。所有脚本都可以通过 `node scripts/脚本名.js` 运行。

## 🛠️ 核心脚本

### 1. 📚 `init-database.js` - 数据库初始化
**用途**：初始化数据库和创建完整的测试用户体系
- 创建所有必要的数据表
- 创建默认管理员账户 (`admin`/`admin123`)
- 创建完整的14个测试用户（1个管理员 + 3个审核员 + 10个不同技能等级标注员）
- 与项目文档中的测试账户完全一致

```bash
node scripts/init-database.js
```

### 2. 🎭 `generate-complex-data.js` - 生成测试数据
**用途**：为已创建的用户生成复杂的假数据用于测试和演示
- 为现有用户生成大量标注任务和标注记录
- 创建完整的工作流程数据（标注→审核→完成）
- 模拟60天的历史数据
- 根据用户技能等级模拟不同的表现

```bash
node scripts/generate-complex-data.js
```

### 3. 📊 `analyze-annotator-performance.js` - 性能分析
**用途**：分析标注员的工作表现和数据质量
- 标注员准确率统计
- 工作效率分析
- 审核通过率统计
- 详细的性能报告

```bash
node scripts/analyze-annotator-performance.js
```

### 4. 🔍 `check-database.js` - 数据库检查
**用途**：检查数据库状态和数据一致性
- 显示所有表的记录数量
- 列出所有用户账户
- 检查数据一致性
- 发现潜在的数据问题

```bash
node scripts/check-database.js
```

## 🚀 推荐使用顺序

### 初次设置
```bash
# 1. 初始化数据库和完整用户体系
node scripts/init-database.js

# 2. 生成测试数据
node scripts/generate-complex-data.js

# 3. 检查数据库状态
node scripts/check-database.js
```

### 日常维护
```bash
# 检查数据库状态
node scripts/check-database.js

# 分析标注员表现
node scripts/analyze-annotator-performance.js
```

## 📝 注意事项

- 所有脚本都需要正确的数据库配置 (`.env` 文件)
- `init-database.js` 会**清空并重建**整个数据库
- `generate-complex-data.js` 会添加大量测试数据
- 建议在生产环境中**谨慎使用**这些脚本

## 🔐 默认测试账户

运行 `init-database.js` 后，会创建完整的14个测试账户：

### 👑 管理员 (1个)
| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| `admin` | `admin123` | 管理员 | 完整管理权限 |

### 👨‍⚖️ 审核员 (3个)
| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| `reviewer1` | `pass123` | 审核员 | 基础审核员 |
| `reviewer_senior` | `pass123` | 审核员 | 资深审核员 |
| `reviewer_lead` | `pass123` | 审核员 | 主管审核员 |

### ✏️ 标注员 (10个，按技能等级分层)
| 用户名 | 密码 | 技能等级 | 说明 |
|--------|------|----------|------|
| `annotator_expert` | `pass123` | 专家级 | 95%准确率，速度最快 |
| `annotator_senior` | `pass123` | 高级 | 85%准确率，速度良好 |
| `annotator_pro` | `pass123` | 高级 | 专业标注员 |
| `annotator1` | `pass123` | 默认 | 原始测试账户 |
| `annotator_medium1` | `pass123` | 中级 | 75%准确率，中等速度 |
| `annotator_medium2` | `pass123` | 中级 | 中级标注员 |
| `annotator_regular` | `pass123` | 中级 | 普通标注员 |
| `annotator_junior1` | `pass123` | 新手 | 60%准确率，需要训练 |
| `annotator_junior2` | `pass123` | 新手 | 新手标注员 |
| `annotator_newbie` | `pass123` | 新手 | 初学者 |

> 💡 **密码规律**: 管理员密码为 `admin123`，其他所有用户密码统一为 `pass123`

这些用户账户与项目首页README.md和USER_ACCOUNTS.md中的文档完全一致。

---

*最后更新: 2025年6月3日* 