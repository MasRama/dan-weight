import config from '../../knexfile';

require('dotenv').config()
const dbInstance = {};

const stage = process.env.DB_CONNECTION || 'development';
let DB = require('knex')(config[stage]);

DB.connection = (connectionStage = stage) => { 
    if(dbInstance[connectionStage]) {
        return dbInstance[connectionStage];
    }
    
    dbInstance[connectionStage] = require('knex')(config[connectionStage]);
    return dbInstance[connectionStage];
}

export default DB;
