import mongoose from "mongoose";
const {Schema}=mongoose;
const schema=new Schema({url:{type:String,required:true,trim:true,maxlength:2048},publicId:{type:String,required:true,trim:true,maxlength:300,unique:true},folder:{type:String,required:true,trim:true,maxlength:200},alt:{type:String,trim:true,maxlength:200,default:""},caption:{type:String,trim:true,maxlength:500,default:""},mimeType:{type:String,trim:true,maxlength:100,default:"image"},bytes:{type:Number,min:0,max:5242880,default:0},width:{type:Number,min:0,default:null},height:{type:Number,min:0,default:null},uploadedBy:{type:Schema.Types.ObjectId,ref:"User",required:true,immutable:true}},{timestamps:true,versionKey:false,strict:"throw"});
schema.index({createdAt:-1});schema.index({folder:1,createdAt:-1});
export default mongoose.models.MediaAsset||mongoose.model("MediaAsset",schema);
