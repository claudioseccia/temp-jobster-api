const express = require('express')
const testUser = require("../middleware/testUser");

const router = express.Router()
const {
  createJob,
  deleteJob,
  getAllJobs,
  updateJob,
  getJob,
  showStats
} = require('../controllers/jobs')

// router.route('/').post(createJob).get(getAllJobs)
router.route('/').post(testUser, createJob).get(getAllJobs); //add testUser guard middleware to make test user readonly

//Stats
router.route('/stats').get(showStats);

// router.route('/:id').get(getJob).delete(deleteJob).patch(updateJob)
//add testUser guard middleware to make test user readonly:
router.route('/:id').get(getJob).delete(testUser, deleteJob).patch(testUser, updateJob); 

module.exports = router
