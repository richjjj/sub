import { handleClashRequest } from './clash.js';
import { handleSingboxRequest } from './singbox.js';
import { handleConvertRequest } from './base.js';
import { getHTML, getLoginHTML } from './html.js';

// 密码保护配置
const AUTH_COOKIE_NAME = 'sub_auth_token';
const AUTH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7天

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;

        // 登录页面（不需要验证）
        if (path === '/login') {
            return new Response(getLoginHTML(), {
                headers: { 'Content-Type': 'text/html;charset=UTF-8' }
            });
        }

        // 登录 API（不需要验证）
        if (path === '/api/login' && request.method === 'POST') {
            return handleLogin(request, env);
        }

        // 登出 API
        if (path === '/api/logout' && request.method === 'POST') {
            return handleLogout(request);
        }

        // 订阅转换路由（不需要密码，因为是公开分享的链接）
        if (path === '/clash') {
            return handleClashRequest(request, env);
        }

        if (path === '/singbox') {
            return handleSingboxRequest(request, env);
        }

        if (path === '/base64') {
            return handleConvertRequest(request, env);
        }

        // 其他所有路由都需要验证
        const authResult = await verifyAuth(request, env);
        if (!authResult.authorized) {
            return Response.redirect(new URL('/login', request.url).toString(), 302);
        }

        // 处理主页
        if (path === '/' || path === '/index.html') {
            return new Response(getHTML(), {
                headers: { 'Content-Type': 'text/html;charset=UTF-8' }
            });
        }

        // API路由
        if (path === '/api/nodes') {
            return handleNodesAPI(request, env);
        }

        if (path === '/api/templates') {
            return handleTemplatesAPI(request, env);
        }

        if (path.startsWith('/api/templates/')) {
            return handleTemplateDetailAPI(request, env);
        }

        if (path === '/api/subscribe') {
            return handleSubscribeAPI(request, env);
        }

        return new Response('Not Found', { status: 404 });
    }
};

// 默认密码（如果没有配置环境变量）
const DEFAULT_PASSWORD = 'admin123456';

// 获取有效密码
function getPassword(env) {
    return env.ACCESS_PASSWORD || DEFAULT_PASSWORD;
}

// 验证密码
async function verifyAuth(request, env) {
    const password = getPassword(env);

    // 检查 Cookie
    const cookieHeader = request.headers.get('Cookie');
    if (cookieHeader) {
        const cookies = parseCookies(cookieHeader);
        const token = cookies[AUTH_COOKIE_NAME];

        if (token) {
            try {
                const tokenData = JSON.parse(atob(token));
                const now = Date.now();

                // 检查 token 是否过期
                if (tokenData.expires > now && tokenData.password === password) {
                    return { authorized: true };
                }
            } catch (e) {
                // Token 无效
            }
        }
    }

    return { authorized: false };
}

// 处理登录
async function handleLogin(request, env) {
    try {
        const body = await request.json();
        const inputPassword = body.password;
        const correctPassword = getPassword(env);

        if (inputPassword === correctPassword) {
            // 生成 token
            const tokenData = {
                password: correctPassword,
                expires: Date.now() + AUTH_TOKEN_EXPIRY
            };
            const token = btoa(JSON.stringify(tokenData));

            return new Response(JSON.stringify({ success: true, message: '登录成功' }), {
                headers: {
                    'Content-Type': 'application/json',
                    'Set-Cookie': `${AUTH_COOKIE_NAME}=${token}; Path=/; Max-Age=${AUTH_TOKEN_EXPIRY / 1000}; HttpOnly; Secure; SameSite=Strict`
                }
            });
        } else {
            return new Response(JSON.stringify({ success: false, message: '密码错误' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: '请求错误' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 处理登出
function handleLogout(request) {
    return new Response(JSON.stringify({ success: true }), {
        headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`
        }
    });
}

// 解析 Cookie
function parseCookies(cookieHeader) {
    const cookies = {};
    cookieHeader.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
            cookies[name] = value;
        }
    });
    return cookies;
}

// 处理节点管理API
async function handleNodesAPI(request, env) {
    const method = request.method;

    // 获取所有节点列表
    if (method === 'GET') {
        const list = await env.SUBLINK_KV.list({ prefix: 'nodes-' });
        const nodes = await Promise.all(
            list.keys.map(async (key) => {
                const data = await env.SUBLINK_KV.get(key.name);
                return {
                    id: key.name.replace('nodes-', ''),
                    ...JSON.parse(data)
                };
            })
        );
        return jsonResponse(nodes);
    }

    // 创建新节点集合
    if (method === 'POST') {
        const body = await request.json();
        const id = generateId();
        const nodeData = {
            name: body.name,
            nodes: body.nodes, // 节点URI数组
            createdAt: Date.now()
        };
        await env.SUBLINK_KV.put(`nodes-${id}`, JSON.stringify(nodeData));
        return jsonResponse({ id, ...nodeData });
    }

    // 更新节点集合
    if (method === 'PUT') {
        const body = await request.json();
        const id = body.id;
        const nodeData = {
            name: body.name,
            nodes: body.nodes,
            updatedAt: Date.now()
        };
        await env.SUBLINK_KV.put(`nodes-${id}`, JSON.stringify(nodeData));
        return jsonResponse({ id, ...nodeData });
    }

    // 删除节点集合
    if (method === 'DELETE') {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        await env.SUBLINK_KV.delete(`nodes-${id}`);
        return jsonResponse({ success: true });
    }

    return new Response('Method not allowed', { status: 405 });
}

// 处理规则模板API
async function handleTemplatesAPI(request, env) {
    const method = request.method;

    // 获取所有模板
    if (method === 'GET') {
        const list = await env.TEMPLATE_CONFIG.list({ prefix: 'template-' });
        const templates = await Promise.all(
            list.keys.map(async (key) => {
                const data = await env.TEMPLATE_CONFIG.get(key.name);
                const parsed = JSON.parse(data);
                return {
                    id: key.name.replace('template-', ''),
                    name: parsed.name,
                    description: parsed.description,
                    createdAt: parsed.createdAt
                };
            })
        );
        return jsonResponse(templates);
    }

    // 创建新模板
    if (method === 'POST') {
        const body = await request.json();
        const id = generateId();
        const templateData = {
            name: body.name,
            description: body.description,
            createdAt: Date.now()
        };

        // 支持保存 URL 或内容
        if (body.url) {
            templateData.url = body.url;
        } else if (body.content) {
            templateData.content = body.content;
        }

        await env.TEMPLATE_CONFIG.put(`template-${id}`, JSON.stringify(templateData));
        return jsonResponse({ id, ...templateData });
    }

    // 删除模板
    if (method === 'DELETE') {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        await env.TEMPLATE_CONFIG.delete(`template-${id}`);
        return jsonResponse({ success: true });
    }

    return new Response('Method not allowed', { status: 405 });
}

// 处理单个模板详情API
async function handleTemplateDetailAPI(request, env) {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    try {
        const data = await env.TEMPLATE_CONFIG.get(`template-${id}`);
        if (!data) {
            return new Response('Template not found', { status: 404 });
        }

        const template = JSON.parse(data);
        return jsonResponse({ id, ...template });
    } catch (error) {
        return new Response('Error fetching template', { status: 500 });
    }
}

// 处理订阅生成API
async function handleSubscribeAPI(request, env) {
    const body = await request.json();
    const { nodeIds, format, templateId } = body;

    // 收集所有选中的节点
    let allNodes = [];
    for (const id of nodeIds) {
        const data = await env.SUBLINK_KV.get(`nodes-${id}`);
        if (data) {
            const nodeData = JSON.parse(data);
            allNodes = allNodes.concat(nodeData.nodes);
        }
    }

    // 生成内部URL
    const internalId = generateId();
    await env.SUBLINK_KV.put(internalId, allNodes.join('\n'));

    const baseUrl = new URL(request.url).origin;
    const nodeUrl = `http://inner.nodes.secret/id-${internalId}`;

    let templateUrl = '';
    if (templateId) {
        templateUrl = `https://inner.template.secret/id-template-${templateId}`;
    }

    // 生成订阅链接
    const links = {
        base64: `${baseUrl}/base64?url=${encodeURIComponent(nodeUrl)}`,
        clash: `${baseUrl}/clash?url=${encodeURIComponent(nodeUrl)}${templateUrl ? '&template=' + encodeURIComponent(templateUrl) : ''}`,
        singbox: `${baseUrl}/singbox?url=${encodeURIComponent(nodeUrl)}${templateUrl ? '&template=' + encodeURIComponent(templateUrl) : ''}`
    };

    return jsonResponse({ links });
}

function jsonResponse(data) {
    return new Response(JSON.stringify(data), {
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
}

function generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
