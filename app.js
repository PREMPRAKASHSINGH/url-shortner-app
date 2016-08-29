var path=require('path');
var express=require("express");
var mongoclient=require("mongodb").MongoClient;

var app=express();
var mongourl=process.env.MONGOLAB_URI;
console.log(mongourl);

var dbase=mongoclient.connect(mongourl,function(err,db) {
    if(err){
        throw err;
        process.exit(1);
    }

    else{
        console.log("mongodb connected");
        //return db;
    }
});

app.use(function(req,res,next){
req.db=dbase;
next();
});

app.use(function(req,res,next){
    console.log(req.path);
    next();
});
//taking requests not stored in db
app.get('/',function(req,res){
    res.sendFile(path.join(__dirname+"/public/index.html"));
})

app.get(/^\/[0-9]+$/,function(req,res){
    uri=req.protocol+"://"+req.get('host')+req.path;
    var obj={"short_url":uri};
    console.log("for sort url the obj is "+JSON.stringify(obj));
    mongoclient.connect(mongourl,function(err,db) {
            if(err){
                throw err;
                process.exit(1);
            }
        console.log("for sort url in conect");
            db.collection('short_urls').findOne(obj,function(e,data){
                if(e)
                    throw e;
                else{
                    if(data!==null){
                        console.log("for sort url in finding obj");
                        res.redirect(data.original_url);
                    }
                    else{
                        console.log("found nothing");
                        res.send("nothing");
                    }
                }
            });//insertion in db done
            //db.close();
        });

});

app.get('/*',function(req, res) {
    //var db=req.db.get();
    //console.log(dbase);
    var urls={};
    var randno;
    var original_url=req.params[0];
    var pattern=/^(https?:\/\/(www\.)?)([a-z0-9\.-]+)\.([a-z]+)\/?$/i;
    if(pattern.test(original_url)){
        urls.original_url=original_url;
        randno=Math.floor(Math.random()*10000+1000);
        urls.short_url=req.protocol+"://"+req.get('host')+"/"+randno;
        //insert urls into db
        mongoclient.connect(mongourl,function(err,db) {
            if(err){
                throw err;
                process.exit(1);
            }
            db.collection('short_urls').insert(urls,function(e,data){
                if(e)
                    throw e;
                else{
                    console.log("inserted successfully  & ack is "+JSON.stringify(data));
                }
            });//insertion in db done
            //db.close();
        });
        res.send("it is valid "+JSON.stringify(urls));

    }
    else{
    res.send("invalid url. see the pattern for the url on homepage");
    }
})

//requests done
//404 errors
app.use(function(req,res){
    res.send("404 not found.");
});


//aps listens on respective port
app.listen("3001",function(){
    console.log("node listening on port 3001");
});
