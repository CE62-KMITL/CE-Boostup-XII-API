export default () => ({
  port: process.env.PORT ? +process.env.PORT : 3000,
  body_size_limit: process.env.BODY_SIZE_LIMIT || '80MB',
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
    smtpHost: process.env.MAIL_SMTP_HOST,
    smtpPort: process.env.MAIL_SMTP_PORT ? +process.env.MAIL_SMTP_PORT : 587,
    smtpUser: process.env.MAIL_SMTP_USER,
    smtpPassword: process.env.MAIL_SMTP_PASSWORD,
    from: process.env.MAIL_FROM,
    fromAddress: process.env.MAIL_FROM_ADDRESS,
  },
});
