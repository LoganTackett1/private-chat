const express = require('express');
const {body,validationResult} = require('express-validator');
const User = require('../models/user');
const Message = require('../models/message');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');

/* GET home page. */
router.get('/',asyncHandler(async function(req, res, next) {
  let messages;
  if (!req.user) {
    messages = await Message.find({public:true}).exec();
  } else {
    messages = await Message.find().exec();
  }
  res.render('index', { title: 'Message Board',errors:null,user:req.user,messages:messages });
}));

router.post("/log-in",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/"
  })
);

router.get('/register',function(req,res,next) {
  res.render('register-form', {title: 'Sign Up:',errors:null});
});

router.post('/register',[
  body("username","Username must not be empty")
  .trim()
  .isLength({ min: 1 })
  .escape()
  .custom(async val => {
    if (/\s/.test(val)) {
      throw new Error("Username cannot contain spaces!");
    } else {
      const existingUser = await User.findOne({username:val}).exec();
      console.log(existingUser);
      if (existingUser) {
        throw new Error("Username is taken.");
      }
    }
  }),
  body("password","Password must not be empty")
  .trim()
  .isLength({ min: 1 })
  .escape()
  .custom(async val => {
    if (/\s/.test(val)) {
      throw new Error("Username cannot contain spaces!");
    }
  }),
  body("confpass","Passwords don't match")
  .trim()
  .isLength({ min: 1 })
  .escape(),
  asyncHandler(async (req,res,next) => {
    const errors = validationResult(req);

    if (req.body.password !== req.body.confpass) {
      res.render('register-form', {title: 'Sign Up:',errors:[{msg:"Passwords don't match!"}]});
    } else if (!errors.isEmpty()) {
        res.render('register-form', {title: 'Sign Up:',errors:errors.array()});
    } else {
      try {
        bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
          const user = new User({
            username: req.body.username,
            password: hashedPassword,
            admin: (req.body.admin === "true" ? true : false),
          });
          const result = await user.save();
          req.login(user, function(err) {
            if (err) { return next(err); }
            return res.redirect('/');
          });
        });
      } catch(err) {
        return next(err);
      };
    }
  })
]);

router.get("/log-out", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

router.get('/message',function(req,res,next) {
  res.render('message-form', { title: "Create Message",user:req.user,errors:null});
});

router.post('/message',[
  body("body","Body must not be empty")
  .trim()
  .isLength({min:1})
  .escape(),
  asyncHandler(async (req,res,next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.render('message-form',{ title: "Create Message",user:req.user,errors:errors});
    } else {
      try {
        if (req.user) {
          let visibility;
          if (req.body.visibility == "public") {
            visibility = true;
          } else {
            visibility = false;
          }
          const message = new Message({
            body: req.body.body,
            owner:req.user.id,
            username:req.user.username,
            public: visibility,
          });
          await message.save();
          res.redirect("/");
        } else {
          const message = new Message({
            body: req.body.body,
            owner:null,
            username:"Anonymous",
            public: true,
          });
          await message.save();
          res.redirect("/");
        }
      } catch (err) {
        return next(err);
      }
    }
  })
]);

router.post('/delete/:id',asyncHandler(async (req,res,next) => {
  await Message.findByIdAndDelete(req.params.id);
  res.redirect('/');
}))

module.exports = router;
