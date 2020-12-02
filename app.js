var debug = require('debug')('');

const http = require('http');
const express = require('express')
const app = express()
const router = express.Router()
const asyncHandler = require('express-async-handler');


const ClickHouse = require('@apla/clickhouse');

const clickhouse = new ClickHouse({
    host: "host.docker.internal",
    port: 8123,
    dataObjects: true,
    // readonly: true,
    queryOptions: {
        // profile: "web",
        database: "wizeflow",
        output_format_json_quote_denormals: 0,
        output_format_json_quote_64bit_integers: 0,
    },
});

// let query = `select * from wizeflow.tracks format CSVWithNames`;
let organization_id = '5d6e959d33a4580799462fb4';
// '5d6e959d33a4580799462fb4'
// '5e206394f53b822176f9b63e'
// '5dbad58fdd1fd83102c30ddc'
// '5e1d339a8e83bb218188da2a'
// '5e1dce468e83bb218188da2f'
// '5cff9b747e2a129e293e7bd3'
// '5cff9faf3e0ddfc737c314da'

let query = `select document_uuid, any(document_id) document_id, 
    countIf(action='ENTER') views, sum(duration) view_seconds
    from wizeflow.tracks
    where organization_id = '${organization_id}'
    group by document_uuid
    having views > 0
    order by view_seconds desc
    limit 10`;

// let query = "select organization_id,count() from wizeflow.tracks group by organization_id";

// const q = util.promisify(clickhouse.querying);
clickhouse.querying(query)
.then(result=>{
    console.log('Data:', result);
})
.catch(err => {
    console.log('Error:',err);
});
