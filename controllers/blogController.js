const { query } = require("express");
const { type } = require("express/lib/response");
const { default: mongoose } = require("mongoose");
const authorModel = require("../models/authorModel");
const blogModel = require("../models/blogModel");
const ObjectId=mongoose.Types.ObjectId

const isValid=function(value){
  if(typeof value ==='undefined' || value===null)return false
  if(typeof value==='string' && value.trim().length===0)return false
  return true;
}
const isValidRequestBody=function(requestBody){
  return Object.keys(requestBody).length>0
}
const isValidObjectId=function(ObjectId){
  return mongoose.Types.ObjectId.isValid(ObjectId)
}
const createBlog = async (req, res) => {
  try {
    const requestBody=req.body;
    if(!isValidRequestBody(requestBody)){
      res.status(400).send({status:false,message:'invalid reqquest parameter.please provide blog details'})
      return
    }
    const {title,body,authorId,tags,category,subcategory,ispublished}=requestBody
    if(!isValid(title)){
      res.status(400).send({status:false,message:'title is required'})
      return
    }
    if(!isValid(body)){
      res.status(400).send({status:false,message:'body is required'})
      return
    }
    if(!isValid(authorId)){
      res.status(400).send({status:false,message:'author id is required'})
      return
    }
    if(!isValidObjectId(authorId)){
      res.status(400).send({status:false,message:`${authorId} is not a valid author id`})
      return

    }
    if(!isValid(category)){
      res.status(400).send({status:false,message:'blog category is required'})
      return
    }
    const author=await authorModel.findById(authorId)
    if(!author){
      res.status(400).send({status:false,message:'Author does not exit'})
      return
    }
    // validation end
    const blogData={
      title,
      body,
      authorId,
      category,
      ispublished:ispublished ? ispublished: false,
      publishedAt:ispublished ? new Date():null
    }
    if(tags){
      if(Array.isArray(tags)){
        blogData['tags']=[...tags]
      }
      if(Object.prototype.toString.call(tags)=== "[object String]"){
        blogData['tags']=[tags]
      }
    }
    if(subcategory){
      if(Array.isArray(subcategory)){
        blogData['subcategory']=[...subcategory]
      }
      if(Object.prototype.toString.call(subcategory)=== "[object String]"){
        blogData['subcategory']=[subcategory]
      }
    }
    const newBlog=await blogModel.create(blogData)
    res.status(201).send({status:true,message:'newblog created successfully',data:newBlog})


  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

const getBlogs = async (req, res) => {
  try {
    const filterQuery={isDeleted:false,deletedAt:null,ispublished:true}
    const queryParams=req.query
    if(isValidRequestBody(queryParams)){
      const{authorId,category,tags,subcategory}=queryParams
      if(isValid(authorId) && isValidObjectId(authorId)){
        filterQuery['authorId']=authorId
      }
      if(isValid(category)){
        filterQuery['category']=category.trim()
      }
      if(isValid(tags)){
        const tagsArr=tags.trim().split(',').map(tag=>tag.trim());
        filterQuery['tags']={$all:tagsArr}
      }
      if(isValid(subcategory)){
        const subcatArr=subcategory.trim().split(',').map(subcat=>subcat.trim());
        filterQuery['subcategory']={$all:subcatArr}
      }

    }
    const blogs=await blogModel.find(filterQuery)
    if(Array.isArray(blogs) && blogs.length===0){
      res.status(400).send({status:false,message:'no blogs found'})
      return

    }
    res.status(201).send({status:true,message:'blogs list',data:blogs})


  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

const updateBlog = async (req, res) => {
  try {
      const requestBody=req.body
      const params=req.params
      const blogId=params.blogId
      const authorIdFromToken=req.authorId

      if(!isValidObjectId(blogId)){
        res.status(400).send({status:false,message:`${blogId} is not a valid blog id`})
        return
  
      }if(!isValidObjectId(authorIdFromToken)){
        res.status(400).send({status:false,message:`${authorIdFromToken} is not a valid author id`})
        return
  
      }
      const blog=await blogModel.findOne({_id:blogId,isDeleted:false,deletedAt:null})
      if(!blog){
        res.status(404).send({status:false,message:'blog not found'})
        return
      }
      if(blog.authorId.toString() !== authorIdFromToken){
        res.status(401).send({status:false,message:'Unauthorised access ! owner info does not match'})
        return
      }
      if(!isValidRequestBody(requestBody)){
        res.status(200).send({status:true,message:'No parameters passed.Blog unmodified'})
        return
      }
      const{title,body,tags,category,subcategory,ispublished}=requestBody
      const updatedBlogData={}

      if(isValid(title)){
        if(!Object.prototype.hasOwnProperty.call(updatedBlogData,'$set')) updatedBlogData['$set']={}
        updatedBlogData['$set']['title']=title
      }
      if(isValid(body)){
        if(!Object.prototype.hasOwnProperty.call(updatedBlogData,'$set')) updatedBlogData['$set']={}
        updatedBlogData['$set']['body']=body
      }
      if(isValid(category)){
        if(!Object.prototype.hasOwnProperty.call(updatedBlogData,'$set')) updatedBlogData['$set']={}
        updatedBlogData['$set']['category']=category
      }
      if(ispublished !== undefined){
        if(!Object.prototype.hasOwnProperty.call(updatedBlogData,'$set')) updatedBlogData['$set']={}
        updatedBlogData['$set']['ispublished']=ispublished
        updatedBlogData['$set']['publishedAt']=ispublished ? new Date() : null
      }
      if(tags){
        if(!Object.prototype.hasOwnProperty.call(updatedBlogData,'$addToSet')) updatedBlogData['$addToSet']={}
        if(Array.isArray(tags)){
          updatedBlogData['$addToSet']['tags']={ $each :[...tags]}
        }
        if(typeof tags==="string"){
          updatedBlogData['$addToSet']['tags']=tags
        }
      }
      if(subcategory){
        if(!Object.prototype.hasOwnProperty.call(updatedBlogData,'$addToSet')) updatedBlogData['$addToSet']={}
        if(Array.isArray(subcategory)){
          updatedBlogData['$addToSet']['subcategory']={ $each :[...subcategory]}
        }
        if(typeof subcategory==="string"){
          updatedBlogData['$addToSet']['subcategory']=subcategory
        }
      }

      const updatedBlog=await blogModel.findOneAndUpdate({_id:blogId},updatedBlogData,{new:true})
      res.status(200).send({status:true,message:'blog updated successfully',data:updatedBlog})

   
  } catch (error) {
    res.status(500).json({ msg: "Error", Error: error.message });
  }
};

const deleteById = async (req, res) => {
  try {
    const params=req.params
    const blogId = params.blogId;
    const authorIdFromToken=req.authorId

    if(!isValidObjectId(blogId)){
      res.status(400).send({status:false,message:`${blogId} is not a valid blog id`})
      return
    }
    if(!isValidObjectId(authorIdFromToken)){
      res.status(400).send({status:false,message:`${authorIdFromToken} is not a valid token id`})
      return
    }

    const blog=await blogModel.findOne({_id:blogId,isDeleted:false,deletedAt:null})
    if(!blog){
      res.status(404).send({status:false,message:'  blog not found'})
      return
    }
    if(blog.authorId.toString() !== authorIdFromToken){
      res.status(401).send({status:false,message:' Unauthorised access! owner details doesnot match'})
      return

    }
    await blogModel.findOneAndUpdate({_id:blogId},{$set:{isDeleted:true,deletedAt:new Date()}})
    res.status(200).send({status:true,message:' deleted successfully'})
   


  } catch (error) {
    res.status(500).json({ msg: "Error", Error: error.message });
  }
};

const deleteByQuery = async (req, res) => {
    try {
        const filterQuery={isDeleted:false,deletedAt:null}
        const queryParams=req.query
        const authorIdFromToken=req.authorId
        

        if(!isValidObjectId(authorIdFromToken)){
          res.status(400).send({status:false,message:`${authorIdFromToken} is not a valid token id`})
          return
        }
        if(!isValidRequestBody(queryParams)){
          res.status(400).send({status:false,message:"no query params recived"})
          return
        }
        const {authorId,category,tags,subcategory,ispublished}=queryParams
        if(isValid(authorId)&& isValidObjectId(authorId)){
          filterQuery['authorId']=authorId
        }
        if(isValid(category)){
          filterQuery['category']=category.trim()
        }
        if(isValid(ispublished)){
          filterQuery['ispublished']=ispublished
        }
        if(isValid(tags)){
          const tagsArr=tags.trim().split(',').map(tag => tag.trim());
          filterQuery['tags']={$all:tagsArr}
        }
        if(isValid(subcategory)){
          const subCatArr=subcategory.trim().split(',').map(subcat => subcat.trim());
          filterQuery['subcategory']={$all:subCatArr}
        }
        const blogs=await blogModel.find(filterQuery)
        if(Array.isArray(blogs)&& blogs.length ===0){
          res.status(404).send({status:false,message:' no matching blog found'})
          return
        }
        const idOfBlogsToDelete=blogs.map(blog=>{
          if(blog.authorId.toString() ===authorIdFromToken) return blog._id
        })
        if(idOfBlogsToDelete.length===0){
          res.status(404).send({status:false,message:' no  blogs found'})
          return
        }
        await blogModel.updateMany({_id:{$in:idOfBlogsToDelete}},{$set:{isDeleted:true,deletedAt:new Date()}})
        res.status(200).send({status:true,message:'blogs deleted successfully'})
    } catch (error) {
        res.status(500).json({ msg: "Error", Error: error.message });
    }
}


module.exports = {
  createBlog,
  getBlogs,
  updateBlog,
  deleteById,
  deleteByQuery,
  
};
