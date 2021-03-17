DROP TABLE IF EXISTS;

CREATE TABLE covid(
    id SERIAL PRIMARY KEY NOT NULL,
   country VARCHAR(255),
   totalConfirmed VARCHAR(255),
   totalDeaths VARCHAR(255),
   totalRecovered VARCHAR(255),
   date VARCHAR(255)
)
