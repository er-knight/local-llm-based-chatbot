FROM postgres:15.1-alpine

COPY 01-create-table.sql /docker-entrypoint-initdb.d/
COPY 02-insert-data.sql /docker-entrypoint-initdb.d/