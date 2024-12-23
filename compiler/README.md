# CE Boostup XII Internal Compiler Server
The compiler server is built with NestJS and Isolate as the sandbox. The source code is in the `compiler/src` folder. The `config` folder contains code related to configuration and the rest of the code is mostly in `app.controller.ts` and `app.service.ts`, since there isn't any resources, there are no resource specific folders.


## Running a Development Server

### Intalling Dependencies
If this is the first time you're running the server, first install the dependencies using the command `pnpm install`.

### Starting the Server
Use the command `pnpm run start:dev` to start a development server in watch mode, the server will automatically reload when it detects a file change.

You can also use the command `pnpm run start:prod` to start a development server in production mode, this allow to test code that may behave differently in development and production mode, so far this code base does not contains code with such behavior.

After starting the server, the swagger UI will be available at `/api`.


## Configurations

### .env
key : description (type)
  - TEMPORARY_STORAGE_LOCATION : The folder to use to store temporary files such as compiled executables, also update the Docker volumes when changing this setting (string)
  - ISOLATE_BOX_COUNT : The amount of Isolate sandox to use, higher box counts mean more code can be executed in parallel, also update `isolate.conf` when changing this setting (number)
  - WALL_TIME_LIMIT_MULTIPLIER, WALL_TIME_LIMIT_OFFSET : The default wall clock (realtime) time limit = max(user_time_limit * multiplier, user_time_limit + offset), the reason for a wall clock time limit is to prevent sleeping programs from comsuming all the sandboxes and never releasing them since they don't use the CPU and thus never reach the normal time limit, wall time limit is higher because the program may not get to use the CPU all the time since the CPU is shared among multiple programs (number)
  - GCC_MARCH : Set GCC's -march flag to this value (string)
  - GCC_MTUNE : Set GCC's -mtune flag to this value (string)

### Configuration File
The configuratin file is located at `compiler/config/config-constants.ts`. This is separate from `.env` configs because some configuration need to be known at compile time or are not intended to be changed often.

key : description (type)

\<Loggin Section\>
  - logLevels : List of log levels to be enabled, from `fatal, error, warn, log, verbose, debug` (string[])

\<Isolate Section\>
  - isolate.boxRoot : The root directory for Isolate sandboxes (string)
  - isolate.baseCommandTimeout : The amount of time dedicated to Isolate commands in milliseconds, this will be added to wall clock timeout of a command execution and used as a timeout for the operation (number)

\<Compiler Section\>
  - compiler.maxCodeLength : The maximum code length that can be submitted (number)
  - compiler.defaultTimeLimit : The default time limit for the compiler in seconds (number)
  - compiler.defaultMemoryLimit : The default memory limit for the compiler in bytes (number)
  - compiler.maxTimeLimit : The maximum time limit for the compiler in seconds (number)
  - compiler.maxMemoryLimit : The maximum memory limit for the compiler in bytes (number)
  - compiler.maxExecutableSize: The maximum size for the compiled executable in bytes (number)

\<Executor Section\>
  - executor.maxInputCount: The maximum input/testcases count for the executor (number)
  - executor.maxInputSize: The maximum input size for the executor in bytes (number)
  - executor.maxOutputSize: The maximum output size for the executor in bytes (number)
  - executor.maxOpenFiles : The maximum number of files the executable is allowed to open, the minimum for this is 4 (stdin, stdout, stderr, libc.so.6) (number)
  - executor.defaultTimeLimit: The default time limit for the execution of the compiled code in seconds (number)
  - executor.defaultMemoryLimit: The default memory limit for the execution of the compiled code in bytes (number)
  - executor.maxTimeLimit: The maximum time limit for the execution of the compiled code in seconds (number)
  - executor.maxMemoryLimit: The maximum memory limit for the execution of the compiled code in bytes (number)
