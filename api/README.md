# CE Boostup XII REST API Server
The API server is built with NestJS and MariaDB as the database. The source code is in the `api/src` folder separated into resources. The `config` folder contains code related to configuration and the `shared` folder contains shared utilitiy codes.


## Running a Development Server

### Intalling Dependencies
If this is the first time you're running the server, first install the dependencies using the command `pnpm install`.

### Starting the Server
Use the command `pnpm run start:dev` to start a development server in watch mode, the server will automatically reload when it detects a file change.

You can also use the command `pnpm run start:prod` to start a development server in production mode, this allow to test code that may behave differently in development and production mode, so far this code base does not contains code with such behavior.

After starting the server, the swagger UI will be available at `/docs`.


## Configurations

### .env
key : description (type)

\<General Section\>
  - TZ : Default timezone for javascript (string)
  - PORT : Server listening port (number)
  - MAX_BODY_SIZE : Maximum body size accepted by ExpressJS (string)
  - BODY_SIZE_LIMIT : Maximum body size accepted by Node.js in bytes (number)
  - CORS_ALLOWED_ORIGINS : Origin allowed by CORS, commas seperated, wildcard (*) matching is supported (string)
  - URL_PREFIX : URL Prefix for the application, set to empty ('') if none (string)

\<Superadmin Section\>
  - SUPER_ADMIN_EMAIL : The email that will be used to generate an initial superadmin account (string)
  - SUPER_ADMIN_PASSWORD : The password for the initial superadmin account **CHANGE THIS** (string)

\<Database Section\>
  - MARIADB_HOST : The host/address for the MariaDB DBMS (string)
  - MARIADB_PORT : The port for the MariaDB DBMS (number)
  - MARIADB_USER : The user for the MariaDB database (string)
  - MARIADB_PASSWORD : The password for the MariaDB database **CHANGE THIS** (string)
  - MARIADB_DATABASE : The database name of the MariaDB database (string)
  - MARIADB_NAME : The assigned name for the MariaDB database, intended for use in replication, replication is not implemented, as such this does basically nothing (string)

\<ORM Section\>
  - MIKRO_ORM_DEBUG : Enable/disable MikroORM debug (string: true | false)

\<Compiler Section\>
  - COMPILER_API_URL : The URL for the internal compiler service (string)
  - COMPILER_API_TIMEOUT : The timeout to be used when calling the compiler service in milliseconds (number)

\<Files Storage Section\>
  - ATTACHMENTS_STORAGE_LOCATION : The folder to use to store attachments uploaded to the server, also update the Docker volumes when changing this setting (string)
  - AVATARS_STORAGE_LOCATION : The folder to use to store avatars (profile pictures) uploaded to the server, also update Docker volumes when changing this setting (string)

\<JWT Section\>
  - JWT_EXPIRES_IN : The time that an issued JWT token will remain valid for, this effectively determine how often a user need to relog, the token is never refreshed (string)
  - JWT_SECRET : The secret used to sign JWT tokens **CHANGE THIS** (string)

\<Mail Mock Section\>
  - MAIL_MOCK_ENABLED : Enable/disable mail mock, if mail mock is enabled, any emails that would have been sent will be redirected to a Discord webhook instead (string: true | false)
  - MAIL_MOCK_DISCORD_WEBHOOK_URL : The Discord webhook URL that will be used if mail mock is enabled (string)

\<Mail Section\>
  - MAIL_REQUEST_COOLDOWN : The cooldown (wait period) before a user can request any action  that require sending email again (this include registration and password reset) (string)
  - MAIL_SMTP_HOST : The host/address for the SMTP mail server (string)
  - MAIL_SMTP_PORT : The port for the SMTP mail server (secure SMTP is enabled) (number)
  - MAIL_SMTP_USER : The user to be used for authenticating with the SMTP server (string)
  - MAIL_SMTP_PASSWORD : The password to be used for authenticating with the SMTP server  (string)
  - MAIL_FROM : The name to show as the sender on an email (string)
  - MAIL_FROM_ADDRESS : The address to send to send an email from (string)

\<Rate Limit Section\>
  - RATE_LIMIT_SHORT_WINDOW : The window size for the short rate limit in seconds (number)
  - RATE_LIMIT_SHORT_LIMIT : The amount of requests permitted per a short rate limit window (number)
  - RATE_LIMIT_LONG_WINDOW : The window size for the long rate limit in seconds (number)
  - RATE_LIMIT_LONG_LIMIT : The amount of requests permitted per a long rate limit window (number)


### Configuration File
The configuratin file is located at `api/config/config-constants.ts`. This is separate from `.env` configs because some configuration need to be known at compile time or are not intended to be changed often.

key : description (type)

\<Loggin Section\>
  - logLevels : List of log levels to be enabled, from `fatal, error, warn, log, verbose, debug` (string[])

\<User Section\>
  - user.maxEmailLength : The maximum email length in bytes for a user, must be less than 16384 (number)
  - user.minDisplayNameLength : The minimum display name length for a user, must be less than 16384 (number)
  - user.maxDisplayNameLength : The maximum display name length for a user, must be less than 16384 (number)
  - user.minPasswordLength : The minimum password length for a user (number)
  - user.maxPasswordLength : The maximum password length for a user (number)

\<Group Section\>
  - group.minNameLength : The minimum group name length, must be less than 16384 (number)
  - group.maxNameLength : The maximum group name length, must be less than 16384 (number)
  - group.maxDescriptionLength : The maximum group description length, must be less than 16384 (number)

\<Problem Tag Section\>
  - problemTag.minNameLength : The minimum problem tag name length, must be less than 16384 (number)
  - problemTag.maxNameLength : The maximum problem tag name length, must be less than 16384 (number)
  - problemTag.maxDescriptionLength : The maximum problem tag description length, must be less than 16384 (number)

\<Problem Section\>
  - problem.minNameLength : The minimum problem name length, must be less than 16384 (number)
  - problem.maxNameLength : The maximum problem name length, must be less than 16384 (number)
  - problem.maxDescriptionLength : The maximum problem description length, must be less than 16384 (number)
  - problem.maxInputLength : The maximum problem input description length, must be less than 16384 (number)
  - problem.maxOutputLength : The maximum problem output description length, must be less than 16384 (number)
  - problem.maxHintLength : The maximum problem hint length, must be less than 16384 (number)
  - problem.minTestcaseCount : The minimum problem testcases count (number)
  - problem.maxTestcaseCount : The maximum problem testcases count (number)
  - problem.minExampleTestcaseCount : The minimum problem example testcases count (number)
  - problem.maxExampleTestcaseCount : The maximum problem example testcases count (number)
  - problem.maxTestcaseInputLength : The maximum testcase input length (number)
  - problem.maxTestcaseOutputLength : The maximum testcase output length (number)
  - problem.maxStarterCodeLength : The maximum problem starter code length, must be less than 32768 (number)
  - problem.maxSolutionLength : The maximum problem solution code length, must be less than 32768 (number)
  - problem.defaultTimeLimit : The default problem time limit in seconds (number)
  - problem.maxTimeLimit : The maximum problem time limit in seconds (number)
  - problem.defaultMemoryLimit : The default problem memory limit in bytes, signed 32 bit int (number)
  - problem.maxMemoryLimit : The maximum problem memory limit in bytes, signed 32 bit int (number)
  - problem.minDifficulty : The minimum problem difficulty (number)
  - problem.maxDifficulty : The maximum problem difficulty (number)
  - problem.maxCreditsLength : The maximum problem credits length, must be less than 16384 (number)
  - problem.maxReviewCommentLength : The maximum problem review comment length, must be less than 16384 (number)

\<Save Section\>
  - save.maxCodeLength : The maximum code length that can be saved, must be less than 32768 (number)

\<Submission Section\>
  - submission.maxCodeLength : The maximum submission code length, must be less than 32768 (number)

\<Attachment Section\>
  - attachment.maxNameLength : The maximum attachment name length, must be less than 16384 (number)

\<Compiler Section\> (Compile and Run Page)
  - compiler.maxCodeLength : The maximum code length that can be submitted (number)
  - compiler.defaultTimeLimit : The default time limit for the compiler in seconds (number)
  - compiler.defaultMemoryLimit : The default memory limit for the compiler in bytes (number)
  - compiler.maxTimeLimit : The maximum time limit for the compiler in seconds (number)
  - compiler.maxMemoryLimit : The maximum memory limit for the compiler in bytes (number)

\<Executor Section\> (Compile and Run Page)
  - executor.maxInputCount: The maximum input/testcases count for the executor (number)
  - executor.maxInputSize: The maximum input size for the executor in bytes (number)
  - executor.maxOutputSize: The maximum output size for the executor in bytes (number)
  - executor.defaultTimeLimit: The default time limit for the execution of the compiled code in seconds (number)
  - executor.defaultMemoryLimit: The default memory limit for the execution of the compiled code in bytes (number)
  - executor.maxTimeLimit: The maximum time limit for the execution of the compiled code in seconds (number)
  - executor.maxMemoryLimit: The maximum memory limit for the execution of the compiled code in bytes (number)

\<Secondary Rate Limit Section\>
  - secondaryRateLimits.{route}.secondary.ttl : The window size for secondary rate limit for the route in milliseconds (number)
  - secondaryRateLimits.{route}.secondary.limit : The amount of requests permitted per a limit window (number)

Notes:
  - Length limits that have a configurable bounds are stored on the database as either `VARCHAR` or `TEXT` which both have a maximum limit of 65535 bytes. But since the validator count the length in characters and the database count the length in bytes, the limit have to be adjusted to account for UTF-8 multi-bytes encoding. There are 2 cases for this:
    1. The data is stored as `VARCHAR` : The database length limit will be set to 4x the configured limit. Which causes the upper bound of the limit configuration to be 16383.
    2. The data is stored as `TEXT` : The database length limit is fixed at 65535 bytes, this means that the configured limit should account for multi-bytes encoding. For text that are expected to contains a lot of high byte-count characters, the upper bound for the limit should be set to 16383. But for text that are not expected to contains a lot of high byte-count characters - such as source code - the upper bound can be increased. This may cause database error in some instances, but it should be rare and probably not an exploitable vulnerability.
