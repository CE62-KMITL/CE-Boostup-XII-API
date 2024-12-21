# CE Boostup XII Backend

## API

The `api` folder contains the main REST API server, this is the server that will be communicating with the frontend, the database and the compiler.

## Compiler

The `compiler` folder contains the internal compiler and executer service, this is an internal service the the main API server will use to compile and run any user-submitted code.

## Deployment

### Configuration
There are 3 required configuration files: `.env`, `api/.env` and `compiler/.env` all files have a `.env.example` counterpart for example configuration. You need to add those 3 configuration files first before proceeding with the deployment. More configuration details can be found in the `README.md` file in both the `api` and `compiler` folder.

The `.env` file on the project's root is for initializing the MariaDB database, these settings have to be the same as the ones in `/api/.env` otherwise the API server will not be able to connect to the database.

You may also want to change the resource limits for the compiler service in `docker-compose.yaml` and the database buffer pool size in `api/mariadb.cnf` if your machine have less than 8GB of RAM.

### Running with docker compose
Simply run `docker compose up -d --build` to start the application. Docker compose may raise an error about orphan containers, this is due to this and the frontend compose having the same name, this is intentional, as the 2 are intended to be run together.


## Usages and Flows

### Staffs
  - Signin: The account for staffs will most likely be created by the admin with password and be distributed to staffs, so use those credentials to signin
  - Adding problem: Navigate to the problem page, then click the add problem button, fill in the details, and save
  - Submitting problem for review: After adding and saving the problem, hit the submit for review button to submit the problem for reviewing by reviewers, doing this step will trigger the API server to check for correctness of the solution code against the testcases, failing this check will result in the problem not being submitted for review
  - Publishing problem: After the problem have been approved, you can publish the problem by hitting the publish button
  - Fixing problem: If the problem was rejected in the review stage, figure out what the reason from the review comment, then fix the issue, after that you can submit the problem for review again

### Reviewers
  - Review problem: If you have a reviewer role and navigated to a problem that is awaiting review (on v2 click on the edit problem button), you will be able to add a review comment and approve or reject the problem, if you're rejecting a problem, please add a comment as to why the problem was rejected

### Admin
  - Create accounts: Admin account can create staff and user account, account creation is only available on v2 frontend, navigate to users page and use the + button to create account
  - Modify accounts: Admin account can modify some aspects of staff and user account, account modification is only available on v2 frontend, navigate to users page and click on a user to modify the user, unavilable option will still show up but will not work
  - Create groups: Group creation is only available on v2 frontend, navigate to groups page and use the + button to create group
  - Modify groups: Group modification is only available on v2 frontend, navigate to groups page and click on a group to modify the group
  - Accounts initialization: To mass create staffs and user account, it is recommended to use a script to create multiple account by calling the APIs directly, for API "documentation" visit `{API_URL}/docs` for swagger UI
Note that deleting user or group may not work due to foreign keys in the database, there is no plan to fix this issue

### Users
  - Register: The register function does not actually add an account but set the password on an existing account that have to be created prior, thus the email used have to match with existing account, when the user click the register button, a registration email will be send to the user, after the user used the link in the email to confirm their email address, they can set their display name and password, after which the registration process is complete
  - Solving problem: When user navigate to a problem page, the user will be able to write code and run it through testcases or submit it, there 2 testcase types, example testcases is written by the problem author, and custom testcases is written by the user, the testcases that is used to validate a submission can be different that the example testcases

### Problem Approval Flow
  1. Draft : The problem was just created, it is in a draft state, can be change as desired by the author
  2. Awaiting Approval : The problem have been submitted for review, no changes can be made except to approve or reject the problem, only accounts with reviewer role can review a problem
  3. Approved : The problem have been approved but not published, users cannot see this problem, only problem author can publish the problem, the problem cannot be edited but can be reverted to draft, if reverted to draft, it will have to go through the review process again
  4. Rejected : The problem was rejected, changes cannot be made and the problem have to be reverted to draft first
  5. Published : The problem was published and users can see and make submission to this problem, the problem cannot be edited and can only be archived or deleted, this is to allow problematic problems to be removed
  6. Archived : The problem was archived, it is not visible to users and will not count toward a user or group score even if it was solved when it was not archived, cannot be edited

### User Account Creation and Registration
User accounts are not created by users but created by admins, the registration function for user accounts is more of a password reset of existing account. This is to prevent unauthorized access by people outside of the event and to allow groups to be pre-assigned by admins. The user ccounts have to be created before the event, preferably by a script. Emails for user accounts have to be collected separately. If a registration process was initiated with an email that does not match any of the accounts in the database, that registration process will fail.

### Staff Account Creation
Staff accounts can be created in the same way as user accounts, but it is generally better to create staff accounts with initialized password, this is because email providers' spam filter is as sensitive as a photon counter (it will block your mails before you know it) so the less mails you have to send, the better. If the account was created with password, the registration process can be skipped and the account credentials can be used for login directly.
