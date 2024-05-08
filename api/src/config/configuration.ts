import { LoadStrategy, MariaDbDriver } from '@mikro-orm/mariadb';

export default () => ({
  port: process.env.PORT ? +process.env.PORT : 3000,
  body_size_limit: process.env.BODY_SIZE_LIMIT || '80MB',
  database: {
    driver: MariaDbDriver,
    host: process.env.MARIADB_HOST || 'mariadb',
    port: process.env.MARIADB_PORT ? +process.env.MARIADB_PORT : 3306,
    dbName: process.env.MARIADB_DATABASE || 'ceboostupxii',
    user: process.env.MARIADB_USER || 'ceboostupxii',
    password: process.env.MARIADB_PASSWORD || 'ceboostupxii',
    name: process.env.MARIADB_NAME || 'unknown',
    charset: 'utf8mb4',
    loadStrategy: LoadStrategy.JOINED,
    autoLoadEntities: true,
    timezone: process.env.TZ || '+07:00',
    debug: process.env.MIKRO_ORM_DEBUG?.toLowerCase() === 'true', // TODO: Disable debug in production
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
    jwtSecret:
      process.env.JWT_SECRET || process.exit('JWT_SECRET is not defined'),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    mailRequestCooldown: process.env.MAIL_REQUEST_COOLDOWN || '15m',
  },
  mail: {
    mailSmtpHost: process.env.MAIL_SMTP_HOST,
    mailSmtpPort: process.env.MAIL_SMTP_PORT
      ? +process.env.MAIL_SMTP_PORT
      : 587,
    mailSmtpUser: process.env.MAIL_SMTP_USER,
    mailSmtpPassword: process.env.MAIL_SMTP_PASSWORD,
    mailFrom: process.env.MAIL_FROM,
    mailFromAddress: process.env.MAIL_FROM_ADDRESS,
  },
});
