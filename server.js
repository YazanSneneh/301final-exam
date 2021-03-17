'use strict';
const express = require('express');
const superAgent = require('superagent');
const pg = require('pg');
const cors = require('cors');
const methodOverride = require('method-override');

require('dotenv').config();
const app = express();
app.use(cors());
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT;
// const client = new pg.Client(process.env.DATABASE_URL);   // on your machine
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }); // for heroku

app.get('/', (req, res) => {
    const url = 'https://api.covid19api.com/world/total';
    superAgent.get(url).then(data => {
        let apiData = data.body
        res.render('index', { viewData: apiData })
    }).catch(error => console.log(error))
})

app.get('/getCountryResult', (req, res) => {
    const { country, dateFrom, dateTo } = req.query;
    const url = `https://api.covid19api.com/country/${country}/status/confirmed?from=${dateTo}&todateTo`;

    superAgent.get(url).then(data => {

        res.render('country-Result', {
            cards: data.body
        })
    })
        .catch(error => console.log('error while calling data ', error))
});

app.get('/allCountires', (req, res) => {
    const url = `https://api.covid19api.com/summary`;
    superAgent.get(url)
        .then(data => {
            let countries = [];
            data.body.Countries.forEach(country => {
                countries.push(new Country(country.Country, country.TotalConfirmed, country.TotalDeaths, country.TotalRecovered, country.Data))
            });
            res.render('allCountries', { countries: countries })
        })
        .catch(err => { console.log(err) })
})

app.post('/myRecords', (req, res) => {

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
})

app.get('/myRecords', (req, res) => {

    const viewAll = 'SELECT * FROM covid;';

    client.query(viewAll).then((data) => {
        res.render('myRecords', { records: data.rows })
    })
        .catch(err => console.log(err));
})

app.get('/recordDetails/:id', (req, res) => {
    const id = req.params.id;
    const view = 'SELECT * FROM covid WHERE id=$1;';
    const saveVal = [id];
    client.query(view, saveVal).then(data => {
        res.render('recordDetails', { country: data.rows[0] })
    }).catch(err => console.log(err));
})

function Country(country, TotalConfirmed, TotalDeaths, TotalRecovered, Date) {
    this.country = country;
    this.totalConfirmed = TotalConfirmed;
    this.totalDeaths = TotalDeaths;
    this.totalRecovered = TotalRecovered;
    this.date = Date || 'default date';

}

client.connect().then(() => {
    app.listen(PORT, () => {
        console.log('app is running')
    })
}).catch(e => console.log(e))
