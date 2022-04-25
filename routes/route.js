const express = require('express');
const router = express.Router();
const authorController = require('../controllers/authorController');
const blogController = require('../controllers/blogController');
const middleware = require('../middlewares/auth')

router.post('/author', authorController.createAuthor);

router.post('/blog', blogController.createBlog);

router.get('/blogs',blogController.getBlogs);

router.put('/blogs/:blogId', middleware.auth ,blogController.updateBlog);

router.delete('/blog/:blogId',middleware.auth, blogController.deleteById);

router.delete('/delete/:blogId',middleware.auth, blogController.deleteByQuery);

router.post('/login', authorController.authorLogIn);

module.exports=router