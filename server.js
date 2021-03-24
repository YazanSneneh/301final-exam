'use strict';
// ......................................................................... Imported Packages
const express = require('express');
const superAgent = require('superagent');
const pg = require('pg');
const cors = require('cors');
const methodOverride = require('method-override');

// .............................................................................. Configurations
require('dotenv').config();
const app = express();
app.use(cors());
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT;
// const client = new pg.Client(process.env.DATABASE_URL);
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// .............................................................................. Routes
app.get('/', handleHomePage);
app.get('/CountryResult', HandleCountryResult);
app.get('/allCountires', handleAllCountriesRoute);
app.post('/myRecords', handleAddToMyRecordsRoute);
app.get('/myRecords', handleMyRecordsRoute);
app.get('/recordDetails/:id', handleViewOneRecordRoute);
app.delete('/recordDetails/:id', handleDeleteRecordRoute);
app.get('/*', handle404);

// .............................................................................. Handlers
function handleHomePage(req, res) {

    const url = 'https://api.covid19api.com/world/total';
    superAgent.get(url)
        .then(data => {
            let apiData = data.body;
            res.render('index', { stats: apiData })
        })
        .catch(error => console.log(error))
};

function HandleCountryResult(req, res) {
    const { country, dateFrom, dateTo } = req.query;
    const url = `https://api.covid19api.com/country/${country}/status/confirmed?from=${dateFrom}&to=${dateTo}`;

    superAgent.get(url).then(data => {
        res.render('country-Result', {
            cards: data.body
        })
    })
        .catch(error => console.log('error while calling data ', error))
};

function handleAllCountriesRoute(req, res) {
    const url = `https://api.covid19api.com/summary`;
    superAgent.get(url)
        .then(data => {
            let countires = data.body.Countries;
            let countriesArray = [];

            countires.forEach(country => {
                countriesArray.push(new Country(country.Country, country.TotalConfirmed, country.TotalDeaths, country.TotalRecovered, country.Date))
            });

            res.render('allCountries', { countries: countriesArray })
        })
        .catch(err => { console.log(err) })
}

function handleAddToMyRecordsRoute(req, res) {

    const insert = 'INSERT INTO covid (country, totalConfirmed, totalDeaths, totalRecovered, date) VALUES($1,$2,$3,$4,$5) RETURNING *;';
    let saveValues = [
        req.body.country,
        req.body.confirmed,
        req.body.deaths,
        req.body.recover,
        req.body.date
    ];
    client.query(insert, saveValues).then((data) => {
        res.redirect('myRecords')
    }).catch(err => console.log(err));
}

function handleMyRecordsRoute(req, res) {
    const viewAll = 'SELECT * FROM covid;';

    client.query(viewAll).then((data) => {
        res.render('myRecords', { records: data.rows })
    })
        .catch(err => console.log(err));
}

function handleViewOneRecordRoute(req, res) {
    const id = req.params.id;

    const countryDetailsQuery = 'SELECT * FROM covid WHERE id=$1;';
    const saveVal = [id];

    client.query(countryDetailsQuery, saveVal)
        .then(data => {
            res.render('recordDetails', { country: data.rows[0] })
        })
        .catch(err => console.log(err));
}

function handleDeleteRecordRoute(req, res) {
    const id = req.params.id;
    const deleteQuery = 'DELETE FROM covid WHERE id=$1;';
    const saveValues = [id];

    client.query(deleteQuery, saveValues)
        .then(() => {
            res.redirect('/myRecords');
        })
        .catch(error => console.log('error occured while deleting : ', error))

}

// .............................................................................. Data Model
function Country(country, TotalConfirmed, TotalDeaths, TotalRecovered, Date) {
    this.country = country;
    this.totalConfirmed = TotalConfirmed;
    this.totalDeaths = TotalDeaths;
    this.totalRecovered = TotalRecovered;
    this.date = Date || 'default date';
}

function handle404(req, res) {
    res.render('doesNotExist');
}

client.connect().then(() => {
    app.listen(PORT, () => {
        console.log('app is running')
    })
}).catch(e => console.log(e))

/*
requirements:
  * Display: resolution  Full HD 1920 x 1080.
           * size : 15 - 15.6 Inches
  * CPU : i7 10th generation, 3GHz.
  * Memory : 16GB of RAM.
  * Storage : 512GB SSD.
  * GPU : 2GB DDR5.
avoid:
   touchscreen
*/