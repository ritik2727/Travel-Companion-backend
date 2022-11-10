const express = require('express');
const router = express.Router();
const { requireSignin, isAuth, isAdmin } = require('../controllers/auth');

const { couponCreate, couponDelete, couponList} = require('../controllers/couponController');
const { userById } = require('../controllers/user');



router.post("/user/couponcreate/:userId", requireSignin, isAuth, isAdmin,couponCreate);
router.get("/couponlist/:userId", requireSignin, isAuth,couponList);
router.delete("/coupondelete/:coupId/:userId", requireSignin, isAuth, isAdmin,couponDelete);



router.param('userId', userById);

module.exports = router;