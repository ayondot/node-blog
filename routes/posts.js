var express = require('express');
var router = express.Router();
var mongo = require('mongodb');
var db = require('monk')('localhost/nodeblog');
var categories;

router.get('/show/:id', function(req, res, next){
	var posts = db.get('posts');
	posts.findById(req.params.id, function(err, post){
		res.render('show', {
			"post": post
		});
	});
});

router.use('/add', function(req, res, next){
	categories = db.get('categories');
	next();
});

router.get('/add', function(req, res, next){
	categories.find({}, {}, function(err, categories){
			res.render('addpost', {
			"title": "Add Post",
			"categories": categories
		});
	});
});
 
router.post('/add', function(req, res, next){
	// Get Form Values
	var title 		=	req.body.title;
	var category 	= 	req.body.category;
	var body 		= 	req.body.body;
	var author 		= 	req.body.author;
	var date 		= 	new Date();

	if(req.files[0]){
		//var mainImageOriginalName 	= 	req.files[0].originalname;
		var mainImageName 			= 	req.files[0].filename;
		// var mainImageMime 			= 	req.files[0].mimetype;
		// var mainImagePath 			= 	req.files[0].path;
		// var mainImageExt 			= 	req.files[0].extension;
		// var mainImageSize 			= 	req.files[0].size;
	}else{
		var mainImageName = 'noimage.png';
	}

	// Form Validation
	req.checkBody('title','Title field is required').notEmpty();
	req.checkBody('body', 'Body field is required').notEmpty();

	// Check Errors
	var errors = req.validationErrors();

	if(errors){
		res.render('addpost', {
			"errors": errors,
			"title": title,
			"categories": categories,
			"body": body
		});
	}else{
		var posts = db.get('posts');

		// Submit to DB
		posts.insert({
			"title": title,
			"body": body,
			"category": category,
			"date": date,
			"author": author,
			"mainimage": mainImageName
		}, function(err, post){
			if(err){
				res.send('There was an issue submitting the post');
			}else{
				req.flash('success', 'Post Submitted');
				res.location('/');
				res.redirect('/');
			}
		});
	}
});

router.post('/addcomment', function(req, res, next){
	// Get Form Values
	var name 			=	req.body.name;
	var email 			= 	req.body.email;
	var body 			= 	req.body.body;
	var postid 			= 	req.body.postid;
	var commentdate 	= 	new Date();

	// Form Validation
	req.checkBody('name', 'Name field is required').notEmpty();
	req.checkBody('email', 'E-mail field is required').notEmpty();
	req.checkBody('email', 'E-mail is not formatted correctly').isEmail();
	req.checkBody('body', 'Body field is required').notEmpty();

	// Check Errors
	var errors = req.validationErrors();

	if(errors){
		var posts = db.get('posts');
		posts.findById(postid, function(err, post){
			res.render('show', {
				"errors": errors,
				"post": post
			});
		});

	}else{
		var comment = { "name": name, "email": email, "body": body, "commentdate": commentdate };

		var posts = db.get('posts');
		
		// Submit to DB
		posts.update({
				"_id":postid
			},
			{
				$push:{
					"comments": comment
				}
			}, 
			function(err, doc){
				if(err){
					throw err;
				}else{
					req.flash('success', 'Comment Added');
					res.location('/posts/show/' + postid);
					res.redirect('/posts/show/' + postid);
				}
			}
		);		
	}
});

module.exports = router;