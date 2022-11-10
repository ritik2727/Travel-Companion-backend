const express = require('express');
const router = express.Router();

const { requireSignin, isAuth, isAdmin } = require('../controllers/auth');

const { userById, read, update, purchaseHistory,getUsers , deleteUser,getUserById,updateUser} = require('../controllers/user');


router.get('/secret', requireSignin, (req, res) => {
    res.json({
        user: 'got here yay'
    });
});

router.get("/user/list/:userId", requireSignin, isAuth, isAdmin,getUsers);
router.delete("/user/:customerId/:userId", requireSignin, isAuth, isAdmin, deleteUser);
router.get("/user/:customerId/:userId", requireSignin, isAuth, isAdmin,getUserById);
router.put("/user/:customerId/:userId", requireSignin, isAuth, isAdmin,updateUser);

router.get('/user/:userId', requireSignin, isAuth, read);
router.put('/user/:userId', requireSignin, isAuth, update);



router.get('/orders/by/user/:userId', requireSignin, isAuth, purchaseHistory);
// router.get('/users', requireSignin , isAuth, getUsers);


router.param('userId', userById);

module.exports = router;
