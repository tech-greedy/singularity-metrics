# singularity-metrics

This repository contains an AWS lambda function that is used to process the emitted events from 
various singularity users.

## Build
```shell
npm run build
npm run zip
```

## Deployment
1. Create a PostSQL server and create a database (i.e. the default database postgres)
2. Create a table in the database using the schema in [create.sql](create.sql)
3. Create a lambda function (nodejs runtime) in AWS and upload the zip file created in the build step. (May need to upload to S3 first if it's too large)
4. Enable function URL or integrate with API Gateway
5. Change general configuration to use 512MB of memory and 15 minutes of timeout
6. Add environment variables
    - `DBNAME_PROD`: the database you've just created
    - `PGHOST`: the URL of the database
    - `PGPORT`: the port of the database
    - `PGUSER`: the user of the database
    - `PGPASSWORD`: the password of the database
