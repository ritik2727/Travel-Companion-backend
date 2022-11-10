const User = require("../models/user");
const { Order } = require("../models/order");
const { errorHandler } = require("../helpers/dbErrorHandler");


exports.userById = (req, res, next, id) => {
  User.findById(id).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User not found",
      });
    }
    req.profile = user;
    next();
  });
};

exports.read = (req, res) => {
  req.profile.hashed_password = undefined;
  req.profile.salt = undefined;
  return res.json(req.profile);
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = (req, res) => {
  User.find({}, (err, users) => {
    if (err || !users) {
      return res.status(400).json({
        error: "Users not found",
      });
    }
    return res.json(users);
  });
  // const users =  User.find({});
  // return res.json(users);
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = (req, res) => {
  User.findById(req.params.customerId).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User not found",
      });
    }
    user.remove();

    return res.json({ message: "User removed" });
    next();
  });

  // @desc    Get user by ID
  // @route   GET /api/users/:id
  // @access  Private/Admin


  // let user = User.findById(req.params.customerId);

  // if (user) {
  //     return res.json(user);
  // //  user.remove();
  // //   res.json({ message: "User removed" });
  // } else {
  //   res.status(404);
  //   throw new Error("User not found");
  // }
};
exports.getUserById = (req, res) => {
  User.findById(req.params.customerId).select("-password").exec((err, user) => {
    if (user) {
      return res.json(user);
    } else {
      return res.status(404).json({
        error: "User not found",
      });
    }
    next();
  
 
})
}
// exports.update = (req, res) => {
//     console.log('user update', req.body);
//     req.body.role = 0; // role will always be 0
//     User.findOneAndUpdate({ _id: req.profile._id }, { $set: req.body }, { new: true }, (err, user) => {
//         if (err) {
//             return res.status(400).json({
//                 error: 'You are not authorized to perform this action'
//             });
//         }
//         user.hashed_password = undefined;
//         user.salt = undefined;
//         res.json(user);
//     });
// };

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser =  (req, res) => {
 User.findById(req.params.customerId).exec((err, user) => {
  if (err || !user) {
    return res.status(400).json({
      error: "User not found",
    });
  }
  // if (!req.body.name) {
  //   return res.status(400).json({
  //     error: "Name is required",
  //   });
  // }

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    // user.isAdmin = req.body.isAdmin || user.isAdmin;
    user.role = req.body.role ;

    // const updatedUser = await user.save();

    user.save((err, updatedUser) => {
      
      if (err) {
        console.log("USER UPDATE ERROR", err);
        return res.status(400).json({
          error: "User update failed",
        });
      }
      updatedUser.hashed_password = undefined;
      updatedUser.salt = undefined;
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
       role: updatedUser.role,
      });
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
  
 
})

 
}


exports.update = (req, res) => {
  // console.log('UPDATE USER - req.user', req.user, 'UPDATE DATA', req.body);
  const { name, password } = req.body;

  User.findOne({ _id: req.profile._id }, (err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User not found",
      });
    }
    if (!name) {
      return res.status(400).json({
        error: "Name is required",
      });
    } else {
      user.name = name;
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          error: "Password should be min 6 characters long",
        });
      } else {
        user.password = password;
      }
    }

    user.save((err, updatedUser) => {
      if (err) {
        console.log("USER UPDATE ERROR", err);
        return res.status(400).json({
          error: "User update failed",
        });
      }
      updatedUser.hashed_password = undefined;
      updatedUser.salt = undefined;
      res.json(updatedUser);
    });
  });
};

exports.addOrderToUserHistory = (req, res, next) => {
  let history = [];

  req.body.order.products.forEach((item) => {
    history.push({
      _id: item._id,
      name: item.name,
      description: item.description,
      category: item.category,
      quantity: item.count,
      transaction_id: req.body.order.transaction_id,
      amount: req.body.order.amount,
    });
  });

  User.findOneAndUpdate(
    { _id: req.profile._id },
    { $push: { history: history } },
    { new: true },
    (error, data) => {
      if (error) {
        return res.status(400).json({
          error: "Could not update user purchase history",
        });
      }
      next();
    }
  );
};

exports.purchaseHistory = (req, res) => {
  Order.find({ user: req.profile._id })
    .populate("user", "_id name")
    .sort("-created")
    .exec((err, orders) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err),
        });
      }
      res.json(orders);
    });
};


