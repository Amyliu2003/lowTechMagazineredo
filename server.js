const express = require("express"); 
const multer = require("multer"); 
const bodyParser = require("body-parser"); 

const app = express();

const nedb = require("@seald-io/nedb");
let database = new nedb({
  filename: "database.txt",
  autoload: true,
});

const urlEncodedParser = bodyParser.urlencoded({ extended: true });
const upload = multer({
    dest: "public/uploads",
  });


app.use(express.static("public")); 
app.use(urlEncodedParser);
app.set("view engine", "ejs"); 


app.get("/", (request, response) => {
  let queryFeatured = { feature: "featured" };
  let sortQuery = { timestamp: -1 };

  database.find(queryFeatured).sort(sortQuery).limit(1).exec((err, featuredPost) => {
    if (err) {
      console.error("Error fetching featured post:", err);
      return response.status(500).send("Error fetching posts");
    }

    if (featuredPost.length > 0) {
      fetchRestOfPosts(featuredPost[0]);
    } else {
      database.find({}).sort(sortQuery).limit(1).exec((err, newFeaturedPost) => {
        if (err) {
          console.error("Error fetching new featured post:", err);
          return response.status(500).send("Error fetching posts");
        }
        fetchRestOfPosts(newFeaturedPost[0]);
      });
    }
  });

  function fetchRestOfPosts(featured) {
    let featuredPostId = featured._id; 
    let queryRest = { _id: { $ne: featuredPostId } };

    database.find(queryRest).sort(sortQuery).exec((err, restOfPosts) => {
      if (err) {
        console.error("Error fetching the rest of the posts:", err);
        return response.status(500).send("Error fetching posts");
      }

      response.render("index.ejs", { featuredPost: featured, posts: restOfPosts });
    });
  }
});



app.get("/submit", (request, response) => {
    response.render('submit.ejs',{});
});

app.post("/upload", upload.single("theImage"), (request, response) => {
  console.log(request.body);

  let currDate = new Date();

  let data = {
    title:request.body.title,
    feature:request.body.feature,
    summary:request.body.summary,
    articleBody: request.body.articleBody,
    date: currDate.toLocaleString(),
    timestamp: currDate.getTime(),
  };

  if(request.file){
    data.imageSrc="uploads/"+request.file.filename;
  }


  database.insert(data, (err, newData) => {
    console.log(newData);
    response.redirect("/");
  });
});

app.get("/article", (request, response) => {
  let query = {};
  let sortQuery = {
    timestamp: -1,
  };

  database
  .find(query)
  .sort(sortQuery)
  .exec((err, data) => {
    response.render('article.ejs',{posts:data});
  });
});

app.get("/article/:id", (req, res)=>{

  let id = req.params.id

  let query = {
    _id: id
  }

  // we use the findOne method because we only want 1 post to be shown
  database.findOne(query, (err, individualPost)=>{
    res.render("singlePost.ejs", {post: individualPost})
  })
})



app.listen(3000, () => {
    console.log("server started on port 3000");
  });

  