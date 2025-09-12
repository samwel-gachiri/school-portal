module.exports = {
    apps: [
        {
            name: 'school-portal-backend',
            script: 'dist/server.js',
            instances: 'max',
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
            // Logging
            log_file: 'logs/combined.log',
            out_file: 'logs/out.log',
            error_file: 'logs/error.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

            // Auto restart
            watch: false,
            ignore_watch: ['node_modules', 'logs'],
            max_restarts: 10,
            min_uptime: '10s',

            // Memory management
            max_memory_restart: '1G',

            // Health monitoring
            health_check_grace_period: 3000,
            health_check_fatal_exceptions: true,

            // Advanced features
            source_map_support: true,
            instance_var: 'INSTANCE_ID',

            // Environment variables
            env_file: '.env',

            // Graceful shutdown
            kill_timeout: 5000,
            listen_timeout: 3000,

            // Cron restart (optional - restart daily at 2 AM)
            cron_restart: '0 2 * * *',

            // Merge logs from all instances
            merge_logs: true,

            // Auto restart on file changes (disabled for production)
            autorestart: true,
        }
    ],

    // Deployment configuration
    deploy: {
        production: {
            user: 'deploy',
            host: ['your-server-ip'],
            ref: 'origin/main',
            repo: 'https://github.com/your-username/school-portal.git',
            path: '/var/www/school-portal',
            'pre-deploy-local': '',
            'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
            'pre-setup': '',
            'ssh_options': 'ForwardAgent=yes'
        }
    }
};