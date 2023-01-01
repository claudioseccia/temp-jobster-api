require('dotenv').config();
const connectDB = require('./db/connect');
const Job = require('./models/Job');
const jsonJobs = require('./mock-data.json');
//connect to db
const start = async () => {
	try {
		await connectDB(process.env.MONGO_URI);
		//since mock-data.json is an array we can pass it to 
		await Job.deleteMany(); //1.remove all the jobs in there
		await Job.create(jsonJobs);
		console.log('Successfully connected to DB!!!!');
		process.exit(0);
	} catch (error) {
		console.log(error);
		process.exit(1);
	}
};
start();
//run this file from command line ------> node populate
//connect to the module
//fill the db from json
