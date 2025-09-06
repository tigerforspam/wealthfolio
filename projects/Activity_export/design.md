# 技术设计文档

## 概述

此功能在活动页面添加“导出到 CSV”按钮，允许用户选择特定账户的活动数据并导出为标准 CSV 格式。实现将基于现有架构，使用后端命令查询活动数据、生成 CSV 字符串，前端触发下载。计算将考虑当前上下文（单一账户视图），并与现有导入流程保持兼容性，确保数据对称性。

## 架构

### 数据流
1. **活动数据**：使用现有的 `search_activities` 或 `get_activities_by_account_id` 从 `ActivityService` 获取活动数据，按日期降序排序。
2. **CSV 生成**：在后端使用 Rust 的 `csv` crate 将活动转换为 CSV 字符串，包含完整 schema 字段。
3. **百分比计算**：不适用（无百分比），但确保字段处理（如 N/A 设为 0 或空）。
4. **显示**：前端接收 CSV 字符串，创建 Blob 并触发下载，文件名如“activities-{accountName}-{date}.csv”。

### 上下文感知
- **单一账户视图**：默认使用当前过滤的账户 ID 计算导出；如果未过滤，显示账户选择器。
- **隐私模式**：集成现有 `privacy-context.tsx`，在导出中掩码金额字段（例如，替换为“****”）。
- **货币切换**：CSV 使用原始货币值，不受显示切换影响。

## 组件和接口

### 修改的组件

#### ActivityPage 组件
- **位置**：[`src/pages/activity/activity-page.tsx`](src/pages/activity/activity-page.tsx)
- **更改**：在标题中添加导出按钮，使用 `<Button>` 和 `Icons.Export`。
- **Props**：无现有 props 接口更改。

#### 导出按钮和确认模态框
```typescript
// 在 ApplicationHeader 中的 div 添加
<Button size="sm" title="Export" onClick={handleExport}>
  <Icons.Export className="mr-2 h-4 w-4" />
  Export to CSV
</Button>

// 新函数 handleExport
const handleExport = useCallback(async () => {
  // 显示账户选择器或使用当前过滤
  // 显示确认模态框，显示活动计数
  // 调用后端命令 exportActivities(accountId)
  // 创建 Blob 下载
}, []);
```

### 新实用函数

#### exportActivities 后端命令
```rust
#[tauri::command]
pub async fn export_activities(
    account_id: String,
    state: State<'_, Arc<ServiceContext>>,
) -> Result<String, String> {
    // 使用 activity_service.get_activities_by_account_id
    // 格式化为 CSV 使用 csv::Writer
    // 处理隐私掩码
    // 返回 CSV 字符串
}
```

#### formatActivityToCsvRow
```rust
fn format_activity_to_csv_row(activity: &ActivityDetails, is_privacy_enabled: bool) -> Vec<String> {
    // 映射字段：id, accountId, activityDate (ISO), 等
    // 如果隐私启用，掩码 amount, fee 等为 "****"
    // N/A 字段设为 "" 或 "0"
}
```

#### createCsvFromActivities
```rust
fn create_csv_from_activities(activities: Vec<ActivityDetails>, is_privacy_enabled: bool) -> String {
    let mut wtr = csv::Writer::from_writer(vec![]);
    // 写入标题
    // 写入行
    String::from_utf8(wtr.into_inner().unwrap()).unwrap()
}
```

## 数据模型

### 现有类型使用
- **ActivityDetails**：包含所有所需字段如 id, accountId, activityDate, activityType, assetId, assetSymbol, assetName, quantity, unitPrice, amount, fee, currency, comment, isDraft。
- **Account**：用于确定账户上下文和名称。

### 无需新类型
实现利用现有数据结构，无需新类型定义。

## 错误处理

### 边缘情况
1. **零活动**：当账户无活动时，返回空 CSV 或显示消息“无可导出数据”。
2. **空/未定义值**：处理缺失字段，将 N/A 设为 0 或空字符串。
3. **大导出**：超过 50k 行警告用户，使用异步进度指示器。
4. **无效账户**：如果 accountId 不存在，抛出错误。

### 错误场景
```rust
// 处理空活动
if activities.is_empty() {
    return Err("No activities to export".to_string());
}

// 处理大导出
if activities.len() > 50000 {
    // 返回警告或部分导出
}

// 前端 Blob 创建错误
if (!csvContent) {
  // 显示错误模态框
}
```

## 测试策略

### 单元测试
1. **CSV 生成**：测试 `create_csv_from_activities` 与各种输入。
   - 正常活动值
   - 零活动
   - 混合类型（BUY, DEPOSIT 等）
   - 缺失值处理
2. **格式化**：测试 `formatActivityToCsvRow` 函数。
   - 标准字段（日期 ISO，数字格式）
   - 边缘情况（空字符串，0 值）
   - 隐私掩码
3. **命令**：测试 `export_activities` 端到端。

### 集成测试
1. **列渲染**：验证命令返回正确 CSV，导入兼容。
2. **排序**：确保按日期降序。
3. **隐私模式**：验证导出中敏感字段掩码。
4. **账户切换**：测试不同账户导出。
5. **下载**：确认 Blob 下载触发。

### 视觉测试
1. **按钮对齐**：验证导出按钮与导入/添加按钮对齐。
2. **响应式设计**：测试不同屏幕大小的模态框。
3. **列切换**：不适用，但验证 UI 流畅。

## 实施方法

### 阶段 1: 核心后端逻辑
1. 在 `src-tauri/src/commands/activity.rs` 实现 `export_activities` 命令。
2. 添加 CSV 实用函数使用 `csv` crate。
3. 集成活动服务查询，按账户过滤和排序。

### 阶段 2: 前端集成
1. 在 `activity-page.tsx` 添加导出按钮和处理函数。
2. 实现账户选择和确认模态框，使用现有 `ui/dialog.tsx`。
3. 集成下载逻辑，使用 Blob 和 URL.createObjectURL。

### 阶段 3: 上下文感知
1. 传递隐私状态到后端命令。
2. 确保导出尊重当前过滤。
3. 测试单一账户 vs. 选择。

### 阶段 4: 隐私和可访问性
1. 集成现有隐私控件。
2. 添加 ARIA 标签和键盘导航。
3. 测试屏幕阅读器。

## 性能考虑

### 计算效率
- 后端查询使用现有分页，如果 >10k 使用流式 CSV 生成。
- 前端使用 useMemo 缓存活动计数。
- 避免不必要重新查询。

### 内存使用
- 无额外数据存储。
- 大 CSV 在后端流式处理。
- 利用现有数据结构。

## 安全考虑

### 隐私集成
- 尊重现有 `isBalanceHidden` 隐私设置。
- 在导出中应用相同掩码用于金额/费用。
- 无额外敏感数据暴露。

### 数据验证
- 验证账户 ID 存在。
- 处理边缘情况优雅。
- 防止注入通过转义 CSV 值。

## 功能规范

### UI/UX 流程
导出按钮触发账户选择（如果未过滤）。确认模态框显示预览计数。后端获取活动，生成 CSV，前端触发下载。

#### Mermaid 图：导出流程
```mermaid
sequenceDiagram
    participant U as 用户
    participant F as 前端 (React)
    participant B as 后端 (Tauri/Rust)
    participant D as 下载
    U->>F: 点击 "导出到 CSV" 按钮
    F->>F: 显示账户选择器 (下拉)
    U->>F: 选择账户
    F->>F: 显示确认模态框 (例如，"导出 150 活动?")
    U->>F: 确认
    F->>B: 调用命令: exportActivities(accountId)
    B->>B: 查询 DB 活动 (账户所有)
    B->>B: 格式化为 CSV (完整 schema)
    B->>F: 返回 CSV 字符串/base64
    F->>D: 触发下载 (filename.csv)
    D->>U: 文件保存
    Note over U,B: 处理错误: 例如，空数据，大导出进度