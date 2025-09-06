# 实施计划

- [ ] 1. 创建后端命令以将活动导出到 CSV
  - 在 [`src-tauri/src/commands/activity.rs`](src-tauri/src/commands/activity.rs) 中实现 `export_activities` 函数，接受 account_id 并返回 CSV 字符串
  - 使用现有的 `activity_service().get_activities_by_account_id` 获取按日期降序排序的活动
  - 添加实用函数使用 csv crate 将活动格式化为 CSV 行，处理 N/A 字段为 0 或空
  - 包含匹配导入 schema 的标题：id, accountId, activityDate, activityType, assetId, assetSymbol, assetName, quantity, unitPrice, amount, fee, currency, comment, isDraft
  - 添加适当错误处理，如空活动和无效账户
  - _Requirements: 1.4, 3.1, 3.2_

- [ ] 2. 在活动页面标题中添加导出按钮
  - 在 [`src/pages/activity/activity-page.tsx`](src/pages/activity/activity-page.tsx) 中添加使用 Icons.Export 的 Button，位于 Import 和 Add Manually 按钮旁边
  - 实现 onClick 处理程序，如果未过滤则显示账户选择器，或使用当前账户
  - 确保按钮可见并具有 ARIA 标签以支持可访问性
  - 定位在 absolute right-6 div 中与现有按钮一起
  - _Requirements: 1.1, 2.1, 4.5_

- [ ] 3. 实现账户选择和确认模态框
  - 重用或创建下拉列表用于活跃账户，从现有账户查询
  - 使用现有的 ui/dialog.tsx 进行确认模态框，显示账户名称和活动计数（通过查询获取计数）
  - 确认后，使用选定的 accountId 调用 export_activities 命令
  - 如果适用，默认使用当前过滤的账户
  - 在导出期间添加加载状态
  - _Requirements: 2.1, 2.2, 3.1_

- [ ] 4. 在前端实现 CSV 下载逻辑
  - 从后端接收 CSV 字符串后，使用 UTF-8 编码创建 Blob
  - 使用 URL.createObjectURL 触发浏览器下载，文件名“activities-{accountName}-{date}.csv”
  - 处理错误如下载失败或空 CSV
  - 确保与 macOS 和 Excel/Google Sheets 兼容
  - _Requirements: 3.3, 4.1_

- [ ] 5. 集成导出隐私控制
  - 将隐私状态 (isBalanceHidden) 传递到后端命令
  - 在 CSV 格式化中，如果启用隐私则将 amount, fee, unitPrice 掩码为 "****"
  - 测试切换：验证导出文件中掩码生效
  - 确保与应用中其他敏感数据相同行为
  - _Requirements: 3.5_

- [ ] 6. 处理排序和大导出
  - 确保获取的活动按 activityDate 降序排序
  - 对于大导出 (>10k)，实现进度指示器或分页警告
  - 限制为 50k 行，如果超过则警告用户
  - 使用各种大小的样本数据测试
  - _Requirements: 3.2, 3.6_

- [ ] 7. 为后端实用函数添加单元测试
  - 为 CSV 格式化编写测试，包括正常、边缘情况 (空、N/A 字段、隐私掩码)
  - 使用模拟服务测试 export_activities 命令端到端
  - 覆盖错误条件如无效账户、空活动
  - 确保所有字段正确格式化 (ISO 日期、小数)
  - _Requirements: 4.3, 4.4_

- [ ] 8. 测试前端集成和 UI 流程
  - 验证按钮触发模态框、账户选择工作
  - 测试下载触发和文件在 Excel 中无问题打开
  - 确认与导入兼容：导出的 CSV 可以重新导入
  - 测试隐私切换影响导出掩码
  - _Requirements: 1.5, 2.3, 4.2, 4.6_

- [ ] 9. 测试边缘情况和性能
  - 测试无活动：显示“无可导出数据”消息
  - 测试混合货币、草稿活动 (在评论中标记)
  - 验证 <1000 活动导出时间 <5s
  - 测试 macOS、键盘导航、ARIA
  - _Requirements: 3.4, 3.6, 4.4_