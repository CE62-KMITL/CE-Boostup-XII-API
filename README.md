# CE Boostup XII Backend

## API

The `api` folder contains the main REST API server, this is the server that will be communicating with the frontend, the database and the compiler.

## Compiler

The `compiler` folder contains the internal compiler and executer service, this is an internal service the the main API server will use to compile and run any user-submitted code.

## Deployment

### Configuration
There are 2 required configuration files: `api/.env` and `compiler/.env` both file have a `.env.example` counterpart for example configuration. You need to add those 2 configuration files first before proceeding with the deployment. More configuration details can be found in the `README.md` file in both the `api` and `compiler` folder.

You may also want to change the resource limits for the compiler service in `docker-compose.yaml` and the database buffer pool size in `api/mariadb.cnf` if your machine have less than 8GB of RAM.

### Running with docker compose
Simply run `docker compose up -d --build` to start the application. Docker compose may raise an error about orphan containers, this is due to this and the frontend compose having the same name, this is intentional, as the 2 are intended to be run together.
