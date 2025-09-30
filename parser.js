// @ts-nocheck

// 添加名称解码函数
function decodeNodeName(encodedName, fallback = 'Unnamed') {
    if (!encodedName) return fallback;
    
    try {
        let decoded = encodedName;
        
        // 1. 第一次 URL 解码
        try {
            const urlDecoded = decodeURIComponent(decoded);
            decoded = urlDecoded;
        } catch (e) {}
        
        // 2. 第二次 URL 解码（处理双重编码）
        try {
            const urlDecoded2 = decodeURIComponent(decoded);
            decoded = urlDecoded2;
        } catch (e) {}
        
        // 3. 如果看起来是 Base64，尝试 Base64 解码
        if (/^[A-Za-z0-9+/=]+$/.test(decoded)) {
            try {
                const base64Decoded = atob(decoded);
                const bytes = new Uint8Array(base64Decoded.length);
                for (let i = 0; i < base64Decoded.length; i++) {
                    bytes[i] = base64Decoded.charCodeAt(i);
                }
                const text = new TextDecoder('utf-8').decode(bytes);
                if (/^[\x20-\x7E\u4E00-\u9FFF]+$/.test(text)) {
                    decoded = text;
                }
            } catch (e) {}
        }
        
        // 4. 尝试 UTF-8 解码
        try {
            const utf8Decoded = decodeURIComponent(escape(decoded));
            if (utf8Decoded !== decoded) {
                decoded = utf8Decoded;
            }
        } catch (e) {}
        
        return decoded;
    } catch (e) {
        return encodedName || fallback;
    }
}

export default class Parser {
    /**
     * 解析订阅内容
     * @param {string} url - 订阅链接或短链ID
     * @param {Env} [env] - KV 环境变量
     */
    static async parse(url, env) {
        try {
            // 检查是否为内部URL格式
            if (url.startsWith('http://inner.nodes.secret/id-')) {
                const kvId = url.replace('http://inner.nodes.secret/id-', '');
                // 从KV读取节点信息
                const nodesData = await env.SUBLINK_KV.get(kvId);
                if (!nodesData) {
                    throw new Error('Nodes not found in KV storage');
                }
                
                let nodes = [];
                // 分割多行内容
                const lines = nodesData.split('\n').filter(line => line.trim());
                
                for (const line of lines) {
                    if (line.startsWith('http')) {
                        // 如果是URL，解析订阅内容
                        const subNodes = await this.parse(line, env);
                        nodes = nodes.concat(subNodes);
                    } else {
                        // 如果是节点配置，直接解析
                        const node = this.parseLine(line.trim());
                        if (node) {
                            nodes.push(node);
                        }
                    }
                }
                
                return nodes;
            }

            // 处理普通URL
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const content = await response.text();
            return this.parseContent(content, env);
        } catch (error) {
            throw error;
        }
    }

    /**
     * 解析订阅内容
     * @param {string} content 
     * @returns {Promise<Array>} 节点列表
     */
    static async parseContent(content, env) {
        try {
            if (!content) return [];

            // 尝试 Base64 解码
            let decodedContent = this.tryBase64Decode(content);
            
            // 分割成行
            const lines = decodedContent.split(/[\n\s]+/).filter(line => line.trim());

            let nodes = [];
            for (const line of lines) {
                if (this.isSubscriptionUrl(line)) {
                    // 如果是订阅链接，递归解析
                    const subNodes = await this.parse(line, env);
                    nodes = nodes.concat(subNodes);
                } else {
                    // 解析单个节点
                    const node = this.parseLine(line.trim());
                    if (node) {
                        nodes.push(node);
                    }
                }
            }

            return nodes;
        } catch (error) {
            console.error('Parse error:', error);
            return [];
        }
    }

    /**
     * 判断是否为订阅链接
     * @param {string} line 
     * @returns {boolean}
     */
    static isSubscriptionUrl(line) {
        try {
            // 1. 检查是否是 UUID 格式（跳过 UUID 格式的字符串）
            if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(line)) {
                return false;
            }

            // 2. 检查是否是有效的URL
            const url = new URL(line);
            
            // 3. 必须是 http 或 https 协议
            if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                return false;
            }

            // 4. 排除已知的节点链接协议
            const nodeProtocols = ['vmess://', 'vless://', 'trojan://', 'ss://', 'ssr://', 'hysteria://', 'hysteria2://', 'tuic://'];
            if (nodeProtocols.some(protocol => line.toLowerCase().startsWith(protocol))) {
                return false;
            }

            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * 尝试 Base64 解码
     * @param {string} content 
     * @returns {string}
     */
    static tryBase64Decode(content) {
        try {
            // 1. 检查是否看起来像 Base64
            if (!/^[A-Za-z0-9+/=]+$/.test(content.trim())) {
                return content;
            }

            // 2. 尝试 Base64 解码
            const decoded = atob(content);
            
            // 3. 验证解码结果是否包含有效的协议前缀
            const validProtocols = ['vmess://', 'vless://', 'trojan://', 'ss://', 'ssr://'];
            if (validProtocols.some(protocol => decoded.includes(protocol))) {
                return decoded;
            }

            // 4. 如果解码结果不包含有效协议，返回原内容
            return content;
        } catch {
            // 5. 如果解码失败，返回原内容
            return content;
        }
    }

    /**
     * 解析单行内容
     * @param {string} line 
     * @returns {Object|null}
     */
    static parseLine(line) {
        if (!line) return null;

        try {
            // 解析不同类型的节点
            if (line.startsWith('vmess://')) {
                return this.parseVmess(line);
            } else if (line.startsWith('vless://')) {
                return this.parseVless(line);
            } else if (line.startsWith('trojan://')) {
                return this.parseTrojan(line);
            } else if (line.startsWith('ss://')) {
                return this.parseSS(line);
            } else if (line.startsWith('ssr://')) {
                return this.parseSSR(line);
            } else if (line.startsWith('hysteria://')) {
                return this.parseHysteria(line);
            } else if (line.startsWith('hysteria2://')) {
                return this.parseHysteria2(line);
            } else if (line.startsWith('tuic://')) {
                return this.parseTuic(line);
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * 解析 VMess 节点
     * @param {string} line 
     * @returns {Object|null}
     */
    static parseVmess(line) {
        try {
            const content = line.slice(8); // 移除 "vmess://"
            // 将 URL 安全的 base64 转换为标准 base64
            const safeContent = content
                .replace(/-/g, '+')
                .replace(/_/g, '/')
                .replace(/\s+/g, '');
            
            // 添加适当的填充
            let paddedContent = safeContent;
            const mod4 = safeContent.length % 4;
            if (mod4) {
                paddedContent += '='.repeat(4 - mod4);
            }

            const config = JSON.parse(atob(paddedContent));
            return {
                type: 'vmess',
                name: decodeNodeName(config.ps || 'Unnamed'),
                server: config.add,
                port: parseInt(config.port),
                settings: {
                    id: config.id,
                    aid: parseInt(config.aid),
                    net: config.net,
                    type: config.type,
                    host: config.host,
                    path: config.path,
                    tls: config.tls,
                    sni: config.sni,
                    alpn: config.alpn
                }
            };
        } catch (error) {
            console.error('Parse VMess error:', error);
            return null;
        }
    }

    /**
     * 解析 VLESS 节点
     * @param {string} line 
     * @returns {Object|null}
     */
    static parseVless(line) {
        try {
            const url = new URL(line);
            const params = new URLSearchParams(url.search);
            return {
                type: 'vless',
                name: decodeNodeName(url.hash.slice(1)),
                server: url.hostname,
                port: parseInt(url.port),
                settings: {
                    id: url.username,
                    flow: params.get('flow') || '',
                    encryption: params.get('encryption') || 'none',
                    type: params.get('type') || 'tcp',
                    security: params.get('security') || '',
                    path: params.get('path') || '',
                    host: params.get('host') || '',
                    sni: params.get('sni') || '',
                    alpn: params.get('alpn') || '',
                    pbk: params.get('pbk') || '',
                    fp: params.get('fp') || '',
                    sid: params.get('sid') || '',
                    spx: params.get('spx') || ''
                }
            };
        } catch (error) {
            console.error('Parse VLESS error:', error);
            return null;
        }
    }

    /**
     * 解析 Trojan 节点
     * @param {string} line 
     * @returns {Object|null}
     */
    static parseTrojan(line) {
        try {
            const url = new URL(line);
            const params = new URLSearchParams(url.search);
            return {
                type: 'trojan',
                name: decodeNodeName(params.get('remarks') || '') || decodeNodeName(url.hash.slice(1)),
                server: url.hostname,
                port: parseInt(url.port),
                settings: {
                    password: url.username,
                    type: params.get('type') || 'tcp',
                    security: params.get('security') || 'tls',
                    path: params.get('path') || '',
                    host: params.get('host') || '',
                    sni: params.get('sni') || '',
                    alpn: params.get('alpn') || ''
                }
            };
        } catch (error) {
            console.error('Parse Trojan error:', error);
            return null;
        }
    }

    /**
     * 解析 Shadowsocks 节点
     * @param {string} line 
     * @returns {Object|null}
     */
    static parseSS(line) {
        try {
            const content = line.slice(5); // 移除 "ss://"
            const [userinfo, serverInfo] = content.split('@');
            const [method, password] = atob(userinfo).split(':');
            const [server, port] = serverInfo.split(':');
            return {
                type: 'ss',
                name: decodeNodeName(serverInfo || 'Unnamed'),
                server,
                port: parseInt(port),
                settings: {
                    method,
                    password
                }
            };
        } catch (error) {
            console.error('Parse Shadowsocks error:', error);
            return null;
        }
    }

    /**
     * 解析 ShadowsocksR 节点
     * @param {string} line 
     * @returns {Object|null}
     */
    static parseSSR(line) {
        try {
            const content = line.slice(6); // 移除 "ssr://"
            const decoded = this.tryBase64Decode(content);
            const [baseConfig, query] = decoded.split('/?');
            const [server, port, protocol, method, obfs, password] = baseConfig.split(':');
            const params = new URLSearchParams(query);
            return {
                type: 'ssr',
                name: decodeNodeName(params.get('remarks') || ''),
                server,
                port: parseInt(port),
                settings: {
                    protocol,
                    method,
                    obfs,
                    password: atob(password),
                    protocolParam: atob(params.get('protoparam') || ''),
                    obfsParam: atob(params.get('obfsparam') || '')
                }
            };
        } catch (error) {
            console.error('Parse ShadowsocksR error:', error);
            return null;
        }
    }

    /**
     * 解析 Hysteria 节点
     * @param {string} line 
     * @returns {Object|null}
     */
    static parseHysteria(line) {
        try {
            const url = new URL(line);
            const params = new URLSearchParams(url.search);
            return {
                type: 'hysteria',
                name: decodeNodeName(params.get('remarks') || '') || decodeNodeName(url.hash.slice(1)),
                server: url.hostname,
                port: parseInt(url.port),
                settings: {
                    auth: url.username,
                    protocol: params.get('protocol') || '',
                    up: params.get('up') || '',
                    down: params.get('down') || '',
                    alpn: params.get('alpn') || '',
                    obfs: params.get('obfs') || '',
                    sni: params.get('sni') || ''
                }
            };
        } catch (error) {
            console.error('Parse Hysteria error:', error);
            return null;
        }
    }

    /**
     * 解析 Hysteria2 节点
     * @param {string} line 
     * @returns {Object|null}
     */
    static parseHysteria2(line) {
        try {
            const url = new URL(line);
            const params = new URLSearchParams(url.search);
            return {
                type: 'hysteria2',
                name: decodeNodeName(params.get('remarks') || '') || decodeNodeName(url.hash.slice(1)),
                server: url.hostname,
                port: parseInt(url.port),
                settings: {
                    auth: url.username,
                    sni: params.get('sni') || '',
                    obfs: params.get('obfs') || '',
                    obfsParam: params.get('obfs-password') || ''
                }
            };
        } catch (error) {
            console.error('Parse Hysteria2 error:', error);
            return null;
        }
    }

    /**
     * 解析 TUIC 节点
     * @param {string} line 
     * @returns {Object|null}
     */
    static parseTuic(line) {
        try {
            const url = new URL(line);
            const params = new URLSearchParams(url.search);
            return {
                type: 'tuic',
                name: decodeNodeName(url.hash.slice(1)),
                server: url.hostname,
                port: parseInt(url.port),
                settings: {
                    uuid: url.username,
                    password: url.password,
                    congestion_control: params.get('congestion_control') || 'bbr',
                    udp_relay_mode: params.get('udp_relay_mode') || 'native',
                    alpn: (params.get('alpn') || '').split(',').filter(Boolean),
                    reduce_rtt: params.get('reduce_rtt') === '1',
                    sni: params.get('sni') || '',
                    disable_sni: params.get('disable_sni') === '1'
                }
            };
        } catch (error) {
            console.error('Parse TUIC error:', error);
            return null;
        }
    }
}