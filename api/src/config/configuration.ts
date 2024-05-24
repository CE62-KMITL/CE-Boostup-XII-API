// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default () => ({
  database: {
    host: process.env.MARIADB_HOST || 'mariadb',
    port: process.env.MARIADB_PORT ? +process.env.MARIADB_PORT : 3306,
    dbName: process.env.MARIADB_DATABASE || 'ceboostupxii',
    user: process.env.MARIADB_USER || 'ceboostupxii',
    password: process.env.MARIADB_PASSWORD || 'ceboostupxii',
    name: process.env.MARIADB_NAME || 'unknown',
    timezone: process.env.TZ || '+07:00',
    debug: process.env.MIKRO_ORM_DEBUG?.toLowerCase() === 'true',
  },
  api: {
    compiler: {
      url: process.env.COMPILER_API_URL || 'http://compiler:3001',
      timeout: process.env.COMPILER_API_TIMEOUT
        ? +process.env.COMPILER_API_TIMEOUT
        : 150000,
    },
  },
  storages: {
    attachments: {
      path: process.env.ATTACHMENTS_STORAGE_LOCATION || './attachments',
    },
    avatars: {
      path: process.env.AVATARS_STORAGE_LOCATION || './avatars',
    },
  },
  auth: {
    superAdminEmail: process.env.SUPER_ADMIN_EMAIL,
    superAdminPassword: process.env.SUPER_ADMIN_PASSWORD,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    mailRequestCooldown: process.env.MAIL_REQUEST_COOLDOWN || '15m',
  },
  mail: {
    mock: {
      enabled: process.env.MAIL_MOCK_ENABLED?.toLowerCase() === 'true' || false,
      discordWebhookUrl: process.env.MAIL_MOCK_DISCORD_WEBHOOK_URL,
    },
    smtpHost: process.env.MAIL_SMTP_HOST,
    smtpPort: process.env.MAIL_SMTP_PORT ? +process.env.MAIL_SMTP_PORT : 587,
    smtpUser: process.env.MAIL_SMTP_USER,
    smtpPassword: process.env.MAIL_SMTP_PASSWORD,
    from: process.env.MAIL_FROM,
    fromAddress: process.env.MAIL_FROM_ADDRESS,
  },
  rateLimit: {
    short: {
      ttl: process.env.RATE_LIMIT_SHORT_WINDOW
        ? +process.env.RATE_LIMIT_SHORT_WINDOW
        : 5,
      limit: process.env.RATE_LIMIT_SHORT_LIMIT
        ? +process.env.RATE_LIMIT_SHORT_LIMIT
        : 200,
    },
    medium: {
      ttl: process.env.RATE_LIMIT_MEDIUM_WINDOW
        ? +process.env.RATE_LIMIT_MEDIUM_WINDOW
        : 30,
      limit: process.env.RATE_LIMIT_MEDIUM_LIMIT
        ? +process.env.RATE_LIMIT_MEDIUM_LIMIT
        : 800,
    },
    long: {
      ttl: process.env.RATE_LIMIT_LONG_WINDOW
        ? +process.env.RATE_LIMIT_LONG_WINDOW
        : 300,
      limit: process.env.RATE_LIMIT_LONG_LIMIT
        ? +process.env.RATE_LIMIT_LONG_LIMIT
        : 4000,
    },
  },
});
