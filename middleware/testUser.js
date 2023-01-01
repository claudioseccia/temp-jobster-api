//check if the user is a testUser 
//get the bad request
const {BadRequestError} = require('../errors');
const testUser = (req,res,next) => {
    if(req.user.testUser) {
        throw new BadRequestError("Test user, read only");
    }
    next();
}
module.exports = testUser;