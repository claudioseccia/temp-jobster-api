
const Job = require('../models/Job');
const { StatusCodes } = require('http-status-codes')
const { BadRequestError, NotFoundError } = require('../errors')

const mongoose = require('mongoose');
const moment = require("moment");

const getAllJobs = async (req, res) => {
  const {search, status, jobType, sort} = req.query;
  
  // console.log("req.query", req.query);

  //protected route
  const queryObject = {
    createdBy: req.user.userId
  }
  
  //if isset search param
  if (search) {
    queryObject.position = { $regex: search, $options: 'i' };
  }
  console.log(queryObject);

  //add status based on condition
  if (status && status !== 'all') {
    queryObject.status = status;
  }
  if (jobType && jobType !== 'all') {
    queryObject.jobType = jobType;
  }
  //NO AWAIT since we perform more operations in between
  let result = Job.find(queryObject);

  //chain sort condition
  if (sort === 'latest') {
    result = result.sort('-createdAt');
  }
  if (sort === 'oldest') {
    result = result.sort('createdAt');
  }
  if (sort === 'a-z') {
    result = result.sort('position');
  }
  if (sort === 'z-a') {
    result = result.sort('-position');
  }
  //setup pagination
  const page = Number(req.query.page) || 1; //page num, if not set in the request is 1
  const limit = Number(req.query.limit) || 10; //number of results per page, if not set in the request is set to 10
  const skip = (page - 1) * limit; //get to the next pages
  console.log('skip',skip);
  
  result = result.skip(skip).limit(limit);

  const jobs = await result;

  const totalJobs = await Job.countDocuments(queryObject); //total number of results, sent back in the response
  const numOfPages = Math.ceil(totalJobs / limit); //number of pages, rounded up, sent back in the response

  res.status(StatusCodes.OK).json({ jobs, totalJobs, numOfPages });
  // const jobs = await Job.find({ createdBy: req.user.userId }).sort('createdAt')
  // res.status(StatusCodes.OK).json({ jobs, count: jobs.length })
}

const getJob = async (req, res) => {
  const {
    user: { userId },
    params: { id: jobId },
  } = req

  const job = await Job.findOne({
    _id: jobId,
    createdBy: userId,
  })
  if (!job) {
    throw new NotFoundError(`No job with id ${jobId}`)
  }
  res.status(StatusCodes.OK).json({ job })
}

const createJob = async (req, res) => {
  req.body.createdBy = req.user.userId
  const job = await Job.create(req.body)
  res.status(StatusCodes.CREATED).json({ job })
}

const updateJob = async (req, res) => {
  const {
    body: { company, position },
    user: { userId },
    params: { id: jobId },
  } = req

  if (company === '' || position === '') {
    throw new BadRequestError('Company or Position fields cannot be empty')
  }
  const job = await Job.findByIdAndUpdate(
    { _id: jobId, createdBy: userId },
    req.body,
    { new: true, runValidators: true }
  )
  if (!job) {
    throw new NotFoundError(`No job with id ${jobId}`)
  }
  res.status(StatusCodes.OK).json({ job })
}

const deleteJob = async (req, res) => {
  const {
    user: { userId },
    params: { id: jobId },
  } = req

  const job = await Job.findByIdAndRemove({
    _id: jobId,
    createdBy: userId,
  })
  if (!job) {
    throw new NotFoundError(`No job with id ${jobId}`)
  }
  res.status(StatusCodes.OK).send()
}

const showStats = async (req, res) => {
  let stats = await Job.aggregate([
    { $match: { createdBy: mongoose.Types.ObjectId(req.user.userId) }},
    { $group: { _id: '$status', count: {$sum: 1} }}
  ]);
  // console.log('stats',stats);
  stats = stats.reduce((acc,curr)=>{
    const {_id: title, count} = curr;
    acc[title] = count;
    return acc;
  },{});
  console.log('stats',stats);
  const defaultStats = {
    pending: stats.pending || 0,
    interview: stats.interview || 0,
    declined: stats.declined || 0,
  }
  //monthlyApplications (for stats)
  let monthlyApplications = await Job.aggregate([
    { $match: { createdBy: mongoose.Types.ObjectId(req.user.userId) }},
    {
      $group: {
        _id: {year:{$year:'$createdAt'}, month:{$month:'$createdAt'}},
        count: {$sum: 1} 
      },
    },
    {
      $sort: {'_id.year': -1,'_id.month': -1}
    },
    {
      $limit: 6
    }
  ]);
  //desired format to be returned to FE, ex:
  //[{ date: 'Dec 2022', count: 3 },...] 
  //.reverse(); to get the latest month, always
  monthlyApplications = monthlyApplications.map(item=>{
    const{_id:{year,month}, count} = item;
    const date = moment().month(month-1).year(year).format('MMM Y');
    return {date, count};
  }).reverse();
  console.log(monthlyApplications);
  res
    .status(StatusCodes.OK)
    .json({ defaultStats, monthlyApplications });
};
module.exports = {
  createJob,
  deleteJob,
  getAllJobs,
  updateJob,
  getJob,
  showStats
}
