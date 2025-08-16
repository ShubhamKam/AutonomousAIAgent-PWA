// Tool Integration Module for Autonomous AI Agent
// Supports JIRA, Google Drive, Slack, GitHub, Notion, and more

class ToolsManager {
    constructor() {
        this.tools = new Map();
        this.credentials = new Map();
        this.initializeTools();
    }

    initializeTools() {
        // Register available tools
        this.registerTool('jira', new JIRAIntegration());
        this.registerTool('googledrive', new GoogleDriveIntegration());
        this.registerTool('slack', new SlackIntegration());
        this.registerTool('github', new GitHubIntegration());
        this.registerTool('notion', new NotionIntegration());
        this.registerTool('calendar', new GoogleCalendarIntegration());
        this.registerTool('email', new EmailIntegration());
    }

    registerTool(name, toolInstance) {
        this.tools.set(name, toolInstance);
    }

    async executeTool(toolName, action, params) {
        const tool = this.tools.get(toolName);
        if (!tool) {
            throw new Error(`Tool '${toolName}' not found`);
        }

        if (!tool.isAuthenticated()) {
            throw new Error(`Tool '${toolName}' requires authentication`);
        }

        return await tool.execute(action, params);
    }

    getAvailableTools() {
        return Array.from(this.tools.keys()).map(name => {
            const tool = this.tools.get(name);
            return {
                name,
                description: tool.getDescription(),
                actions: tool.getAvailableActions(),
                authenticated: tool.isAuthenticated()
            };
        });
    }

    async authenticateTool(toolName, credentials) {
        const tool = this.tools.get(toolName);
        if (!tool) {
            throw new Error(`Tool '${toolName}' not found`);
        }

        const result = await tool.authenticate(credentials);
        if (result.success) {
            this.credentials.set(toolName, credentials);
            localStorage.setItem(`tool_auth_${toolName}`, JSON.stringify(credentials));
        }
        return result;
    }

    loadSavedCredentials() {
        this.tools.forEach((tool, name) => {
            try {
                const savedCreds = localStorage.getItem(`tool_auth_${name}`);
                if (savedCreds) {
                    const credentials = JSON.parse(savedCreds);
                    tool.authenticate(credentials);
                    this.credentials.set(name, credentials);
                }
            } catch (error) {
                console.warn(`Failed to load credentials for ${name}:`, error);
            }
        });
    }
}

// JIRA Integration
class JIRAIntegration {
    constructor() {
        this.baseURL = '';
        this.credentials = null;
        this.authenticated = false;
    }

    getDescription() {
        return 'JIRA project management and issue tracking';
    }

    getAvailableActions() {
        return [
            'create_issue',
            'update_issue', 
            'get_issue',
            'search_issues',
            'add_comment',
            'get_projects',
            'create_sprint',
            'get_board'
        ];
    }

    async authenticate(credentials) {
        // credentials: { domain, email, apiToken }
        try {
            this.baseURL = `https://${credentials.domain}.atlassian.net`;
            this.credentials = credentials;
            
            // Test authentication
            const response = await fetch(`${this.baseURL}/rest/api/3/myself`, {
                headers: {
                    'Authorization': `Basic ${btoa(`${credentials.email}:${credentials.apiToken}`)}`,
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                this.authenticated = true;
                return { success: true, message: 'JIRA authentication successful' };
            } else {
                throw new Error('Authentication failed');
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    isAuthenticated() {
        return this.authenticated;
    }

    async execute(action, params) {
        const headers = {
            'Authorization': `Basic ${btoa(`${this.credentials.email}:${this.credentials.apiToken}`)}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        switch (action) {
            case 'create_issue':
                return await this.createIssue(params, headers);
            case 'search_issues':
                return await this.searchIssues(params, headers);
            case 'get_issue':
                return await this.getIssue(params.issueKey, headers);
            case 'add_comment':
                return await this.addComment(params, headers);
            case 'get_projects':
                return await this.getProjects(headers);
            default:
                throw new Error(`Action '${action}' not supported`);
        }
    }

    async createIssue(params, headers) {
        const issueData = {
            fields: {
                project: { key: params.projectKey },
                summary: params.summary,
                description: params.description,
                issuetype: { name: params.issueType || 'Task' },
                assignee: params.assignee ? { emailAddress: params.assignee } : null
            }
        };

        const response = await fetch(`${this.baseURL}/rest/api/3/issue`, {
            method: 'POST',
            headers,
            body: JSON.stringify(issueData)
        });

        if (response.ok) {
            const result = await response.json();
            return {
                success: true,
                issue: {
                    key: result.key,
                    id: result.id,
                    url: `${this.baseURL}/browse/${result.key}`
                }
            };
        } else {
            const error = await response.json();
            throw new Error(error.errorMessages?.[0] || 'Failed to create issue');
        }
    }

    async searchIssues(params, headers) {
        const jql = params.jql || `project = ${params.projectKey} ORDER BY created DESC`;
        const maxResults = params.maxResults || 50;

        const response = await fetch(
            `${this.baseURL}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}`,
            { headers }
        );

        if (response.ok) {
            const result = await response.json();
            return {
                success: true,
                issues: result.issues.map(issue => ({
                    key: issue.key,
                    summary: issue.fields.summary,
                    status: issue.fields.status.name,
                    assignee: issue.fields.assignee?.displayName,
                    created: issue.fields.created,
                    url: `${this.baseURL}/browse/${issue.key}`
                }))
            };
        } else {
            throw new Error('Failed to search issues');
        }
    }

    async getIssue(issueKey, headers) {
        const response = await fetch(`${this.baseURL}/rest/api/3/issue/${issueKey}`, { headers });
        
        if (response.ok) {
            const issue = await response.json();
            return {
                success: true,
                issue: {
                    key: issue.key,
                    summary: issue.fields.summary,
                    description: issue.fields.description,
                    status: issue.fields.status.name,
                    assignee: issue.fields.assignee?.displayName,
                    created: issue.fields.created,
                    updated: issue.fields.updated,
                    url: `${this.baseURL}/browse/${issue.key}`
                }
            };
        } else {
            throw new Error('Failed to get issue');
        }
    }

    async addComment(params, headers) {
        const commentData = {
            body: {
                type: 'doc',
                version: 1,
                content: [{
                    type: 'paragraph',
                    content: [{ type: 'text', text: params.comment }]
                }]
            }
        };

        const response = await fetch(`${this.baseURL}/rest/api/3/issue/${params.issueKey}/comment`, {
            method: 'POST',
            headers,
            body: JSON.stringify(commentData)
        });

        if (response.ok) {
            return { success: true, message: 'Comment added successfully' };
        } else {
            throw new Error('Failed to add comment');
        }
    }

    async getProjects(headers) {
        const response = await fetch(`${this.baseURL}/rest/api/3/project`, { headers });
        
        if (response.ok) {
            const projects = await response.json();
            return {
                success: true,
                projects: projects.map(project => ({
                    key: project.key,
                    name: project.name,
                    type: project.projectTypeKey,
                    lead: project.lead?.displayName
                }))
            };
        } else {
            throw new Error('Failed to get projects');
        }
    }
}

// Google Drive Integration
class GoogleDriveIntegration {
    constructor() {
        this.accessToken = null;
        this.authenticated = false;
    }

    getDescription() {
        return 'Google Drive file management and collaboration';
    }

    getAvailableActions() {
        return [
            'list_files',
            'upload_file',
            'download_file',
            'create_folder',
            'share_file',
            'search_files',
            'get_file_metadata',
            'delete_file'
        ];
    }

    async authenticate(credentials) {
        // For OAuth2, this would handle the OAuth flow
        // For simplicity, assuming access token is provided
        try {
            this.accessToken = credentials.accessToken;
            
            // Test authentication
            const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (response.ok) {
                this.authenticated = true;
                return { success: true, message: 'Google Drive authentication successful' };
            } else {
                throw new Error('Authentication failed');
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    isAuthenticated() {
        return this.authenticated;
    }

    async execute(action, params) {
        const headers = {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
        };

        switch (action) {
            case 'list_files':
                return await this.listFiles(params, headers);
            case 'upload_file':
                return await this.uploadFile(params, headers);
            case 'create_folder':
                return await this.createFolder(params, headers);
            case 'search_files':
                return await this.searchFiles(params, headers);
            case 'share_file':
                return await this.shareFile(params, headers);
            default:
                throw new Error(`Action '${action}' not supported`);
        }
    }

    async listFiles(params, headers) {
        const pageSize = params.pageSize || 100;
        const query = params.query || '';
        
        let url = `https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&fields=files(id,name,mimeType,size,createdTime,modifiedTime)`;
        if (query) {
            url += `&q=${encodeURIComponent(query)}`;
        }

        const response = await fetch(url, { headers });
        
        if (response.ok) {
            const result = await response.json();
            return {
                success: true,
                files: result.files.map(file => ({
                    id: file.id,
                    name: file.name,
                    type: file.mimeType,
                    size: file.size,
                    created: file.createdTime,
                    modified: file.modifiedTime,
                    url: `https://drive.google.com/file/d/${file.id}/view`
                }))
            };
        } else {
            throw new Error('Failed to list files');
        }
    }

    async createFolder(params, headers) {
        const folderData = {
            name: params.name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: params.parentId ? [params.parentId] : undefined
        };

        const response = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers,
            body: JSON.stringify(folderData)
        });

        if (response.ok) {
            const folder = await response.json();
            return {
                success: true,
                folder: {
                    id: folder.id,
                    name: folder.name,
                    url: `https://drive.google.com/drive/folders/${folder.id}`
                }
            };
        } else {
            throw new Error('Failed to create folder');
        }
    }

    async shareFile(params, headers) {
        const permissionData = {
            role: params.role || 'reader', // reader, writer, commenter
            type: params.type || 'user', // user, group, domain, anyone
            emailAddress: params.email
        };

        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${params.fileId}/permissions`, {
            method: 'POST',
            headers,
            body: JSON.stringify(permissionData)
        });

        if (response.ok) {
            return { success: true, message: 'File shared successfully' };
        } else {
            throw new Error('Failed to share file');
        }
    }

    async searchFiles(params, headers) {
        const query = params.query || `name contains '${params.searchTerm}'`;
        return await this.listFiles({ query }, headers);
    }
}

// Slack Integration
class SlackIntegration {
    constructor() {
        this.botToken = null;
        this.authenticated = false;
    }

    getDescription() {
        return 'Slack messaging and team collaboration';
    }

    getAvailableActions() {
        return [
            'send_message',
            'get_channels',
            'get_users',
            'create_channel',
            'upload_file',
            'get_conversations'
        ];
    }

    async authenticate(credentials) {
        try {
            this.botToken = credentials.botToken;
            
            // Test authentication
            const response = await fetch('https://slack.com/api/auth.test', {
                headers: {
                    'Authorization': `Bearer ${this.botToken}`
                }
            });

            const result = await response.json();
            
            if (result.ok) {
                this.authenticated = true;
                return { success: true, message: 'Slack authentication successful' };
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    isAuthenticated() {
        return this.authenticated;
    }

    async execute(action, params) {
        const headers = {
            'Authorization': `Bearer ${this.botToken}`,
            'Content-Type': 'application/json'
        };

        switch (action) {
            case 'send_message':
                return await this.sendMessage(params, headers);
            case 'get_channels':
                return await this.getChannels(headers);
            case 'get_users':
                return await this.getUsers(headers);
            default:
                throw new Error(`Action '${action}' not supported`);
        }
    }

    async sendMessage(params, headers) {
        const messageData = {
            channel: params.channel,
            text: params.text,
            username: params.username || 'Autonomous AI Agent',
            icon_emoji: params.icon || ':robot_face:'
        };

        const response = await fetch('https://slack.com/api/chat.postMessage', {
            method: 'POST',
            headers,
            body: JSON.stringify(messageData)
        });

        const result = await response.json();
        
        if (result.ok) {
            return { success: true, message: 'Message sent successfully' };
        } else {
            throw new Error(result.error);
        }
    }

    async getChannels(headers) {
        const response = await fetch('https://slack.com/api/conversations.list', { headers });
        const result = await response.json();
        
        if (result.ok) {
            return {
                success: true,
                channels: result.channels.map(channel => ({
                    id: channel.id,
                    name: channel.name,
                    private: channel.is_private,
                    memberCount: channel.num_members
                }))
            };
        } else {
            throw new Error(result.error);
        }
    }

    async getUsers(headers) {
        const response = await fetch('https://slack.com/api/users.list', { headers });
        const result = await response.json();
        
        if (result.ok) {
            return {
                success: true,
                users: result.members.map(user => ({
                    id: user.id,
                    name: user.name,
                    realName: user.real_name,
                    email: user.profile?.email,
                    active: !user.deleted
                }))
            };
        } else {
            throw new Error(result.error);
        }
    }
}

// GitHub Integration
class GitHubIntegration {
    constructor() {
        this.token = null;
        this.authenticated = false;
    }

    getDescription() {
        return 'GitHub repository and project management';
    }

    getAvailableActions() {
        return [
            'create_issue',
            'get_repositories',
            'create_pull_request',
            'get_commits',
            'create_repository',
            'search_code'
        ];
    }

    async authenticate(credentials) {
        try {
            this.token = credentials.token;
            
            // Test authentication
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.ok) {
                this.authenticated = true;
                return { success: true, message: 'GitHub authentication successful' };
            } else {
                throw new Error('Authentication failed');
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    isAuthenticated() {
        return this.authenticated;
    }

    async execute(action, params) {
        const headers = {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };

        switch (action) {
            case 'create_issue':
                return await this.createIssue(params, headers);
            case 'get_repositories':
                return await this.getRepositories(headers);
            case 'get_commits':
                return await this.getCommits(params, headers);
            default:
                throw new Error(`Action '${action}' not supported`);
        }
    }

    async createIssue(params, headers) {
        const issueData = {
            title: params.title,
            body: params.description,
            labels: params.labels || [],
            assignees: params.assignees || []
        };

        const response = await fetch(`https://api.github.com/repos/${params.owner}/${params.repo}/issues`, {
            method: 'POST',
            headers,
            body: JSON.stringify(issueData)
        });

        if (response.ok) {
            const issue = await response.json();
            return {
                success: true,
                issue: {
                    number: issue.number,
                    title: issue.title,
                    url: issue.html_url,
                    state: issue.state
                }
            };
        } else {
            throw new Error('Failed to create issue');
        }
    }

    async getRepositories(headers) {
        const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=50', { headers });
        
        if (response.ok) {
            const repos = await response.json();
            return {
                success: true,
                repositories: repos.map(repo => ({
                    name: repo.name,
                    fullName: repo.full_name,
                    private: repo.private,
                    url: repo.html_url,
                    language: repo.language,
                    stars: repo.stargazers_count,
                    updated: repo.updated_at
                }))
            };
        } else {
            throw new Error('Failed to get repositories');
        }
    }

    async getCommits(params, headers) {
        const response = await fetch(
            `https://api.github.com/repos/${params.owner}/${params.repo}/commits?per_page=10`,
            { headers }
        );
        
        if (response.ok) {
            const commits = await response.json();
            return {
                success: true,
                commits: commits.map(commit => ({
                    sha: commit.sha,
                    message: commit.commit.message,
                    author: commit.commit.author.name,
                    date: commit.commit.author.date,
                    url: commit.html_url
                }))
            };
        } else {
            throw new Error('Failed to get commits');
        }
    }
}

// Placeholder classes for other integrations
class NotionIntegration {
    getDescription() { return 'Notion workspace and database management'; }
    getAvailableActions() { return ['create_page', 'query_database', 'update_page']; }
    async authenticate(credentials) { return { success: false, error: 'Not implemented yet' }; }
    isAuthenticated() { return false; }
    async execute(action, params) { throw new Error('Not implemented yet'); }
}

class GoogleCalendarIntegration {
    getDescription() { return 'Google Calendar event management'; }
    getAvailableActions() { return ['create_event', 'list_events', 'update_event']; }
    async authenticate(credentials) { return { success: false, error: 'Not implemented yet' }; }
    isAuthenticated() { return false; }
    async execute(action, params) { throw new Error('Not implemented yet'); }
}

class EmailIntegration {
    getDescription() { return 'Email sending and management'; }
    getAvailableActions() { return ['send_email', 'get_emails', 'create_draft']; }
    async authenticate(credentials) { return { success: false, error: 'Not implemented yet' }; }
    isAuthenticated() { return false; }
    async execute(action, params) { throw new Error('Not implemented yet'); }
}

// Export for use in the main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ToolsManager };
} else {
    window.ToolsManager = ToolsManager;
}