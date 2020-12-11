const Content = require('./models/Content.js');
const Document = require('./models/Document.js');
const Folder = require('./models/Folder.js');
const Member = require('./models/Member.js');
const Organization = require('./models/Organization.js');
const fs = require('fs');
const csvConverter = require('json-2-csv');

// const ClickHouse = require('@apla/clickhouse');
// const clickhouse = new ClickHouse({
//     host: "host.docker.internal",
//     port: 8123,
//     dataObjects: true,
//     // readonly: true,
//     queryOptions: {
//         // profile: "web",
//         database: "wizeflow",
//         output_format_json_quote_denormals: 0,
//         output_format_json_quote_64bit_integers: 0,
//     },
// });

const mongoose = require('mongoose');

const TrackSchema = new mongoose.Schema({
    //id: mongoose.Schema.Types.ObjectId,
    user: String,
    ip: String,
    field: Number,
    bearid: Number,
    lat: { type: Number, default: 0 },
    lon: { type: Number, default: 0 },
    action: String,
    fp: { type: String, default: "" },
    name: String, // NOT USED! [TODO] Delete it
    //os: String,
    ua: String,
    email: { type: String, default: "" },
    browser: { type: mongoose.Schema.Types.Mixed, default: null },
    engine: { type: mongoose.Schema.Types.Mixed, default: null },
    os: { type: mongoose.Schema.Types.Mixed, default: null },
    device: { type: mongoose.Schema.Types.Mixed, default: null }, // Always NULL. [TODO] Remove it
    cpu: { type: mongoose.Schema.Types.Mixed, default: null }, // Always NULL. [TODO] Remove it
    server_time: { type: Date, default: Date.now },
    doc_time: { type: Date, default: Date.now },
    timezone: { type: Number, default: 0 },
    custom: { type: mongoose.Schema.Types.Mixed, default: null },
    online: Boolean
});

mongoose.connect('mongodb://localhost:27017/creator',{
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
});

/*
// Production
mongoose.connect('mongodb://master:<password>@wizeflow-prod.cluster-ctcfk2m5eqck.eu-west-1.docdb.amazonaws.com:27017/creator',
    {
        useNewUrlParser: true,
        ssl: true,
        sslValidate: false,
        sslCA: fs.readFileSync('./rds-combined-ca-bundle.pem')
    }
);
*/

mongoose.connection.on('open', async function () {
    // const collections = Object.keys(mongoose.connection.collections);
    // console.log(collections);

    // let filter = { name: '9ed3bf0b-cd3a-450e-ab34-1d2071455af5' };
    let filter = {};
    mongoose.connection.db.listCollections(filter).toArray(async function (err, names) {
        if (err) {
            console.log(err);
        } else {
            let outputFile = new Date().toISOString()+'.csv';
            writeHeader(outputFile);

            for (let i = 0; i < names.length; i++) {
                console.log(names[i]);
                await processDocument(names[i],outputFile);
            }
            console.log('Done');
        }

        mongoose.connection.close();
    });
});

function writeHeader(file) {    
    const header = `"dt", "ms", "timezone", "session_id", "document_id", "document_uuid", "content_id", "organization_id", "project_id", "member_id", "user", "email", "fp", "action", "duration", "page", "page_id", "asset_id", "browser_major", "browser_name", "browser_version", "cpu_architecture", "device_model", "device_type", "device_vendor", "engine_name", "engine_version", "ip", "lat", "lon", "online", "os_name", "os_version", "ua", "old_stats_id"`;
    fs.writeFileSync(file,header+'\n');
}

async function processDocument(smartlink_info, outputFile) {
    const uuid = smartlink_info.name;
    // let uuid = "9ed3bf0b-cd3a-450e-ab34-1d2071455af5";

    if (!uuid.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) return;

    let smartlink = await Document.findOne({ uuid: uuid }).populate(['_content', '_folder', '_organization','_member']).exec();
    
    if ( smartlink == null ) {
        console.log( `Document ${uuid} doesn't exist` );
        return;
    }

    console.log(`Processing ${uuid} ...`);

    // Problem:
    // Old statistics have no PAGE_VIEW event, so we have to calculate it.
    // Other events can be saved to ClickHouse as is.
    // Solution:
    // We will do transfer in 2 parts:
    // 1) Transfer all events but BLUR & FOCUS
    // 2) Calculate duration and generate PAGE_VIEW event
    // Implementation of PAGE_VIEW:
    // We go over all the stats ordered by fingerprint(fp) and event's time (doc_time)
    // If this is OPEN, BLUR or EXIT, calculate duration from previuos action

    await generatePageViewEvents(uuid, smartlink, outputFile);

    // get all events
    const tracks = await getModel(uuid).find({
        $and: [
            { action: { $nin: ['PING', 'PAGE_VIEW'] } }
        ]
    }).sort({ doc_time: 1 }).exec();
    tracks.forEach(async track => {
        let event = getEvent(track, smartlink);
        console.log(event);
        saveEventToFile(event, outputFile);
    });
}

function saveEventToFile(event,file) {
    csvConverter.json2csv(event, (err,csvLine) => {
        if (err) throw err;
        fs.appendFileSync(file, csvLine + '\n');
    }, { prependHeader: false, delimiter:{field:","} });
}


// Generate PAGE_VIEW events
// Implementation of PAGE_VIEW:
// We go over all the stats ordered by fingerprint(fp) and event's time (doc_time)
// If this is OPEN, BLUR or EXIT, calculate duration from previuos action
async function generatePageViewEvents(uuid, smartlink, outputFile) {
    const tracks = await getModel(uuid).find({
        $and: [
            { fp: { '$exists': true, '$ne': "" } },
            { $or: [{ action: "OPEN" }, { action: "EXIT" }, { action: "FOCUS" }, { action: "BLUR" }] }
        ]
    }).sort({ fp: 1, doc_time: 1 }).exec();

    let prevEvent = null;
    let currentPage = 0;
    tracks.forEach(track => {
        let event = getEvent(track, smartlink);

        if (!!prevEvent && ['OPEN', 'BLUR', 'EXIT'].indexOf(event.action) >= 0) {
            let eventPageView = JSON.parse(JSON.stringify(prevEvent)); // copy object
            eventPageView.action = 'PAGE_VIEW';
            eventPageView.dt = event.dt;
            // in old stats maximal page view time is 900 seconds
            eventPageView.duration = Math.min(event.dt - prevEvent.dt, 900);
            eventPageView.page = currentPage;

            if (eventPageView.duration > 0) {
                console.log(eventPageView);

                saveEventToFile(eventPageView, outputFile);
            }

            prevEvent = null;
        }
        if (['OPEN', 'FOCUS'].indexOf(event.action) >= 0) prevEvent = event;
        // FOCUS has no page info, so we have to save page num from OPEN event
        if (['OPEN'].indexOf(event.action) >= 0) currentPage = event.page;

        console.log(event.action, 'currentPage:', currentPage);
    });    
}


function getEvent(track, document) {
    let event = {
        dt: Math.floor(track.doc_time/1000),
        ms: Math.floor((track.doc_time - Math.floor(track.doc_time)) * 1000),
        timezone: track.timezone,
        session_id: !!track.session_id ? track.session_id : '',
        document_id: document.id,
        document_uuid: document.uuid,
        content_id: !!document._content ? document._content.id : '',
        organization_id: document._organization.id,
        project_id: !!document._project ? document._project.id : '',
        member_id: !!document._member ? document._member.id : '',
        user: track.user,
        email: track.email,
        fp: track.fp,
        action: track.action,
        duration: !!track.duration ? parseInt(track.duration) : 0,
        page: !!track.page ? track.page : 0,
        page_id: !!track.page_id ? parseInt(track.page_id) : 0,
        asset_id: !!track.asset_id ? parseInt(track.asset_id) : 0,
        browser_major: !!track.engine && !!track.engine.major ? track.engine.major : '',
        browser_name: !!track.browser && !!track.browser.name ? track.browser.name : '',
        browser_version: !!track.browser && !!track.browser.version ? track.browser.version : '',
        cpu_architecture: !!track.cpu && !!track.cpu.architecture ? track.cpu.architecture : '',
        device_model: !!track.device && !!track.device.model ? track.device.model : '',
        device_type: !!track.device && !!track.device.type ? track.device.type : '',
        device_vendor: !!track.device && !!track.device.vendor ? track.device.vendor : '',
        engine_name: !!track.engine && !!track.engine.name ? track.engine.name : '',
        engine_version: !!track.engine && !!track.engine.version ? track.engine.version : '',
        ip: !!track.ip ? track.ip : '',
        lat: !!track.lat && !isNaN(track.lat)? track.lat : 0,
        lon: !!track.lon && !isNaN(track.lon) ? track.lon : 0,
        online: (!track.online || "true" == track.online) ? 1 : 0,
        os_name: !!track.os && !!track.os.name ? track.os.name : '',
        os_version: !!track.os && !!track.os.version ? track.os.version : '',
        ua: !!track.ua ? track.ua : '',
        old_stats_id: track.id,
    }

    if ("OPEN" == event.action) event.page = track.field;

    return event;
}


function sendEventToClickHouse(event) {
    console.log(`Sending to ClickHouse ${event.old_stats_id} ...`);
    process.exit(0);
}



// let query = `select * from wizeflow.tracks format CSVWithNames`;
// // const q = util.promisify(clickhouse.querying);
// clickhouse.querying(query)
// .then(result=>{
//     console.log('Data:', result);
// })
// .catch(err => {
//     console.log('Error:',err);
// });

function calculateTime(fps, pages, document_view, fp, now, fpChanged, last, oldPage, oldDate, date, blur, inactive) {
    var current = null;
    var max = false;
    var diff = 0;
    if (fpChanged || last) {
        current = now;
    } else {
        current = date.getTime();
    }
    // Be sure to have OPEN a page before
    if (oldDate != 0) {
        assertPageAndFP(pages, oldPage, fp);
        if (blur != null) {
            if (oldDate != 0) {
                diff = blur - oldDate.getTime() - inactive;
            } else {
                diff = current - blur - inactive;
            }
        } else {
            if (oldDate != 0) {
                diff = current - oldDate.getTime() - inactive;
            } else {
                diff = current - inactive;
            }
        }
        if (diff > MAX_MILLI_DIFF7) {
            diff = MAX_MILLI_DIFF7;
            max = true;
        }
        if (max || (!fpChanged && !last)) {
            diff = parseInt(diff / 1000) * 1000;
            pages[oldPage - 1][fp] += diff;
            pages[oldPage - 1]['nb_view']++;
            if ((new Date(pages[oldPage - 1]['last_opened'].time)) < oldDate) {
                pages[oldPage - 1]['last_opened'] = { fp: fp, time: oldDate };
            }
            document_view.push({ page: oldPage, time: diff, date: oldDate });
        }
    }

    return max;
}


function assertPageAndFP(pagesfull, oldPage, fp) {
    if (typeof pagesfull[oldPage - 1] == "undefined") {
        pagesfull[oldPage - 1] = [];
    }
    if (typeof pagesfull[oldPage - 1][fp] == "undefined") {
        pagesfull[oldPage - 1][fp] = 0;
    }
    if (typeof pagesfull[oldPage - 1]['last_opened'] == "undefined") {
        pagesfull[oldPage - 1]['last_opened'] = { time: 0 };
    }
    if (typeof pagesfull[oldPage - 1]['nb_view'] == "undefined") {
        pagesfull[oldPage - 1]['nb_view'] = 0;
    }
}

function getModel(collection) {
    return mongoose.model('Track', TrackSchema, collection);
}