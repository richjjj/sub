// HTML 模板
export function getHTML() {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>订阅管理系统</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
            background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
            color: #fff;
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        .header {
            text-align: center;
            padding: 40px 0;
        }

        .header h1 {
            font-size: 36px;
            font-weight: 700;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .header p {
            color: #a8a8b8;
            font-size: 16px;
        }

        .tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 30px;
            background: rgba(255, 255, 255, 0.05);
            padding: 10px;
            border-radius: 12px;
        }

        .tab {
            flex: 1;
            padding: 12px 24px;
            background: transparent;
            border: none;
            color: #a8a8b8;
            cursor: pointer;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 500;
            transition: all 0.3s ease;
        }

        .tab.active {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
        }

        .tab:hover:not(.active) {
            background: rgba(255, 255, 255, 0.08);
        }

        .tab-content {
            display: none;
        }

        .tab-content.active {
            display: block;
        }

        .card {
            background: rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            padding: 30px;
            margin-bottom: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .card h2 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #fff;
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            margin-bottom: 8px;
            color: #e0e0e8;
            font-weight: 500;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
            width: 100%;
            padding: 12px 16px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: #fff;
            font-size: 14px;
            transition: all 0.3s ease;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
            outline: none;
            border-color: #667eea;
            background: rgba(255, 255, 255, 0.15);
        }

        .form-group textarea {
            min-height: 120px;
            resize: vertical;
            font-family: 'Consolas', 'Monaco', monospace;
        }

        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
        }

        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.15);
        }

        .btn-danger {
            background: #e74c3c;
            color: #fff;
        }

        .btn-danger:hover {
            background: #c0392b;
        }

        .btn-group {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }

        .node-list {
            display: grid;
            gap: 15px;
        }

        .node-item {
            background: rgba(255, 255, 255, 0.05);
            padding: 20px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.3s ease;
        }

        .node-item:hover {
            background: rgba(255, 255, 255, 0.08);
            transform: translateX(5px);
        }

        .node-item-info {
            flex: 1;
        }

        .node-item-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 5px;
        }

        .node-item-desc {
            color: #a8a8b8;
            font-size: 14px;
        }

        .node-item-actions {
            display: flex;
            gap: 10px;
        }

        .checkbox-wrapper {
            display: flex;
            align-items: center;
            margin-right: 15px;
        }

        .checkbox-wrapper input[type="checkbox"] {
            width: 20px;
            height: 20px;
            margin-right: 10px;
            cursor: pointer;
        }

        .format-buttons {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }

        .format-btn {
            padding: 16px;
            background: rgba(255, 255, 255, 0.08);
            border: 2px solid rgba(255, 255, 255, 0.15);
            border-radius: 12px;
            color: #fff;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: center;
        }

        .format-btn.active {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-color: #667eea;
        }

        .format-btn:hover:not(.active) {
            background: rgba(255, 255, 255, 0.12);
        }

        .result-box {
            background: rgba(0, 0, 0, 0.3);
            padding: 20px;
            border-radius: 12px;
            margin-top: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .result-url {
            display: flex;
            gap: 10px;
            align-items: center;
            margin-bottom: 15px;
        }

        .result-url input {
            flex: 1;
            padding: 12px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: #fff;
            font-family: 'Consolas', 'Monaco', monospace;
        }

        .copy-btn {
            padding: 12px 20px;
            background: #27ae60;
            border: none;
            border-radius: 8px;
            color: #fff;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        .copy-btn:hover {
            background: #229954;
        }

        .badge {
            display: inline-block;
            padding: 4px 12px;
            background: rgba(102, 126, 234, 0.2);
            border-radius: 12px;
            font-size: 12px;
            color: #667eea;
            margin-left: 10px;
        }

        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #a8a8b8;
        }

        .empty-state-icon {
            font-size: 64px;
            margin-bottom: 20px;
            opacity: 0.5;
        }

        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }

            .header h1 {
                font-size: 28px;
            }

            .tabs {
                flex-direction: column;
            }

            .node-item {
                flex-direction: column;
                align-items: flex-start;
            }

            .node-item-actions {
                margin-top: 15px;
            }

            .format-buttons {
                grid-template-columns: 1fr;
            }
        }

        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }

        .modal.active {
            display: flex;
        }

        .modal-content {
            background: #2d2d44;
            padding: 30px;
            border-radius: 16px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        }

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .modal-close {
            background: none;
            border: none;
            color: #fff;
            font-size: 24px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 订阅管理系统</h1>
            <p>管理节点 · 生成订阅链接 · 支持多种格式</p>
        </div>

        <div class="tabs">
            <button class="tab active" onclick="switchTab('generate')">生成订阅链接</button>
            <button class="tab" onclick="switchTab('nodes')">节点管理</button>
            <button class="tab" onclick="switchTab('templates')">规则模板</button>
        </div>

        <!-- 生成订阅链接 -->
        <div id="tab-generate" class="tab-content active">
            <div class="card">
                <h2>1. 选择订阅内容</h2>
                <div id="node-selection" class="node-list">
                    <div class="empty-state">
                        <div class="empty-state-icon">📦</div>
                        <p>加载节点中...</p>
                    </div>
                </div>
            </div>

            <div class="card">
                <h2>2. 选择规则模板（可选）</h2>
                <div class="form-group">
                    <select id="template-select">
                        <option value="">默认模板</option>
                    </select>
                </div>
            </div>

            <div class="card">
                <h2>3. 选择格式</h2>
                <div class="format-buttons">
                    <button class="format-btn active" data-format="base64">通用格式<br>(Base64)</button>
                    <button class="format-btn" data-format="clash">Clash</button>
                    <button class="format-btn" data-format="singbox">Sing-Box</button>
                </div>

                <div class="btn-group">
                    <button class="btn btn-primary" onclick="generateSubscription()">生成订阅链接</button>
                </div>

                <div id="result" class="result-box" style="display: none;">
                    <h3>订阅链接：</h3>
                    <div class="result-url">
                        <input type="text" id="result-url" readonly>
                        <button class="copy-btn" onclick="copyUrl()">复制</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 节点管理 -->
        <div id="tab-nodes" class="tab-content">
            <div class="card">
                <h2>节点列表<span class="badge" id="node-count">0</span></h2>
                <button class="btn btn-primary" onclick="showAddNodeModal()">+ 添加节点</button>
                <div id="nodes-list" class="node-list" style="margin-top: 20px;">
                    <div class="empty-state">
                        <div class="empty-state-icon">📦</div>
                        <p>暂无节点</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- 规则模板 -->
        <div id="tab-templates" class="tab-content">
            <div class="card">
                <h2>规则模板<span class="badge" id="template-count">0</span></h2>
                <button class="btn btn-primary" onclick="showAddTemplateModal()">+ 添加模板</button>
                <div id="templates-list" class="node-list" style="margin-top: 20px;">
                    <div class="empty-state">
                        <div class="empty-state-icon">📋</div>
                        <p>暂无模板</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 添加节点模态框 -->
    <div id="add-node-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>添加节点</h2>
                <button class="modal-close" onclick="closeModal('add-node-modal')">&times;</button>
            </div>
            <div class="form-group">
                <label>节点名称</label>
                <input type="text" id="node-name" placeholder="例如：美国节点">
            </div>
            <div class="form-group">
                <label>节点URI（每行一个）</label>
                <textarea id="node-uris" placeholder="vless://...&#10;vmess://...&#10;hysteria2://..."></textarea>
            </div>
            <div class="btn-group">
                <button class="btn btn-primary" onclick="saveNode()">保存</button>
                <button class="btn btn-secondary" onclick="closeModal('add-node-modal')">取消</button>
            </div>
        </div>
    </div>

    <!-- 添加模板模态框 -->
    <div id="add-template-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>添加规则模板</h2>
                <button class="modal-close" onclick="closeModal('add-template-modal')">&times;</button>
            </div>
            <div class="form-group">
                <label>模板名称</label>
                <input type="text" id="template-name" placeholder="例如：全球代理规则">
            </div>
            <div class="form-group">
                <label>模板描述</label>
                <input type="text" id="template-desc" placeholder="简短描述">
            </div>
            <div class="form-group">
                <label>规则内容</label>
                <textarea id="template-content" placeholder="ruleset=🎯 全球直连,[]GEOIP,CN&#10;custom_proxy_group=..."></textarea>
            </div>
            <div class="btn-group">
                <button class="btn btn-primary" onclick="saveTemplate()">保存</button>
                <button class="btn btn-secondary" onclick="closeModal('add-template-modal')">取消</button>
            </div>
        </div>
    </div>

    <script>
        let selectedFormat = 'base64';
        let nodes = [];
        let templates = [];

        // 页面加载时初始化
        document.addEventListener('DOMContentLoaded', () => {
            loadNodes();
            loadTemplates();
            initFormatButtons();
        });

        // 切换标签页
        function switchTab(tabName) {
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            event.target.classList.add('active');
            document.getElementById('tab-' + tabName).classList.add('active');
        }

        // 初始化格式按钮
        function initFormatButtons() {
            document.querySelectorAll('.format-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    selectedFormat = btn.dataset.format;
                });
            });
        }

        // 加载节点列表
        async function loadNodes() {
            try {
                const response = await fetch('/api/nodes');
                nodes = await response.json();
                
                document.getElementById('node-count').textContent = nodes.length;
                
                // 更新生成页面的节点选择
                const selectionHtml = nodes.map(node => \`
                    <div class="node-item">
                        <div class="checkbox-wrapper">
                            <input type="checkbox" id="node-\${node.id}" value="\${node.id}">
                        </div>
                        <div class="node-item-info">
                            <div class="node-item-title">\${node.name}</div>
                            <div class="node-item-desc">\${node.nodes.length} 个节点</div>
                        </div>
                    </div>
                \`).join('');
                
                document.getElementById('node-selection').innerHTML = selectionHtml || '<div class="empty-state"><div class="empty-state-icon">📦</div><p>暂无节点，请先添加节点</p></div>';
                
                // 更新节点管理页面
                const listHtml = nodes.map(node => \`
                    <div class="node-item">
                        <div class="node-item-info">
                            <div class="node-item-title">\${node.name}</div>
                            <div class="node-item-desc">\${node.nodes.length} 个节点</div>
                        </div>
                        <div class="node-item-actions">
                            <button class="btn btn-danger" onclick="deleteNode('\${node.id}')">删除</button>
                        </div>
                    </div>
                \`).join('');
                
                document.getElementById('nodes-list').innerHTML = listHtml || '<div class="empty-state"><div class="empty-state-icon">📦</div><p>暂无节点</p></div>';
            } catch (error) {
                console.error('Failed to load nodes:', error);
            }
        }

        // 加载模板列表
        async function loadTemplates() {
            try {
                const response = await fetch('/api/templates');
                templates = await response.json();
                
                document.getElementById('template-count').textContent = templates.length;
                
                // 更新模板选择下拉框
                const selectHtml = '<option value="">默认模板</option>' + 
                    templates.map(t => \`<option value="\${t.id}">\${t.name}</option>\`).join('');
                document.getElementById('template-select').innerHTML = selectHtml;
                
                // 更新模板管理页面
                const listHtml = templates.map(template => \`
                    <div class="node-item">
                        <div class="node-item-info">
                            <div class="node-item-title">\${template.name}</div>
                            <div class="node-item-desc">\${template.description || '无描述'}</div>
                        </div>
                        <div class="node-item-actions">
                            <button class="btn btn-danger" onclick="deleteTemplate('\${template.id}')">删除</button>
                        </div>
                    </div>
                \`).join('');
                
                document.getElementById('templates-list').innerHTML = listHtml || '<div class="empty-state"><div class="empty-state-icon">📋</div><p>暂无模板</p></div>';
            } catch (error) {
                console.error('Failed to load templates:', error);
            }
        }

        // 生成订阅链接
        async function generateSubscription() {
            const selectedNodes = Array.from(document.querySelectorAll('#node-selection input[type="checkbox"]:checked'))
                .map(cb => cb.value);
            
            if (selectedNodes.length === 0) {
                alert('请至少选择一个节点');
                return;
            }

            const templateId = document.getElementById('template-select').value;

            try {
                const response = await fetch('/api/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nodeIds: selectedNodes,
                        format: selectedFormat,
                        templateId
                    })
                });

                const result = await response.json();
                const url = result.links[selectedFormat];

                document.getElementById('result-url').value = url;
                document.getElementById('result').style.display = 'block';
            } catch (error) {
                alert('生成订阅链接失败：' + error.message);
            }
        }

        // 复制链接
        function copyUrl() {
            const input = document.getElementById('result-url');
            input.select();
            document.execCommand('copy');
            
            const btn = event.target;
            const originalText = btn.textContent;
            btn.textContent = '已复制!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        }

        // 显示添加节点模态框
        function showAddNodeModal() {
            document.getElementById('add-node-modal').classList.add('active');
        }

        // 显示添加模板模态框
        function showAddTemplateModal() {
            document.getElementById('add-template-modal').classList.add('active');
        }

        // 关闭模态框
        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
        }

        // 保存节点
        async function saveNode() {
            const name = document.getElementById('node-name').value.trim();
            const uris = document.getElementById('node-uris').value.trim();

            if (!name || !uris) {
                alert('请填写完整信息');
                return;
            }

            const nodeArray = uris.split('\\n').filter(line => line.trim());

            try {
                await fetch('/api/nodes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name,
                        nodes: nodeArray
                    })
                });

                closeModal('add-node-modal');
                document.getElementById('node-name').value = '';
                document.getElementById('node-uris').value = '';
                loadNodes();
            } catch (error) {
                alert('保存失败：' + error.message);
            }
        }

        // 删除节点
        async function deleteNode(id) {
            if (!confirm('确定要删除这个节点吗？')) return;

            try {
                await fetch('/api/nodes?id=' + id, { method: 'DELETE' });
                loadNodes();
            } catch (error) {
                alert('删除失败：' + error.message);
            }
        }

        // 保存模板
        async function saveTemplate() {
            const name = document.getElementById('template-name').value.trim();
            const description = document.getElementById('template-desc').value.trim();
            const content = document.getElementById('template-content').value.trim();

            if (!name || !content) {
                alert('请填写完整信息');
                return;
            }

            try {
                await fetch('/api/templates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, description, content })
                });

                closeModal('add-template-modal');
                document.getElementById('template-name').value = '';
                document.getElementById('template-desc').value = '';
                document.getElementById('template-content').value = '';
                loadTemplates();
            } catch (error) {
                alert('保存失败：' + error.message);
            }
        }

        // 删除模板
        async function deleteTemplate(id) {
            if (!confirm('确定要删除这个模板吗？')) return;

            try {
                await fetch('/api/templates?id=' + id, { method: 'DELETE' });
                loadTemplates();
            } catch (error) {
                alert('删除失败：' + error.message);
            }
        }
    </script>
</body>
</html>`;
}

export function getLoginHTML() {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>登录 - 订阅管理系统</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
            background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
            color: #fff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .login-container {
            width: 100%;
            max-width: 420px;
        }

        .login-card {
            background: rgba(255, 255, 255, 0.08);
            border-radius: 20px;
            padding: 50px 40px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .login-header {
            text-align: center;
            margin-bottom: 40px;
        }

        .login-icon {
            font-size: 64px;
            margin-bottom: 20px;
        }

        .login-header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .login-header p {
            color: #a8a8b8;
            font-size: 14px;
        }

        .form-group {
            margin-bottom: 25px;
        }

        .form-group label {
            display: block;
            margin-bottom: 10px;
            color: #e0e0e8;
            font-weight: 500;
            font-size: 14px;
        }

        .form-group input {
            width: 100%;
            padding: 14px 18px;
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            color: #fff;
            font-size: 15px;
            transition: all 0.3s ease;
        }

        .form-group input:focus {
            outline: none;
            border-color: #667eea;
            background: rgba(255, 255, 255, 0.15);
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
        }

        .form-group input::placeholder {
            color: #888;
        }

        .login-btn {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 12px;
            color: #fff;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 10px;
        }

        .login-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        .login-btn:active {
            transform: translateY(0);
        }

        .login-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }

        .error-message {
            background: rgba(231, 76, 60, 0.15);
            border: 1px solid rgba(231, 76, 60, 0.3);
            color: #ff6b6b;
            padding: 12px 16px;
            border-radius: 10px;
            margin-bottom: 20px;
            font-size: 14px;
            display: none;
            animation: shake 0.5s;
        }

        .error-message.show {
            display: block;
        }

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
        }

        .success-message {
            background: rgba(39, 174, 96, 0.15);
            border: 1px solid rgba(39, 174, 96, 0.3);
            color: #2ecc71;
            padding: 12px 16px;
            border-radius: 10px;
            margin-bottom: 20px;
            font-size: 14px;
            display: none;
        }

        .success-message.show {
            display: block;
        }

        .footer {
            text-align: center;
            margin-top: 30px;
            color: #888;
            font-size: 13px;
        }

        .password-toggle {
            position: absolute;
            right: 18px;
            top: 50%;
            transform: translateY(-50%);
            cursor: pointer;
            color: #888;
            font-size: 20px;
            user-select: none;
        }

        .password-toggle:hover {
            color: #fff;
        }

        .input-wrapper {
            position: relative;
        }

        @media (max-width: 480px) {
            .login-card {
                padding: 40px 30px;
            }

            .login-header h1 {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="login-card">
            <div class="login-header">
                <div class="login-icon">🔐</div>
                <h1>欢迎回来</h1>
                <p>请输入密码以继续</p>
            </div>

            <div id="error-message" class="error-message"></div>
            <div id="success-message" class="success-message"></div>

            <form id="login-form">
                <div class="form-group">
                    <label for="password">访问密码</label>
                    <div class="input-wrapper">
                        <input 
                            type="password" 
                            id="password" 
                            name="password" 
                            placeholder="请输入访问密码" 
                            autocomplete="current-password"
                            required
                        >
                        <span class="password-toggle" onclick="togglePassword()">👁️</span>
                    </div>
                </div>

                <button type="submit" class="login-btn" id="login-btn">
                    登录
                </button>
            </form>

            <div class="footer">
                <p>订阅管理系统 v1.0</p>
            </div>
        </div>
    </div>

    <script>
        const loginForm = document.getElementById('login-form');
        const passwordInput = document.getElementById('password');
        const loginBtn = document.getElementById('login-btn');
        const errorMessage = document.getElementById('error-message');
        const successMessage = document.getElementById('success-message');

        // 切换密码可见性
        function togglePassword() {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
        }

        // 显示错误消息
        function showError(message) {
            errorMessage.textContent = message;
            errorMessage.classList.add('show');
            successMessage.classList.remove('show');
            
            setTimeout(() => {
                errorMessage.classList.remove('show');
            }, 5000);
        }

        // 显示成功消息
        function showSuccess(message) {
            successMessage.textContent = message;
            successMessage.classList.add('show');
            errorMessage.classList.remove('show');
        }

        // 处理登录表单提交
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const password = passwordInput.value.trim();
            
            if (!password) {
                showError('请输入密码');
                return;
            }

            // 禁用按钮
            loginBtn.disabled = true;
            loginBtn.textContent = '登录中...';

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ password })
                });

                const result = await response.json();

                if (result.success) {
                    showSuccess('登录成功，正在跳转...');
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1000);
                } else {
                    showError(result.message || '登录失败');
                    loginBtn.disabled = false;
                    loginBtn.textContent = '登录';
                    passwordInput.value = '';
                    passwordInput.focus();
                }
            } catch (error) {
                showError('网络错误，请重试');
                loginBtn.disabled = false;
                loginBtn.textContent = '登录';
            }
        });

        // 自动聚焦密码输入框
        passwordInput.focus();

        // 回车键提交
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !loginBtn.disabled) {
                loginForm.dispatchEvent(new Event('submit'));
            }
        });
    </script>
</body>
</html>`;
}
